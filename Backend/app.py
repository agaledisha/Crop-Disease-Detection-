from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
 
import os, io, json, datetime, logging, uuid, requests
import numpy as np
from PIL import Image
 
# ── Optional imports ──────────────────────────────────────────────────────────
try:
    from tensorflow.keras.models import load_model as tf_load_model
except Exception:
    tf_load_model = None
 
try:
    from google import genai as google_genai
except Exception:
    google_genai = None
 
# ─────────────────────────────────────────────────────────────────────────────
# BOOTSTRAP
# ─────────────────────────────────────────────────────────────────────────────
 
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, "soil_data.db")
 
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(name)s — %(message)s",
)
logger = logging.getLogger("crop-doctor")
 
# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
 
app.config.update(
    SQLALCHEMY_DATABASE_URI        = f"sqlite:///{DB_PATH}",
    SQLALCHEMY_TRACK_MODIFICATIONS = False,
    SECRET_KEY                     = os.getenv("SECRET_KEY", "cropai-dev-secret-2025"),
)
 
db = SQLAlchemy(app)
 
GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY",      "")
OPENROUTER_API_KEY  = os.getenv("OPENROUTER_API_KEY",  "")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
 
gemini_client = None
if GEMINI_API_KEY and google_genai:
    try:
        gemini_client = google_genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini client initialized")
    except Exception as e:
        logger.warning(f"Gemini init failed: {e}")
 
# ─────────────────────────────────────────────────────────────────────────────
# AI MODEL
# ─────────────────────────────────────────────────────────────────────────────

# ✅ FIXED: Support both "model.h5" and "crop_model (1).h5" automatically
def find_model_path():
    candidates = [
        os.path.join(BASE_DIR, "model.h5"),
        os.path.join(BASE_DIR, "crop_model (1).h5"),
        os.path.join(BASE_DIR, "crop_model.h5"),
    ]
    for path in candidates:
        if os.path.exists(path):
            logger.info(f"Found model at: {path}")
            return path
    logger.warning("No model file found. Tried: " + str(candidates))
    return None

MODEL_PATH  = find_model_path()
LABELS_PATH = os.path.join(BASE_DIR, "labels.txt")
TARGET_SIZE = (224, 224)
ai_model    = None
class_names = []
 
def load_ai_model():
    global ai_model, class_names
    if tf_load_model is None:
        logger.warning("TensorFlow not installed — detection unavailable")
        return
    if not MODEL_PATH:
        logger.warning("No model.h5 found — detection endpoint returns 503")
        return
    try:
        ai_model = tf_load_model(MODEL_PATH, compile=False)
        if os.path.exists(LABELS_PATH):
            with open(LABELS_PATH, encoding="utf-8") as f:
                class_names = [l.strip() for l in f if l.strip()]
        else:
            class_names = [f"class_{i}" for i in range(ai_model.output_shape[-1])]
        logger.info(f"Model loaded — {len(class_names)} classes")
    except Exception as e:
        logger.error(f"Model load error: {e}")
 
load_ai_model()
 
# ─────────────────────────────────────────────────────────────────────────────
# DATABASE MODELS
# ─────────────────────────────────────────────────────────────────────────────
 
class User(db.Model):
    __tablename__ = "users"
    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.datetime.utcnow)
 
    def set_password(self, pwd):
        self.password_hash = generate_password_hash(pwd)
 
    def check_password(self, pwd):
        return check_password_hash(self.password_hash, pwd)
 
    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}
 
 
class SoilTestBooking(db.Model):
    __tablename__    = "soil_test_bookings"
    id               = db.Column(db.Integer, primary_key=True)
    farmer_name      = db.Column(db.String(100))
    contact          = db.Column(db.String(50))
    address          = db.Column(db.String(200))
    preferred_center = db.Column(db.String(100))
    booking_date     = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    status           = db.Column(db.String(50), default="Pending")
 
 
