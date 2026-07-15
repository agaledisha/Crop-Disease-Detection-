// src/components/ClickPic.js
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND = "http://127.0.0.1:5000";

// ── Reuse same canvas-based leaf checker ─────────────────────────────────────
function checkIsLeaf(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 64, 64);
        const { data } = ctx.getImageData(0, 0, 64, 64);
        let greenPx = 0;
        const total = data.length / 4;
        let rS = 0, gS = 0, bS = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          rS += r; gS += g; bS += b;
          const br = (r+g+b)/3;
          if (g > r && g > b && (g-r) > 10 && br > 30 && br < 230) greenPx++;
        }
        const colorful = Math.abs(rS/total - gS/total) > 8 || Math.abs(gS/total - bS/total) > 8;
        URL.revokeObjectURL(url);
        resolve(greenPx/total > 0.08 && colorful);
      } catch { URL.revokeObjectURL(url); resolve(true); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(true); };
    img.src = url;
  });
}

export default function ClickPic() {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const navigate    = useNavigate();
  const [step, setStep]         = useState("camera"); // camera | preview | detecting | notleaf | error
  const [capturedURL, setCapturedURL] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [facing, setFacing]     = useState("environment"); // front | environment
  const [camReady, setCamReady] = useState(false);
  const [errMsg, setErrMsg]     = useState("");

  const startCamera = useCallback(async (facingMode = facing) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCamReady(true);
    } catch (err) {
      setErrMsg("Camera access denied. Please allow camera permissions.");
      setStep("error");
    }
  }, [facing]);

  useEffect(() => {
    startCamera();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const flipCamera = () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    startCamera(next);
  };

  const capture = async () => {
    if (!videoRef.current || !camReady) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      setCapturedURL(URL.createObjectURL(blob));
      setCapturedBlob(blob);
      setStep("preview");
    }, "image/jpeg", 0.92);
  };

  const retake = () => {
    setCapturedURL(null);
    setCapturedBlob(null);
    setStep("camera");
    startCamera();
  };

  const analyze = async () => {
    if (!capturedBlob) return;
    setStep("detecting");

    // Leaf check
    const isLeaf = await checkIsLeaf(capturedBlob);
    if (!isLeaf) { setStep("notleaf"); return; }

    try {
      // Real backend call — uncomment when model ready:
      // const formData = new FormData();
      // formData.append("file", new File([capturedBlob], "leaf.jpg", { type: "image/jpeg" }));
      // const res = await fetch(`${BACKEND}/api/detect-disease`, { method: "POST", body: formData });
      // const result = await res.json();
      // navigate("/detect", { state: { detectionResult: result } });

      // Mock result for demo
      await new Promise(r => setTimeout(r, 1800));
      navigate("/detect", { state: { detectionResult: {
        prediction_label: "Tomato___Early_blight",
        confidence: "87.42%",
        is_leaf: true,
        advisory: {
          symptoms: ["Yellowing of leaves", "Brown spots", "Wilting"],
          causes: ["Fungal infection", "Environmental stress"],
          treatment: ["Apply fungicide", "Remove infected leaves"],
          prevention: ["Use resistant varieties", "Avoid overhead watering"],
        },
        fertilizers: [
          { name: "NPK 19-19-19", type: "Chemical", purpose: "Balanced growth", usage: "5g/L water" },
          { name: "Vermicompost", type: "Organic", purpose: "Soil nutrients", usage: "2kg/sq.m" },
        ],
      }}});
    } catch {
      setErrMsg("Detection failed. Please try again.");
      setStep("error");
    }
  };

  return (
    <div style={S.page}>
      <div style={S.bg} />

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTag}>CAMERA CAPTURE</div>
        <h1 style={S.title}>Click a Leaf Photo</h1>
        <p style={S.desc}>Point your camera at a crop leaf for instant AI disease detection.</p>
      </div>

      <div style={S.cameraBox}>
        {/* ── Camera View ── */}
        {step === "camera" && (
          <div style={S.camWrap}>
            <video ref={videoRef} autoPlay playsInline muted style={S.video} />

            {/* Overlay guide */}
            <div style={S.overlay}>
              <div style={S.guideFrame} />
              <div style={S.guideTip}>Position leaf inside the frame</div>
            </div>

            {!camReady && (
              <div style={S.camLoading}>
                <div style={S.spinner} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Starting camera...</span>
              </div>
            )}

            {/* Controls */}
            <div style={S.controls}>
              <button style={S.flipBtn} onClick={flipCamera} title="Flip camera">🔄</button>
              <button style={S.captureBtn} onClick={capture} disabled={!camReady}>
                <div style={S.captureInner} />
              </button>
              <div style={{ width: 48 }} />
            </div>
          </div>
        )}

        {/* ── Preview ── */}
        {step === "preview" && (
          <div style={S.previewWrap}>
            <img src={capturedURL} alt="captured" style={S.preview} />
            <div style={S.previewBadge}>📸 Photo captured</div>
            <div style={S.previewActions}>
              <button style={S.btnSecondary} onClick={retake}>🔄 Retake</button>
              <button style={S.btnPrimary} onClick={analyze}>🔬 Analyze Leaf</button>
            </div>
          </div>
        )}

        {/* ── Detecting ── */}
        {step === "detecting" && (
          <div style={S.statusBox}>
            <div style={S.scanAnim}>
              <img src={capturedURL} alt="scanning" style={{ ...S.preview, position: "relative" }} />
              <div style={S.scanLine} />
            </div>
            <div style={S.statusTitle}>AI is scanning your leaf...</div>
            <div style={S.statusSteps}>
              {["Validating leaf structure", "Running disease classifier", "Generating report"].map((s, i) => (
                <div key={i} style={{ ...S.statusStep, animationDelay: `${i * 0.6}s` }}>✓ {s}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Not a leaf ── */}
        {step === "notleaf" && (
          <div style={S.statusBox}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
            <h3 style={{ color: "#fca5a5", fontFamily: "'Syne',sans-serif", margin: "0 0 10px" }}>Not a Plant Leaf</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 24px", lineHeight: 1.7, maxWidth: 340 }}>
              This image doesn't appear to contain a plant leaf. Please take a clear photo of a crop leaf.
            </p>
            <div style={S.tipBox}>💡 Tips: Ensure good lighting, focus on a single leaf, avoid backgrounds</div>
            <button style={S.btnPrimary} onClick={retake}>📸 Retake Photo</button>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div style={S.statusBox}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ color: "#fca5a5", fontFamily: "'Syne',sans-serif", margin: "0 0 10px" }}>Something went wrong</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 24px" }}>{errMsg}</p>
            <button style={S.btnPrimary} onClick={() => { setStep("camera"); setErrMsg(""); startCamera(); }}>
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Guide */}
      <div style={S.guideRow}>
        {[
          { icon: "☀️", text: "Good lighting" },
          { icon: "🍃", text: "Single leaf focus" },
          { icon: "📏", text: "Fill the frame" },
          { icon: "🚫", text: "No shadows" },
        ].map(g => (
          <div key={g.icon} style={S.guideItem}>
            <span style={{ fontSize: 22 }}>{g.icon}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{g.text}</span>
          </div>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scanMove { 0%,100%{top:0} 50%{top:calc(100% - 4px)} }
        @keyframes fadeStep { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", padding: "88px 24px 40px", background: "linear-gradient(160deg,#071a10 0%,#0d2818 60%,#0a1a0f 100%)", fontFamily: "'DM Sans',sans-serif", color: "#fff", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" },
  bg: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" },
  header: { textAlign: "center", marginBottom: 28, position: "relative" },
  headerTag: { display: "inline-block", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: 11, fontWeight: 700, letterSpacing: 2, padding: "4px 12px", borderRadius: 20, marginBottom: 12 },
  title: { fontFamily: "'Syne',sans-serif", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, margin: "0 0 8px", background: "linear-gradient(135deg,#fff 30%,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  desc: { fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 },
  cameraBox: { width: "100%", maxWidth: 520, background: "rgba(10,30,15,0.75)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 24, overflow: "hidden", position: "relative" },
  camWrap: { position: "relative" },
  video: { width: "100%", display: "block", maxHeight: 400, objectFit: "cover", background: "#000" },
  overlay: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  guideFrame: { width: 220, height: 220, border: "2px solid rgba(74,222,128,0.6)", borderRadius: 16, boxShadow: "0 0 0 4000px rgba(0,0,0,0.3)" },
  guideTip: { position: "absolute", bottom: 70, fontSize: 12, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.5)", padding: "5px 12px", borderRadius: 20 },
  camLoading: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(0,0,0,0.6)" },
  spinner: { width: 28, height: 28, border: "3px solid rgba(74,222,128,0.2)", borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  controls: { display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: "16px 0 20px", background: "rgba(0,0,0,0.4)" },
  flipBtn: { width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 20, cursor: "pointer" },
  captureBtn: { width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "3px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  captureInner: { width: 52, height: 52, borderRadius: "50%", background: "#fff" },
  previewWrap: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center" },
  preview: { width: "100%", maxHeight: 380, objectFit: "contain", display: "block" },
  previewBadge: { position: "absolute", top: 14, left: 14, background: "rgba(74,222,128,0.85)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20 },
  previewActions: { display: "flex", gap: 12, padding: "16px 20px 20px", width: "100%", boxSizing: "border-box" },
  btnPrimary: { flex: 1, padding: "13px", background: "linear-gradient(135deg,#16a34a,#4ade80)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" },
  btnSecondary: { flex: 1, padding: "13px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff", fontSize: 15, cursor: "pointer" },
  statusBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 28px", textAlign: "center", gap: 0 },
  scanAnim: { position: "relative", width: "100%", maxHeight: 200, overflow: "hidden", marginBottom: 20 },
  scanLine: { position: "absolute", left: 0, right: 0, height: 4, background: "linear-gradient(90deg,transparent,#4ade80,transparent)", animation: "scanMove 1.5s ease-in-out infinite" },
  statusTitle: { fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: "#4ade80", marginBottom: 16 },
  statusSteps: { display: "flex", flexDirection: "column", gap: 8 },
  statusStep: { fontSize: 13, color: "rgba(74,222,128,0.7)", animation: "fadeStep 0.5s ease forwards", opacity: 0 },
  tipBox: { background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "rgba(234,179,8,0.8)", marginBottom: 20 },
  guideRow: { display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap", justifyContent: "center" },
  guideItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 12, padding: "12px 20px" },
};
