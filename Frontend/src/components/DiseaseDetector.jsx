// src/components/DiseaseDetector.jsx
// ✅ Full multilingual — English / हिंदी / मराठी

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { uploadLeafImage } from "../api/diseaseApi";

function parseLabel(label = "") {
  const dashIdx = label.indexOf("___");
  if (dashIdx !== -1) {
    return {
      plant:   label.slice(0, dashIdx).replace(/_/g, " ").trim(),
      disease: label.slice(dashIdx + 3).replace(/_/g, " ").trim(),
    };
  }
  const spaceIdx = label.indexOf("_");
  if (spaceIdx !== -1) {
    return {
      plant:   label.slice(0, spaceIdx).replace(/_/g, " ").trim(),
      disease: label.slice(spaceIdx + 1).replace(/_/g, " ").trim(),
    };
  }
  return { plant: "Plant", disease: label.replace(/_/g, " ").trim() };
}

function isHealthy(label = "") {
  return label.toLowerCase().includes("healthy");
}

export default function DiseaseDetector() {
  const { t } = useTranslation();
  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState("");
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState("");
  const [dragOver, setDragOver]       = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsStatus, setGpsStatus]     = useState("");
  const [activeTab, setActiveTab]     = useState("result");
  const fileInputRef  = useRef();
  const locationState = useLocation();

  useEffect(() => {
    if (locationState.state?.detectionResult) setResult(locationState.state.detectionResult);
  }, [locationState.state]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFileSelect(f);
  }, []);

  const handleFileSelect = (f) => {
    setFile(f); setResult(null); setActiveTab("result");
    setPreview(URL.createObjectURL(f));
  };

  const getGPS = () => {
    if (!navigator.geolocation) { setGpsStatus(t("locationError")); return; }
    setGpsStatus(t("fetchingLoc"));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGpsStatus(`📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => setGpsStatus(t("locationError"))
    );
  };

  const onDetect = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
    try {
      setLoadingMsg(t("uploading"));
      await new Promise((r) => setTimeout(r, 400));
      setLoadingMsg(t("checking"));
      const data = await uploadLeafImage(file, gpsLocation);
      setLoadingMsg(t("generating"));
      await new Promise((r) => setTimeout(r, 300));
      setResult(data);
    } catch {
      setResult({ error: t("detectError") });
    }
    setLoading(false);
  };

  const parsed  = result?.prediction_label ? parseLabel(result.prediction_label) : null;
  const healthy = result ? isHealthy(result.prediction_label || "") : false;
  const confNum = result?.confidence ? parseFloat(result.confidence) : 0;

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div style={S.pageTag}>{t("detectTag")}</div>
        <h1 style={S.pageTitle}>{t("detectTitle")}</h1>
        <p style={S.pageDesc}>{t("detectDesc")}</p>
      </div>

      <div style={S.layout}>
        {/* LEFT */}
        <div style={S.leftPanel}>
          <div
            style={{ ...S.dropZone, ...(dragOver ? S.dropZoneActive : {}), ...(preview ? S.dropZoneHasImage : {}) }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !preview && fileInputRef.current.click()}
          >
            {preview
              ? <img src={preview} alt="preview" style={S.previewImg} />
              : <div style={S.dropPlaceholder}>
                  <div style={S.dropIcon}>🍃</div>
                  <div style={S.dropText}>{t("dropTitle")}</div>
                  <div style={S.dropSub}>{t("dropSub")}</div>
                </div>
            }
            <input ref={fileInputRef} type="file" accept="image/*"
              onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
              style={{ display: "none" }} />
          </div>

          <div style={S.actions}>
            <button style={S.btnSecondary} onClick={() => fileInputRef.current.click()}>
              📁 {t("chooseFile")}
            </button>
            <button style={S.btnGPS} onClick={getGPS}>📍 {t("gps")}</button>
          </div>

          {gpsStatus && <div style={S.gpsStatus}>{gpsStatus}</div>}

          {preview && (
            <button style={{ ...S.btnDetect, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              onClick={onDetect} disabled={loading}>
              {loading
                ? <span style={S.loadingRow}><span style={S.spinner} />{loadingMsg}</span>
                : `🔬 ${t("detectBtn")}`}
            </button>
          )}

          {file && (
            <div style={S.fileInfo}>
              <span>📄 {file.name}</span>
              <span>{(file.size / 1024).toFixed(0)} KB</span>
              <button style={S.clearBtn}
                onClick={() => { setFile(null); setPreview(""); setResult(null); }}>
                ✕ {t("clear")}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={S.rightPanel}>
          {!result && !loading && (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>🌾</div>
              <div style={S.emptyTitle}>{t("readyTitle")}</div>
              <div style={S.emptyDesc}>{t("readyDesc")}</div>
            </div>
          )}

          {loading && (
            <div style={S.loadingState}>
              <div style={S.scanAnim}>
                <div style={S.scanLine} />
                <span style={{ fontSize: 48 }}>🍃</span>
              </div>
              <div style={S.loadingTitle}>{loadingMsg}</div>
              <div style={S.loadingSteps}>
                {[t("step1"), t("step2"), t("step3")].map((s, i) => (
                  <div key={i} style={{ ...S.loadingStep, animationDelay: `${i * 0.5}s` }}>✓ {s}</div>
                ))}
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              {result.is_leaf === false && (
                <div style={S.notLeafBox}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🚫</div>
                  <h3 style={{ color: "#fca5a5", margin: "0 0 10px", fontFamily: "'Syne',sans-serif", fontSize: 20 }}>
                    {t("notLeafTitle")}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.7 }}>
                    {t("notLeafDesc")}
                  </p>
                  <div style={S.notLeafTip}>{t("notLeafTip")}</div>
                </div>
              )}

              {/* ── UNSUPPORTED CROP / LOW CONFIDENCE ── */}
              {result.is_leaf === true && result.is_supported === false && (
                <div style={S.unsupportedBox}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                  <h3 style={{ color: "#fbbf24", margin: "0 0 8px", fontFamily: "'Syne',sans-serif", fontSize: 18 }}>
                    Detection Confidence Too Low
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.65)", margin: "0 0 6px", fontSize: 13 }}>
                    Confidence: <strong style={{ color: "#fbbf24" }}>{result.confidence}</strong>
                    {" "}— Minimum required: <strong>70%</strong>
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.55)", margin: "0 0 16px", fontSize: 13, lineHeight: 1.6 }}>
                    {result.error}
                  </p>

                  {/* Supported crops */}
                  <div style={S.supportedCropsList}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", marginBottom: 8, width: "100%", textAlign: "center" }}>
                      ✅ Supported Crops Only:
                    </div>
                    {(result.supported_crops || ["Tomato", "Potato", "Pepper Bell"]).map((crop) => (
                      <span key={crop} style={S.cropBadge}>🌿 {crop}</span>
                    ))}
                  </div>

                  {/* Top predictions (what model guessed) */}
                  {result.top_predictions && result.top_predictions.length > 0 && (
                    <div style={S.topPredBox}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontWeight: 600 }}>
                        🔍 Top Model Guesses (low confidence):
                      </div>
                      {result.top_predictions.map((p, i) => (
                        <div key={i} style={S.topPredRow}>
                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                            {i + 1}. {p.label.replace(/_+/g, " ")}
                          </span>
                          <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>
                            {p.confidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tips */}
                  {result.tips && (
                    <div style={S.tipsBox}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>
                        💡 Tips for Better Detection:
                      </div>
                      {result.tips.map((tip, i) => (
                        <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>
                          • {tip}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result.error && result.is_leaf !== false && result.is_supported !== false && (
                <div style={S.errorBox}>⚠️ {result.error}</div>
              )}

              {!result.error && result.is_leaf !== false && result.is_supported !== false && parsed && (
                <>
                  <div style={{ ...S.statusBadge,
                    background: healthy ? "rgba(74,222,128,0.12)" : "rgba(239,68,68,0.12)",
                    borderColor: healthy ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
                    <span style={{ fontSize: 20 }}>{healthy ? "✅" : "⚠️"}</span>
                    <span style={{ color: healthy ? "#4ade80" : "#fca5a5", fontWeight: 700, fontSize: 15 }}>
                      {healthy ? t("labelHealthyPlant") : t("labelDetected")}
                    </span>
                  </div>

                  <div style={S.resultGrid}>
                    {[
                      { label: t("labelPlant"),      value: parsed.plant,      icon: "🌱" },
                      { label: t("labelDisease"),    value: parsed.disease,    icon: "🦠" },
                      { label: t("labelConfidence"), value: result.confidence, icon: "📊" },
                      { label: t("labelStatus"),
                        value: healthy ? t("labelHealthy") : t("labelDiseased"),
                        icon: "🏥" },
                    ].map((item) => (
                      <div key={item.label} style={S.resultCard}>
                        <div style={S.resultCardIcon}>{item.icon}</div>
                        <div style={S.resultCardLabel}>{item.label}</div>
                        <div style={S.resultCardValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={S.confBarWrap}>
                    <div style={S.confBarLabel}>
                      <span>{t("confidenceScore")}</span>
                      <span style={{ color: "#4ade80" }}>{result.confidence}</span>
                    </div>
                    <div style={S.confBarTrack}>
                      <div style={{ ...S.confBarFill, width: `${confNum}%`,
                        background: confNum > 80 ? "#4ade80" : confNum > 60 ? "#facc15" : "#f87171" }} />
                    </div>
                  </div>

                  {/* ── CROSS CROP NOTE — shown when Tomato/Potato similar disease ── */}
                  {result.cross_crop_note && (
                    <div style={S.crossCropNote}>
                      <div style={{ fontSize: 16, marginBottom: 6 }}>🔄</div>
                      <div style={{ fontSize: 13, color: "rgba(251,191,36,0.9)", fontWeight: 600, marginBottom: 6 }}>
                        Similar Disease in Another Crop
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: 8 }}>
                        {result.cross_crop_note.message}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, padding: "3px 10px", color: "#4ade80" }}>
                          Alt: {result.cross_crop_note.alt_label?.replace(/___/g, " ").replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                          Confidence: {result.cross_crop_note.alt_confidence}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── TOP PREDICTIONS ── */}
                  {result.top_predictions && result.top_predictions.length > 1 && (
                    <div style={S.topPredBoxSuccess}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6, fontWeight: 600, letterSpacing: 1 }}>
                        TOP PREDICTIONS
                      </div>
                      {result.top_predictions.map((p, i) => (
                        <div key={i} style={{ ...S.topPredRow, borderBottom: i < result.top_predictions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <span style={{ color: i === 0 ? "#4ade80" : "rgba(255,255,255,0.45)", fontSize: 12 }}>
                            {i === 0 ? "✓ " : `${i + 1}. `}{p.label.replace(/___/g, " → ").replace(/_/g, " ")}
                          </span>
                          <span style={{ color: i === 0 ? "#4ade80" : "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600 }}>
                            {p.confidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={S.tabs}>
                    {["result","advisory","fertilizer"].map((tab) => (
                      <button key={tab}
                        style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
                        onClick={() => setActiveTab(tab)}>
                        {{ result: t("tabDiagnosis"), advisory: t("tabTreatment"), fertilizer: t("tabFertilizer") }[tab]}
                      </button>
                    ))}
                  </div>

                  <div style={S.tabContent}>
                    {activeTab === "result" && (
                      <div style={S.diagnosisText}>
                        <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8, margin: "0 0 16px" }}>
                          {healthy
                            ? t("healthyMsg", { plant: parsed.plant })
                            : t("diseasedMsg", { disease: parsed.disease, plant: parsed.plant, confidence: result.confidence })}
                        </p>
                        <div style={S.diagTip}>{t("diagTip")}</div>
                      </div>
                    )}

                    {activeTab === "advisory" && result.advisory && (
                      <div style={S.advisoryGrid}>
                        {[
                          { key: "symptoms",   icon: "🩺", title: t("symptoms")   },
                          { key: "causes",     icon: "🔍", title: t("causes")     },
                          { key: "treatment",  icon: "💉", title: t("treatment")  },
                          { key: "prevention", icon: "🛡️", title: t("prevention") },
                        ].map((sec) => (
                          <div key={sec.key} style={S.advisoryCard}>
                            <div style={S.advisoryCardTitle}>{sec.icon} {sec.title}</div>
                            <ul style={S.advisoryList}>
                              {result.advisory[sec.key]?.map((item, i) => (
                                <li key={i} style={S.advisoryItem}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === "fertilizer" && result.fertilizers && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {result.fertilizers.map((f, i) => (
                          <div key={i} style={S.fertCard}>
                            <div style={S.fertHeader}>
                              <span style={S.fertName}>🧪 {f.name}</span>
                              <span style={{ ...S.fertTypeBadge,
                                background: f.type==="Organic" ? "rgba(74,222,128,0.12)" : "rgba(96,165,250,0.12)",
                                color:      f.type==="Organic" ? "#4ade80" : "#93c5fd",
                                borderColor:f.type==="Organic" ? "rgba(74,222,128,0.3)" : "rgba(96,165,250,0.3)" }}>
                                {f.type === "Organic" ? t("organic") : t("chemical")}
                              </span>
                            </div>
                            <div style={S.fertPurpose}>🎯 {t("purpose")}: {f.purpose}</div>
                            <div style={S.fertUsage}>📋 {t("usage")}: {f.usage}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scanMove { 0%,100%{top:0} 50%{top:calc(100% - 3px)} }
        @keyframes fadeStep { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}

const S = {
  page:{minHeight:"100vh",background:"linear-gradient(160deg,#071a10 0%,#0d2818 60%,#0a1a0f 100%)",padding:"100px 24px 60px",fontFamily:"'DM Sans',sans-serif",color:"#fff"},
  pageHeader:{textAlign:"center",marginBottom:48},
  pageTag:{display:"inline-block",background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",color:"#4ade80",fontSize:11,fontWeight:700,letterSpacing:2,padding:"5px 14px",borderRadius:20,marginBottom:14},
  pageTitle:{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,44px)",fontWeight:800,margin:"0 0 12px",background:"linear-gradient(135deg,#fff 30%,#4ade80)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  pageDesc:{color:"rgba(255,255,255,0.5)",maxWidth:500,margin:"0 auto",lineHeight:1.6},
  layout:{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:28,maxWidth:1100,margin:"0 auto",alignItems:"start"},
  leftPanel:{display:"flex",flexDirection:"column",gap:14},
  dropZone:{border:"2px dashed rgba(74,222,128,0.25)",borderRadius:20,minHeight:280,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s",overflow:"hidden",background:"rgba(255,255,255,0.02)",position:"relative"},
  dropZoneActive:{borderColor:"#4ade80",background:"rgba(74,222,128,0.06)",transform:"scale(1.01)"},
  dropZoneHasImage:{cursor:"default",border:"2px solid rgba(74,222,128,0.3)"},
  previewImg:{width:"100%",height:"100%",objectFit:"contain",maxHeight:340},
  dropPlaceholder:{textAlign:"center",padding:32},
  dropIcon:{fontSize:52,marginBottom:14},
  dropText:{fontSize:16,fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:6},
  dropSub:{fontSize:13,color:"rgba(255,255,255,0.35)"},
  actions:{display:"flex",gap:10},
  btnSecondary:{flex:1,padding:"11px 0",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer"},
  btnGPS:{padding:"11px 20px",background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:12,color:"#4ade80",fontSize:14,fontWeight:500,cursor:"pointer"},
  gpsStatus:{fontSize:12,color:"rgba(74,222,128,0.7)",background:"rgba(74,222,128,0.05)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:8,padding:"8px 14px"},
  btnDetect:{width:"100%",padding:"15px",background:"linear-gradient(135deg,#16a34a,#4ade80)",border:"none",borderRadius:14,color:"#fff",fontSize:16,fontFamily:"'Syne',sans-serif",fontWeight:700,cursor:"pointer",boxShadow:"0 8px 28px rgba(74,222,128,0.25)"},
  loadingRow:{display:"flex",alignItems:"center",justifyContent:"center",gap:10},
  spinner:{width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"},
  fileInfo:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",fontSize:13,color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 14px"},
  clearBtn:{marginLeft:"auto",background:"none",border:"none",color:"#f87171",fontSize:13,cursor:"pointer"},
  rightPanel:{background:"rgba(10,30,15,0.6)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:22,padding:28,minHeight:400},
  emptyState:{textAlign:"center",padding:"60px 24px"},
  emptyIcon:{fontSize:64,marginBottom:20},
  emptyTitle:{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:"rgba(255,255,255,0.7)",marginBottom:10},
  emptyDesc:{fontSize:14,color:"rgba(255,255,255,0.35)",lineHeight:1.7},
  loadingState:{textAlign:"center",padding:"40px 24px"},
  scanAnim:{position:"relative",display:"inline-block",marginBottom:24},
  scanLine:{position:"absolute",left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,#4ade80,transparent)",animation:"scanMove 1.5s ease-in-out infinite"},
  loadingTitle:{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:"#4ade80",marginBottom:20},
  loadingSteps:{display:"flex",flexDirection:"column",gap:8,alignItems:"center"},
  loadingStep:{fontSize:13,color:"rgba(74,222,128,0.7)",animation:"fadeStep 0.5s ease forwards",opacity:0},
  notLeafBox:{textAlign:"center",padding:"48px 32px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:16},
  notLeafTip:{marginTop:20,fontSize:13,color:"rgba(234,179,8,0.7)",background:"rgba(234,179,8,0.06)",border:"1px solid rgba(234,179,8,0.15)",borderRadius:8,padding:"10px 14px"},
  unsupportedBox:{textAlign:"center",padding:"28px 20px",background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:16},
  supportedCropsList:{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:14},
  cropBadge:{background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.3)",borderRadius:20,padding:"5px 14px",fontSize:12,color:"#4ade80",fontWeight:600},
  topPredBox:{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 14px",marginBottom:12,textAlign:"left"},
  topPredBoxSuccess:{background:"rgba(0,0,0,0.15)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 14px",marginBottom:16,textAlign:"left"},
  topPredRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"},
  tipsBox:{background:"rgba(74,222,128,0.05)",border:"1px solid rgba(74,222,128,0.15)",borderRadius:10,padding:"12px 14px",textAlign:"left"},
  crossCropNote:{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:12,padding:"14px 16px",marginBottom:16,textAlign:"left"},
  errorBox:{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:12,padding:"16px 20px",color:"#fca5a5",fontSize:14},
  statusBadge:{display:"flex",alignItems:"center",gap:10,border:"1px solid",borderRadius:12,padding:"12px 18px",marginBottom:20},
  resultGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20},
  resultCard:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(74,222,128,0.12)",borderRadius:14,padding:"14px 16px"},
  resultCardIcon:{fontSize:22,marginBottom:6},
  resultCardLabel:{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:600,letterSpacing:1,marginBottom:4},
  resultCardValue:{fontSize:14,fontWeight:700,color:"#fff",fontFamily:"'Syne',sans-serif",wordBreak:"break-word"},
  confBarWrap:{marginBottom:22},
  confBarLabel:{display:"flex",justifyContent:"space-between",fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:8},
  confBarTrack:{height:6,background:"rgba(255,255,255,0.08)",borderRadius:10},
  confBarFill:{height:"100%",borderRadius:10,transition:"width 1s ease"},
  tabs:{display:"flex",gap:6,marginBottom:18,borderBottom:"1px solid rgba(255,255,255,0.06)",paddingBottom:4},
  tab:{padding:"8px 14px",background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",borderRadius:"8px 8px 0 0",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"},
  tabActive:{color:"#4ade80",background:"rgba(74,222,128,0.08)",borderBottom:"2px solid #4ade80"},
  tabContent:{minHeight:180},
  diagnosisText:{padding:"4px 0"},
  diagTip:{marginTop:16,fontSize:12,color:"rgba(234,179,8,0.7)",background:"rgba(234,179,8,0.06)",border:"1px solid rgba(234,179,8,0.15)",borderRadius:8,padding:"10px 14px"},
  advisoryGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
  advisoryCard:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(74,222,128,0.1)",borderRadius:12,padding:"14px 16px"},
  advisoryCardTitle:{fontSize:13,fontWeight:700,color:"#4ade80",marginBottom:10},
  advisoryList:{margin:0,paddingLeft:16},
  advisoryItem:{fontSize:12,color:"rgba(255,255,255,0.6)",marginBottom:6,lineHeight:1.5},
  fertCard:{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(74,222,128,0.12)",borderRadius:14,padding:"16px 18px"},
  fertHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8},
  fertName:{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"'Syne',sans-serif"},
  fertTypeBadge:{fontSize:11,fontWeight:700,letterSpacing:1,border:"1px solid",borderRadius:8,padding:"3px 10px"},
  fertPurpose:{fontSize:13,color:"rgba(255,255,255,0.6)",marginBottom:4},
  fertUsage:{fontSize:12,color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 12px"},
};