class DiseaseDetection(db.Model):
    __tablename__ = "disease_detections"
    id         = db.Column(db.Integer, primary_key=True)
    disease    = db.Column(db.String(100))
    confidence = db.Column(db.String(50))
    date       = db.Column(db.DateTime, default=datetime.datetime.utcnow)
 
 
class ForumPost(db.Model):
    __tablename__ = "forum_posts"
    id        = db.Column(db.Integer, primary_key=True)
    name      = db.Column(db.String(100))
    title     = db.Column(db.String(200))
    message   = db.Column(db.Text)
    image     = db.Column(db.String(200))
    likes     = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
 
 
class ForumReply(db.Model):
    __tablename__ = "forum_replies"
    id        = db.Column(db.Integer, primary_key=True)
    post_id   = db.Column(db.Integer, db.ForeignKey("forum_posts.id"))
    name      = db.Column(db.String(100))
    message   = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# DATABASE INIT
# ─────────────────────────────────────────────────────────────────────────────
 
def init_database():
    with app.app_context():
        if os.path.exists(DB_PATH):
            try:
                from sqlalchemy import inspect as sa_inspect
                inspector = sa_inspect(db.engine)
                tables    = inspector.get_table_names()
                if "user" in tables:
                    cols = [c["name"] for c in inspector.get_columns("user")]
                    if "password_hash" not in cols:
                        logger.warning("Old schema found — rebuilding database")
                        db.session.remove()
                        db.engine.dispose()
                        os.remove(DB_PATH)
            except Exception as e:
                logger.error(f"Schema check error: {e}")
                try:
                    db.session.remove()
                    db.engine.dispose()
                    os.remove(DB_PATH)
                except Exception:
                    pass
 
        db.create_all()
        logger.info("Database tables ready")
 
        try:
            if not User.query.first():
                demo_users = [
                    ("Rajesh Patil",  "farmer@cropai.com", "farm123"),
                    ("Admin User",    "admin@cropai.com",  "admin123"),
                    ("Disha Agatrao", "disha@cropai.com",  "disha123"),
                ]
                for name, email, pwd in demo_users:
                    u = User(name=name, email=email)
                    u.set_password(pwd)
                    db.session.add(u)
                db.session.commit()
                logger.info("Demo users seeded")
        except Exception as e:
            logger.error(f"Seed error: {e}")
            db.session.rollback()
 
init_database()
 
# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
 
def success(data: dict, status: int = 200):
    return jsonify({"success": True, **data}), status
 
def error(msg: str, status: int = 400):
    return jsonify({"success": False, "error": msg}), status
 
def preprocess_image(raw: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(raw)).convert("RGB").resize(TARGET_SIZE)
    arr = np.array(img, dtype=np.float32)  # NO /255 - model has built-in Rescaling(1/255) layer
    return np.expand_dims(arr, 0)


# ─────────────────────────────────────────────────────────────────────────────
# ✅ IMPROVED is_leaf_image — works for live camera photos too
# ─────────────────────────────────────────────────────────────────────────────

