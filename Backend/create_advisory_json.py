"""
This script reads your labels.txt (list of crop disease classes)
and generates advisory_solutions.json automatically with
English, Hindi, and Marathi advisories and fertilizer suggestions.

✅ Usage:
    python create_advisory_json.py --labels labels.txt --out advisory_solutions.json
"""

import os
import json
import argparse

# ----- Advisory templates (you can customize later) -----
EN_TEMPLATES = {
    "healthy": {
        "short": "Crop looks healthy.",
        "detailed": "No visible disease symptoms detected. Continue regular cultivation and monitoring.",
        "fertilizer": "Apply balanced NPK as per crop stage."
    },
    "non_leaf_object": {
        "short": "Please upload a leaf image only.",
        "detailed": "This image doesn't look like a crop leaf. Please upload a clear photo of a leaf with a plain background.",
        "fertilizer": ""
    },
    "blight": {
        "short": "Blight infection detected.",
        "detailed": "Symptoms indicate blight infection. Use Mancozeb 2.5g/L or Copper Oxychloride 3g/L spray for control.",
        "fertilizer": "Avoid excess nitrogen; use potash-rich fertilizer."
    },
    "rust": {
        "short": "Rust-like infection found.",
        "detailed": "Orange or brown powder spots indicate rust. Apply Sulphur or Mancozeb-based fungicide.",
        "fertilizer": "Use balanced NPK fertilizer."
    },
    "mildew": {
        "short": "Mildew detected.",
        "detailed": "White or gray patches indicate powdery/downy mildew. Spray Carbendazim or Dinocap.",
        "fertilizer": "Use phosphorus fertilizer to strengthen plant resistance."
    },
    "bacterial": {
        "short": "Bacterial infection suspected.",
        "detailed": "Water-soaked spots suggest bacterial infection. Use Copper Hydroxide 3g/L and avoid overhead irrigation.",
        "fertilizer": "Use micronutrient sprays; reduce nitrogen."
    },
    "spot": {
        "short": "Leaf spot disease detected.",
        "detailed": "Brown or black spots indicate fungal infection. Use Chlorothalonil or Mancozeb fungicide.",
        "fertilizer": "Add potassium and zinc fertilizer."
    },
    "default": {
        "short": "Possible crop disease detected.",
        "detailed": "Disease detected. Follow agricultural expert advice and apply treatment accordingly.",
        "fertilizer": "Follow local fertilizer guidelines."
    }
}

HI_TEMPLATES = {
    "healthy": {
        "short": "फसल स्वस्थ है।",
        "detailed": "कोई रोग के लक्षण नहीं दिख रहे हैं। नियमित देखभाल जारी रखें।",
        "fertilizer": "फसल की अवस्था अनुसार संतुलित NPK दें।"
    },
    "non_leaf_object": {
        "short": "कृपया केवल पत्ते की फोटो अपलोड करें।",
        "detailed": "यह फोटो पत्ते जैसा नहीं लगता। साफ पृष्ठभूमि पर पत्ते की फोटो लें।",
        "fertilizer": ""
    },
    "blight": {
        "short": "ब्लाइट का संक्रमण पाया गया।",
        "detailed": "ब्लाइट के लक्षण दिख रहे हैं। Mancozeb या Copper Oxychloride का छिड़काव करें।",
        "fertilizer": "ज्यादा नाइट्रोजन से बचें; पोटाशयुक्त उर्वरक दें।"
    },
    "rust": {
        "short": "रस्ट संक्रमण पाया गया।",
        "detailed": "नारंगी या भूरे धब्बे रस्ट फफूंदी के लक्षण हैं। सल्फर या मैनकोजेब स्प्रे करें।",
        "fertilizer": "संतुलित NPK का प्रयोग करें।"
    },
    "mildew": {
        "short": "मिल्ड्यू संक्रमण पाया गया।",
        "detailed": "सफेद या ग्रे धब्बे मिल्ड्यू का संकेत हैं। Carbendazim का छिड़काव करें।",
        "fertilizer": "फॉस्फोरस उर्वरक का प्रयोग करें।"
    },
    "bacterial": {
        "short": "बैक्टीरियल संक्रमण संदिग्ध है।",
        "detailed": "पानी जैसे धब्बे बैक्टीरिया संक्रमण के लक्षण हैं। Copper Hydroxide छिड़कें।",
        "fertilizer": "सूक्ष्म पोषक तत्व का उपयोग करें।"
    },
    "spot": {
        "short": "पत्तों पर धब्बे दिखे हैं।",
        "detailed": "फफूंद रोग हो सकता है। Chlorothalonil या Mancozeb का प्रयोग करें।",
        "fertilizer": "पोटाश और जिंक उर्वरक का उपयोग करें।"
    },
    "default": {
        "short": "संभवतः रोग पाया गया।",
        "detailed": "कृषि विशेषज्ञ की सलाह अनुसार उपचार करें।",
        "fertilizer": "स्थानीय निर्देशों का पालन करें।"
    }
}