def is_leaf_image(raw: bytes) -> bool:
    """
    Returns True if the image is likely a plant leaf.
    Works for dataset images AND live camera photos.

    Logic:
    - Resize to 128x128 for better sampling
    - Count pixels where green channel is dominant
    - Also allow brownish/yellowish leaf pixels (diseased leaves)
    - Reject solid white/grey/black (paper, stone, plastic)
    - Reject images with zero color variance (flat objects)
    """
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB").resize((128, 128))
        arr = np.array(img, dtype=np.float32)

        r = arr[:, :, 0]
        g = arr[:, :, 1]
        b = arr[:, :, 2]

        total_pixels = 128 * 128
        brightness   = (r + g + b) / 3.0

        # ── Green pixels (healthy leaf) ───────────────────────────
        # Green dominant, not too dark, not washed out white
        green_mask = (
            (g > r) &
            (g > b) &
            ((g - r) > 8) &
            (brightness > 25) &
            (brightness < 240)
        )
        green_ratio = np.sum(green_mask) / total_pixels

        # ── Brownish/yellowish pixels (diseased or dry leaf) ──────
        # High R+G, low B → brown/yellow tones
        brown_yellow_mask = (
            (r > 80) &
            (g > 60) &
            (b < 120) &
            ((r + g) > (2 * b + 40)) &
            (brightness > 30) &
            (brightness < 230)
        )
        brown_ratio = np.sum(brown_yellow_mask) / total_pixels

        # ── Color variance check ──────────────────────────────────
        # Flat objects (paper, stone, plastic) have very low variance
        r_std = float(np.std(r))
        g_std = float(np.std(g))
        b_std = float(np.std(b))
        color_variance = (r_std + g_std + b_std) / 3.0

        # ── Reject nearly white or nearly black images ────────────
        mean_brightness = float(np.mean(brightness))
        is_too_white    = mean_brightness > 220
        is_too_dark     = mean_brightness < 15

        # ── Reject very flat/uniform color (plastic, paper) ───────
        is_flat = color_variance < 10.0

        # ── Decision ──────────────────────────────────────────────
        # Accept if: enough green OR enough brown/yellow tones
        # AND not flat, not too white, not too dark
        leaf_color_ratio = green_ratio + (brown_ratio * 0.5)

        result = (
            leaf_color_ratio > 0.06 and
            not is_flat and
            not is_too_white and
            not is_too_dark
        )

        logger.info(
            f"Leaf check — green:{green_ratio:.3f} brown:{brown_ratio:.3f} "
            f"variance:{color_variance:.1f} brightness:{mean_brightness:.1f} → {'LEAF' if result else 'NOT LEAF'}"
        )
        return result

    except Exception as e:
        logger.error(f"is_leaf_image error: {e}")
        return True   # fail open — don't block on error

 
ADVISORY_DB = {
    "blight": {
        "symptoms":   ["Dark brown lesions with yellow halo", "Yellowing from leaf edges", "Premature leaf drop"],
        "causes":     ["Alternaria fungus", "High humidity", "Infected seeds or soil"],
        "treatment":  ["Apply Mancozeb 2g/L", "Remove infected leaves", "Copper-based spray every 7-10 days"],
        "prevention": ["Use certified disease-free seeds", "Proper plant spacing", "Avoid overhead irrigation"],
    },
    "rust": {
        "symptoms":   ["Orange-brown pustules on leaf surface", "Yellow spots", "Premature defoliation"],
        "causes":     ["Puccinia fungus", "Wind-borne spores", "Humid warm conditions"],
        "treatment":  ["Apply Propiconazole 25% EC", "Remove infected debris", "Systemic fungicide spray"],
        "prevention": ["Plant rust-resistant varieties", "Monitor crop regularly", "Avoid dense planting"],
    },
    "bacterial": {
        "symptoms":   ["Water-soaked lesions", "Yellowing around spots", "Wilting in severe cases"],
        "causes":     ["Bacterial pathogen (Xanthomonas)", "Splashing water", "Infected tools"],
        "treatment":  ["Apply Copper Hydroxide 3g/L", "Remove infected plant parts", "Avoid overhead irrigation"],
        "prevention": ["Use disease-free seeds", "Sanitize farming tools", "Crop rotation"],
    },
    "mite": {
        "symptoms":   ["Tiny yellow/brown spots on upper leaf", "Webbing under leaves", "Leaf curling"],
        "causes":     ["Spider mite infestation", "Hot dry weather", "Dusty conditions"],
        "treatment":  ["Apply Abamectin or Spiromesifen", "Spray water to wash off mites", "Neem oil spray"],
        "prevention": ["Avoid water stress", "Keep surroundings clean", "Use reflective mulch"],
    },
    "virus": {
        "symptoms":   ["Leaf curling or mosaic patterns", "Yellowing between veins", "Stunted growth"],
        "causes":     ["Virus spread by whiteflies or aphids", "Infected planting material"],
        "treatment":  ["Remove and destroy infected plants", "Control whitefly/aphid vectors", "No chemical cure for virus"],
        "prevention": ["Use virus-resistant varieties", "Control insect vectors early", "Avoid working in wet conditions"],
    },
    "mold": {
        "symptoms":   ["Yellowish patches on upper leaf surface", "Olive-green mold on underside", "Leaf drop"],
        "causes":     ["Passalora fulva fungus", "High humidity", "Poor air circulation"],
        "treatment":  ["Apply Chlorothalonil 2g/L", "Improve ventilation", "Remove infected leaves"],
        "prevention": ["Maintain proper spacing", "Avoid excess humidity", "Use resistant varieties"],
    },
    "default": {
        "symptoms":   ["Yellowing of leaves", "Brown spots or lesions", "Wilting or drooping", "Powdery coating"],
        "causes":     ["Fungal or bacterial infection", "Nutrient deficiency", "Environmental stress"],
        "treatment":  ["Apply appropriate fungicide", "Remove infected leaves", "Improve drainage"],
        "prevention": ["Use resistant varieties", "Crop rotation", "Avoid overhead watering"],
    },
}
 
FERTILIZER_MAP = {
    "blight": [
        {"name": "Copper Oxychloride 50% WP", "type": "Chemical", "purpose": "Fungicidal control",      "usage": "2g/L water, spray every 10 days"},
        {"name": "Mancozeb 75% WP",           "type": "Chemical", "purpose": "Broad spectrum fungicide", "usage": "2.5g/L, every 7 days"},
        {"name": "Neem Cake",                 "type": "Organic",  "purpose": "Soil health",              "usage": "100g per plant at base"},
    ],
    "rust": [
        {"name": "Propiconazole 25% EC", "type": "Chemical", "purpose": "Systemic rust control",    "usage": "1mL/L water, fortnightly"},
        {"name": "Sulfur 80% WDG",       "type": "Chemical", "purpose": "Fungal spore suppression", "usage": "3g/L, avoid hot sun"},
    ],
    "healthy": [
        {"name": "NPK 19-19-19", "type": "Chemical", "purpose": "Balanced nutrition",        "usage": "5g/L water, monthly"},
        {"name": "Vermicompost", "type": "Organic",  "purpose": "Long-term soil fertility",  "usage": "2kg/sq.m into topsoil"},
    ],
    "default": [
        {"name": "NPK 19-19-19",   "type": "Chemical", "purpose": "Balanced growth booster",   "usage": "5g/L water, fortnightly"},
        {"name": "Vermicompost",   "type": "Organic",  "purpose": "Improve soil nutrients",     "usage": "2kg/sq.m into topsoil"},
        {"name": "Neem Cake",      "type": "Organic",  "purpose": "Pest & fungus suppression",  "usage": "100g per plant at base"},
        {"name": "DAP Fertilizer", "type": "Chemical", "purpose": "Root & shoot development",   "usage": "5g/L during vegetative stage"},
    ],
}
 
def get_advisory(label):
    lc = label.lower()
    if "blight" in lc:          return ADVISORY_DB["blight"]
    if "rust" in lc:            return ADVISORY_DB["rust"]
    if "bacterial" in lc:       return ADVISORY_DB["bacterial"]
    if "mite" in lc:            return ADVISORY_DB["mite"]
    if "virus" in lc or "curl" in lc or "mosaic" in lc: return ADVISORY_DB["virus"]
    if "mold" in lc:            return ADVISORY_DB["mold"]
    return ADVISORY_DB["default"]