MR_TEMPLATES = {
    "healthy": {
        "short": "पिक निरोगी आहे.",
        "detailed": "कोणतेही रोगाचे लक्षण आढळले नाहीत. नियमित निरीक्षण करत रहा.",
        "fertilizer": "पिकाच्या अवस्थेनुसार संतुलित NPK द्या."
    },
    "non_leaf_object": {
        "short": "कृपया फक्त पानाचा फोटो अपलोड करा.",
        "detailed": "हा फोटो पानासारखा दिसत नाही. साध्या पार्श्वभूमीवर पानाचा फोटो घ्या.",
        "fertilizer": ""
    },
    "blight": {
        "short": "ब्लाइट रोग दिसत आहे.",
        "detailed": "ब्लाइटची लक्षणे दिसत आहेत. Mancozeb किंवा Copper Oxychloride फवारणी करा.",
        "fertilizer": "अधिक नायट्रोजन टाळा; पोटॅशयुक्त खत वापरा."
    },
    "rust": {
        "short": "रस्ट संक्रमण आढळले.",
        "detailed": "तपकिरी किंवा नारिंगी ठिपके रस्ट रोगाचे लक्षण आहेत. सल्फर किंवा मॅन्कोझेब वापरा.",
        "fertilizer": "संतुलित NPK खत द्या."
    },
    "mildew": {
        "short": "मिल्ड्यू रोग आढळला.",
        "detailed": "पांढरे ठिपके दिसत आहेत. Carbendazim फवारणी करा.",
        "fertilizer": "फॉस्फरस खत द्या."
    },
    "bacterial": {
        "short": "बॅक्टेरियल संसर्गाचा संशय आहे.",
        "detailed": "पाण्यासारखे ठिपके दिसत आहेत. Copper Hydroxide फवारणी करा.",
        "fertilizer": "सूक्ष्म पोषक द्रव्ये द्या."
    },
    "spot": {
        "short": "पानावर ठिपके दिसत आहेत.",
        "detailed": "फफुंद संसर्ग संभव आहे. Mancozeb फवारणी करा.",
        "fertilizer": "पोटॅश व झिंक खत द्या."
    },
    "default": {
        "short": "रोग दिसत आहे.",
        "detailed": "कृषी तज्ज्ञांचा सल्ला घ्या व योग्य उपचार करा.",
        "fertilizer": "स्थानिक शिफारसीनुसार खत वापरा."
    }
}

# ----- Keyword-based template selection -----
def choose_template(label):
    l = label.lower()
    if "healthy" in l:
        return "healthy"
    if "non" in l and "leaf" in l:
        return "non_leaf_object"
    if "blight" in l:
        return "blight"
    if "rust" in l:
        return "rust"
    if "mildew" in l or "powdery" in l or "downy" in l:
        return "mildew"
    if "bacterial" in l:
        return "bacterial"
    if "spot" in l or "scab" in l or "anthracnose" in l:
        return "spot"
    return "default"

def make_advisory(label):
    t = choose_template(label)
    return {
        label: {
            "en": EN_TEMPLATES[t],
            "hi": HI_TEMPLATES[t],
            "mr": MR_TEMPLATES[t]
        }
    }

def build_advisory_json(labels_path, out_path):
    if not os.path.exists(labels_path):
        raise FileNotFoundError(f"{labels_path} not found")
    with open(labels_path, "r", encoding="utf-8") as f:
        labels = [l.strip() for l in f if l.strip()]
    advisory_dict = {}
    for lbl in labels:
        advisory_dict.update(make_advisory(lbl))
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(advisory_dict, f, ensure_ascii=False, indent=2)
    print(f"✅ Advisory JSON created with {len(labels)} classes → {out_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--labels", default="labels.txt", help="Path to labels.txt")
    parser.add_argument("--out", default="advisory_solutions.json", help="Output file")
    args = parser.parse_args()
    build_advisory_json(args.labels, args.out)