def get_fertilizer(label):
    lc = label.lower()
    if "healthy" in lc:         return FERTILIZER_MAP["healthy"]
    if "blight" in lc:          return FERTILIZER_MAP["blight"]
    if "rust" in lc:            return FERTILIZER_MAP["rust"]
    return FERTILIZER_MAP["default"]
 
# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────
 
@app.route("/")
def home():
    return success({
        "message":      "Smart Crop Doctor API v3.0",
        "model_loaded": ai_model is not None,
        "classes":      len(class_names),
    })
 
# ── Auth ──────────────────────────────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    data     = request.get_json() or {}
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()
    if not name or not email or not password:
        return error("name, email, and password are required")
    if len(password) < 6:
        return error("Password must be at least 6 characters")
    if User.query.filter_by(email=email).first():
        return error("Email already registered", 409)
    u = User(name=name, email=email)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    return success({"user": u.to_dict(), "token": str(uuid.uuid4())}, 201)
 
@app.route("/api/auth/login", methods=["POST"])
def login():
    data     = request.get_json() or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    u = User.query.filter_by(email=email).first()
    if not u or not u.check_password(password):
        return error("Invalid email or password", 401)
    return success({"user": u.to_dict(), "token": str(uuid.uuid4())})
 
# ── Detection ─────────────────────────────────────────────────────────────────
@app.route("/api/detect-disease", methods=["POST"])
def detect_disease():
    if ai_model is None:
        return error("AI model not loaded. Place model.h5 or 'crop_model (1).h5' in backend folder.", 503)
    if "file" not in request.files:
        return error("Image file is required")
 
    raw = request.files["file"].read()


    # ✅ Step 1: Check if it's a leaf image
    if not is_leaf_image(raw):
        return jsonify({
            "success": False,
            "is_leaf": False,
            "error": "This is not a plant leaf. Please upload a valid crop leaf image."
        }), 422

    # ✅ Step 2: Run AI prediction
    try:
        preds = ai_model.predict(preprocess_image(raw), verbose=0)
        idx   = int(np.argmax(preds[0]))
        conf  = float(np.max(preds[0])) * 100
        label = class_names[idx] if idx < len(class_names) else "Unknown"
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return error("Detection failed", 500)

    # ✅ Step 3: Get ALL predictions for smart analysis
    try:
        all_sorted_idx  = np.argsort(preds[0])[::-1]
        top5_conf = [(class_names[i], float(preds[0][i]) * 100) for i in all_sorted_idx[:5] if i < len(class_names)]
    except:
        top5_conf = []

    # ✅ Step 4: Confidence threshold — 70% minimum
    CONFIDENCE_THRESHOLD = 70.0

    if conf < CONFIDENCE_THRESHOLD:
        logger.info(f"Low confidence ({conf:.2f}%) for '{label}' — rejecting")
        return jsonify({
            "success":         False,
            "is_leaf":         True,
            "is_supported":    False,
            "confidence":      f"{conf:.2f}%",
            "top_predictions": [{"label": l, "confidence": f"{c:.2f}%"} for l, c in top5_conf[:3]],
            "error":           f"Detection confidence is too low ({conf:.2f}%). This crop may not be supported or image quality is poor.",
            "supported_crops": ["Tomato", "Potato", "Pepper Bell"],
            "tips": [
                "Upload a clear, close-up photo of a single leaf",
                "Use natural daylight — avoid flash or dark conditions",
                "Place leaf on a plain white/light background",
                "Make sure the leaf fills most of the image frame",
                "Supported crops: Tomato, Potato, Pepper Bell only"
            ]
        }), 422

    # ✅ Step 5: Smart cross-crop disease correction
    # Tomato Late Blight & Potato Late Blight are caused by same pathogen
    # Tomato Early Blight & Potato Early Blight look nearly identical
    # → Check if a Potato version of same disease appears in top-5

    DISEASE_CROSSMAP = {
        "Tomato_Late_blight":   "Potato___Late_blight",
        "Tomato_Early_blight":  "Potato___Early_blight",
        "Tomato_Bacterial_spot":"Pepper__bell___Bacterial_spot",
    }

    final_label = label
    cross_note  = None

    label_lower = label.lower()

    # Check if top-5 has a potato version with significant confidence
    top5_labels = {l: c for l, c in top5_conf}

    for tomato_label, potato_label in DISEASE_CROSSMAP.items():
        if label == tomato_label and potato_label in top5_labels:
            potato_conf = top5_labels[potato_label]
            # If Potato version has >= 10% confidence, show warning
            if potato_conf >= 10.0:
                cross_note = {
                    "message":       f"Note: This disease also affects Potato plants. If you uploaded a Potato leaf, this may be '{potato_label.replace('___', ' ').replace('_', ' ')}'.",
                    "alt_label":     potato_label,
                    "alt_confidence": f"{potato_conf:.2f}%"
                }
                logger.info(f"Cross-crop note added: {tomato_label} → {potato_label} ({potato_conf:.2f}%)")
            break

    # Extract crop name
    if "tomato" in label_lower:
        detected_crop = "Tomato"
    elif "potato" in label_lower:
        detected_crop = "Potato"
    elif "pepper" in label_lower:
        detected_crop = "Pepper Bell"
    else:
        detected_crop = "Unknown"

    logger.info(f"Detection: {label} | Crop: {detected_crop} | Conf: {conf:.2f}%")

    db.session.add(DiseaseDetection(disease=label, confidence=f"{conf:.2f}%"))
    db.session.commit()

    response = {
        "is_leaf":          True,
        "is_supported":     True,
        "prediction_label": final_label,
        "detected_crop":    detected_crop,
        "confidence":       f"{conf:.2f}%",
        "top_predictions":  [{"label": l, "confidence": f"{c:.2f}%"} for l, c in top5_conf[:3]],
        "advisory":         get_advisory(final_label),
        "fertilizers":      get_fertilizer(final_label),
    }

    if cross_note:
        response["cross_crop_note"] = cross_note

    return success(response)
 
# ── Weather ───────────────────────────────────────────────────────────────────
@app.route("/api/weather")
def weather():
    
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    if not lat or not lon: return error("lat and lon required")
    if not OPENWEATHER_API_KEY: return error("OPENWEATHER_API_KEY not in .env", 503)
    try:
        d = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric",
            timeout=8
        ).json()
        return success({
            "temp":       d.get("main", {}).get("temp"),
            "humidity":   d.get("main", {}).get("humidity"),
            "wind_speed": d.get("wind", {}).get("speed"),
            "condition":  d.get("weather", [{}])[0].get("description", "unknown"),
            "city":       d.get("name", ""),
        })
    except Exception:
        return error("Weather API failed", 502)
 
# ── Schemes ───────────────────────────────────────────────────────────────────
@app.route("/api/gov-schemes")
def gov_schemes():
    lang = request.args.get("lang", "en")
    path = os.path.join(BASE_DIR, "gov_schemes.json")
    if not os.path.exists(path): return success({"schemes": []})
    try:
        with open(path, encoding="utf-8") as f: data = json.load(f)
        return success({"schemes": data.get(lang) or data.get("en", [])})
    except Exception: return success({"schemes": []})
 
# ── Soil Booking ──────────────────────────────────────────────────────────────
@app.route("/api/book-soil-test", methods=["POST"])
def book_soil_test():
    data = request.get_json() or {}
    b = SoilTestBooking(
        farmer_name=data.get("farmer_name","").strip(),
        contact=data.get("contact","").strip(),
        address=data.get("address","").strip(),
        preferred_center=data.get("preferred_center",""),
    )
    db.session.add(b); db.session.commit()
    return success({"booking_id": b.id, "status": "Pending"}, 201)
 
# ── Dashboard ─────────────────────────────────────────────────────────────────
@app.route("/dashboard/last-detection")
def last_detection():
    det = DiseaseDetection.query.order_by(DiseaseDetection.date.desc()).first()
    if not det: return jsonify(None)
    return jsonify({"disease": det.disease, "confidence": det.confidence, "date": det.date.strftime("%Y-%m-%d")})
 
@app.route("/dashboard/latest-soil-booking")
def latest_booking():
    b = SoilTestBooking.query.order_by(SoilTestBooking.booking_date.desc()).first()
    if not b: return jsonify(None)
    return jsonify({"farmer_name": b.farmer_name, "status": b.status, "date": b.booking_date.strftime("%Y-%m-%d")})
 
@app.route("/dashboard/stats")
def dashboard_stats():
    return success({
        "total_detections": DiseaseDetection.query.count(),
        "total_bookings":   SoilTestBooking.query.count(),
        "total_posts":      ForumPost.query.count(),
        "total_users":      User.query.count(),
    })
 
# ── Chatbot ───────────────────────────────────────────────────────────────────
chat_memory: list = []
 
@app.route("/api/chat", methods=["POST"])
def chat_ai():
    global chat_memory
    data  = request.get_json() or {}
    query = (data.get("query") or "").strip()
    lang  = data.get("lang", "en")
    lang_name = data.get("language_name", "English")
 
    if not query: return error("query is required")
    if not OPENROUTER_API_KEY: return error("OPENROUTER_API_KEY not in .env", 503)
 
    chat_memory.append({"role": "user", "content": query})
    chat_memory = chat_memory[-8:]
 
    # ✅ Strong language instruction
    lang_instruction = {
        "en": "You MUST respond ONLY in English. Do not use any other language.",
        "mr": "तुम्ही फक्त मराठी भाषेत उत्तर द्या. इतर कोणत्याही भाषेत उत्तर देऊ नका. संपूर्ण उत्तर मराठीत असणे आवश्यक आहे.",
        "hi": "आप केवल हिंदी भाषा में जवाब दें। किसी अन्य भाषा का उपयोग न करें। पूरा जवाब हिंदी में होना चाहिए।",
    }.get(lang, "You MUST respond ONLY in English.")
 
    prompt = (
        f"You are an expert agriculture AI advisor for Indian farmers.\n"
        f"LANGUAGE RULE: {lang_instruction}\n"
        f"Give practical, actionable farming advice.\n\n"
        f"Conversation:\n"
        + "\n".join(f"{m['role']}: {m['content']}" for m in chat_memory[-6:])
        + f"\n\nFarmer question: {query}"
        + f"\n\nIMPORTANT: Your response MUST be entirely in {lang_name}."
    )
 
    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type":  "application/json",
                "HTTP-Referer":  "http://localhost:3000",
                "X-Title":       "Smart Crop Doctor",
            },
            json={
                "model":    "openai/gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            },
            timeout=20,
        )
        answer = resp.json()["choices"][0]["message"]["content"]
        chat_memory.append({"role": "assistant", "content": answer})
        return success({"response": answer})
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return error("AI service unavailable", 502)
 
# ── Voice Assistant ───────────────────────────────────────────────────────────
@app.route("/api/voice-assistant", methods=["POST"])
def voice_assistant():
    data  = request.get_json() or {}
    query = (data.get("query") or "").strip()
    lang  = data.get("lang", "en")
    if not query: return error("query is required")
    if gemini_client:
        try:
            resp = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=f"Agriculture AI for Indian farmers. Answer in {lang}:\n{query}"
            )
            text = resp.text if hasattr(resp, "text") and resp.text else resp.candidates[0].content.parts[0].text
            return success({"response": text})
        except Exception as e:
            logger.error(f"Gemini error: {e}")
    if OPENROUTER_API_KEY:
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"},
                json={"model": "openai/gpt-3.5-turbo", "messages": [{"role": "user", "content": f"Answer in {lang} for Indian farmer: {query}"}]},
                timeout=15,
            )
            return success({"response": resp.json()["choices"][0]["message"]["content"]})
        except Exception as e:
            logger.error(f"Voice fallback error: {e}")
    return error("Voice AI not configured. Add GEMINI_API_KEY to .env", 503)
 
# ── Forum ─────────────────────────────────────────────────────────────────────
@app.route("/api/forum", methods=["GET"])
def get_forum_posts():
    limit = min(int(request.args.get("limit", 6)), 50)
    skip  = max(int(request.args.get("skip", 0)), 0)
    posts = ForumPost.query.order_by(ForumPost.timestamp.desc()).offset(skip).limit(limit).all()
    return success({
        "posts": [{"id": p.id, "name": p.name, "title": p.title, "message": p.message,
                   "image": p.image, "likes": p.likes, "timestamp": p.timestamp.isoformat()} for p in posts],
        "total": ForumPost.query.count(),
    })
 
@app.route("/api/forum", methods=["POST"])
def create_forum_post():
    data = request.get_json() or {}
    if not data.get("title") or not data.get("message"): return error("title and message required")
    p = ForumPost(name=data.get("name","Anonymous"), title=data["title"], message=data["message"])
    db.session.add(p); db.session.commit()
    return success({"id": p.id}, 201)
 
@app.route("/api/forum/<int:pid>", methods=["DELETE"])
def delete_post(pid):
    p = ForumPost.query.get_or_404(pid); db.session.delete(p); db.session.commit()
    return success({"deleted": pid})
 
@app.route("/api/forum/<int:pid>", methods=["PUT"])
def update_post(pid):
    p = ForumPost.query.get_or_404(pid); data = request.get_json() or {}
    p.title   = data.get("title",   p.title)
    p.message = data.get("message", p.message)
    db.session.commit(); return success({"updated": pid})
 
@app.route("/api/forum/<int:pid>/like", methods=["POST"])
def like_post(pid):
    p = ForumPost.query.get_or_404(pid); p.likes += 1; db.session.commit()
    return success({"likes": p.likes})
 
@app.route("/api/forum/<int:pid>/unlike", methods=["POST"])
def unlike_post(pid):
    p = ForumPost.query.get_or_404(pid)
    if p.likes > 0: p.likes -= 1
    db.session.commit(); return success({"likes": p.likes})
 
@app.route("/api/forum/<int:pid>/reply", methods=["POST"])
def reply_post(pid):
    data = request.get_json() or {}
    r = ForumReply(post_id=pid, name=data.get("name","Anonymous"), message=data.get("message",""))
    db.session.add(r); db.session.commit(); return success({"reply_id": r.id}, 201)
 
@app.route("/api/forum/<int:pid>/replies", methods=["GET"])
def get_replies(pid):
    replies = ForumReply.query.filter_by(post_id=pid).order_by(ForumReply.timestamp).all()
    return success({"replies": [{"id": r.id, "name": r.name, "message": r.message,
                                 "timestamp": r.timestamp.isoformat()} for r in replies]})
 
# ─────────────────────────────────────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────────────────────────────────────
 
if __name__ == "__main__":
    print("\n" + "="*55)
    print("  Smart Crop Doctor API  v3.0")
    print("  http://localhost:5000")
    print(f"  Model loaded   : {ai_model is not None}")
    print(f"  Model path     : {MODEL_PATH}")
    print(f"  Classes        : {len(class_names)}")
    print(f"  Gemini         : {'active' if gemini_client else 'not configured'}")
    print(f"  OpenRouter     : {'active' if OPENROUTER_API_KEY else 'missing in .env'}")
    print(f"  Weather        : {'active' if OPENWEATHER_API_KEY else 'missing in .env'}")
    print("  Demo logins:")
    print("    farmer@cropai.com / farm123")
    print("    admin@cropai.com  / admin123")
    print("    disha@cropai.com  / disha123")
    print("="*55 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=True)