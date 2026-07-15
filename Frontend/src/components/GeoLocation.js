import React, { useState, useEffect } from "react";
 
export default function GeoLocation() {
  const [location, setLocation] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
 
  useEffect(() => { getLocation(); }, []);
 
  const getLocation = () => {
    setLoading(true);
    setError("");
    setMapLoaded(false);
 
    if (!navigator.geolocation) {
      setError("Your browser does not support GPS.");
      setLoading(false);
      return;
    }
 
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6),
        });
        setAccuracy(Math.round(pos.coords.accuracy));
        setLoading(false);
      },
      (err) => {
        const msgs = {
          1: "GPS permission denied. Please allow location access.",
          2: "Location unavailable. Try again.",
          3: "Location request timed out.",
        };
        setError(msgs[err.code] || "Location error occurred.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };
 
  return (
    <div style={S.page}>
      <div style={S.bg1} /><div style={S.bg2} /><div style={S.grid} />
 
      {/* Header */}
      <div style={S.header}>
        <div style={S.tag}>GPS TRACKING</div>
        <h1 style={S.title}>My Farm Location</h1>
        <p style={S.sub}>Detect your precise location for weather and crop advisory services.</p>
      </div>
 
      <div style={S.layout}>
 
        {/* ── Left: coordinate panel ── */}
        <div style={S.leftCol}>
 
          {/* Status card */}
          <div style={S.statusCard}>
            <div style={S.statusIconWrap}>
              {loading ? (
                <div style={S.spinnerLg} />
              ) : error ? (
                <div style={S.errorIcon}>⚠</div>
              ) : (
                <div style={S.successIcon}>✓</div>
              )}
            </div>
            <div>
              <div style={S.statusTitle}>
                {loading ? "Detecting location..." : error ? "Location Error" : "Location Found"}
              </div>
              <div style={S.statusSub}>
                {loading
                  ? "Using high-precision GPS"
                  : error
                  ? error
                  : `Accuracy ±${accuracy ?? "--"}m`}
              </div>
            </div>
          </div>
 
          {/* Coordinate cards */}
          {location && !loading && (
            <div style={S.coordGrid}>
              {[
                { icon: "↕", label: "Latitude",  value: location.lat, color: "#4ade80" },
                { icon: "↔", label: "Longitude", value: location.lon, color: "#93c5fd" },
              ].map(c => (
                <div key={c.label} style={S.coordCard}>
                  <div style={{ ...S.coordIconBox, background: `${c.color}14`, color: c.color }}>
                    {c.icon}
                  </div>
                  <div style={S.coordLabel}>{c.label}</div>
                  <div style={{ ...S.coordValue, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
          )}
 
          {/* Info cards */}
          {location && !loading && (
            <div style={S.infoStack}>
              {[
                { icon: "🌾", label: "Farm Zone",   value: "Maharashtra, IN"   },
                { icon: "🗺️", label: "Map Zoom",    value: "Level 15 (Street)" },
                { icon: "📡", label: "Signal",      value: `±${accuracy}m accuracy` },
                { icon: "🕐", label: "Captured",    value: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
              ].map(r => (
                <div key={r.label} style={S.infoRow}>
                  <span style={S.infoIcon}>{r.icon}</span>
                  <span style={S.infoLabel}>{r.label}</span>
                  <span style={S.infoValue}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
 
          {/* Actions */}
          <div style={S.btnRow}>
            <button style={S.btnPrimary} onClick={getLocation} disabled={loading}>
              {loading ? (
                <span style={S.btnInner}><span style={S.spinnerSm} /> Detecting...</span>
              ) : "↺  Refresh Location"}
            </button>
            {location && (
              <button
                style={S.btnSecondary}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "My Farm Location", text: `Lat: ${location.lat}, Lon: ${location.lon}` });
                  } else {
                    navigator.clipboard.writeText(`${location.lat}, ${location.lon}`);
                    alert("Coordinates copied to clipboard!");
                  }
                }}
              >
                ⬆  Share
              </button>
            )}
          </div>
 
          {/* Usage tips */}
          <div style={S.tipsCard}>
            <div style={S.tipsTitle}>📍 Uses of your location</div>
            {[
              "Get real-time local weather forecasts",
              "Receive region-specific crop advisory",
              "Find nearby soil testing centers",
              "Access government schemes for your district",
            ].map((t, i) => (
              <div key={i} style={S.tipItem}>
                <span style={S.tipDot} /> {t}
              </div>
            ))}
          </div>
        </div>
 
        {/* ── Right: map ── */}
        <div style={S.rightCol}>
          <div style={S.mapCard}>
            <div style={S.mapHeader}>
              <span style={S.mapHeaderIcon}>🗺️</span>
              <span style={S.mapHeaderTitle}>Interactive Map</span>
              {location && <span style={S.liveBadge}>● Live</span>}
            </div>
 
            {loading && (
              <div style={S.mapPlaceholder}>
                <div style={S.spinnerLg} />
                <div style={S.mapPlaceholderText}>Waiting for GPS coordinates...</div>
              </div>
            )}
 
            {error && !loading && (
              <div style={S.mapPlaceholder}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🚫</div>
                <div style={S.mapPlaceholderText}>{error}</div>
                <button style={S.btnPrimary} onClick={getLocation}>
                  Try Again
                </button>
              </div>
            )}
 
            {location && !loading && (
              <>
                <iframe
                  title="farm-map"
                  src={`https://www.google.com/maps?q=${location.lat},${location.lon}&z=15&output=embed`}
                  style={S.mapIframe}
                  loading="lazy"
                  allowFullScreen
                  onLoad={() => setMapLoaded(true)}
                />
                {!mapLoaded && (
                  <div style={S.mapLoadingOverlay}>
                    <div style={S.spinnerLg} />
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 12 }}>Loading map...</div>
                  </div>
                )}
                {/* Coordinates overlay */}
                <div style={S.coordOverlay}>
                  <span style={S.coordOverlayText}>
                    📍 {location.lat}, {location.lon}
                  </span>
                </div>
              </>
            )}
          </div>
 
          {/* Open in Maps links */}
          {location && !loading && (
            <div style={S.mapLinksRow}>
              {[
                { label: "Open in Google Maps", url: `https://www.google.com/maps?q=${location.lat},${location.lon}` },
                { label: "Open in Apple Maps",  url: `http://maps.apple.com/?q=${location.lat},${location.lon}` },
              ].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={S.mapLink}>
                  {l.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
 
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes blob  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
 
const S = {
  page: {
    minHeight: "100vh",
    padding: "80px 24px 60px",
    background: "linear-gradient(160deg,#071a10 0%,#0d2818 55%,#0a1a0f 100%)",
    fontFamily: "'DM Sans',sans-serif",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
  },
  bg1:  { position: "absolute", width: 600, height: 600, borderRadius: "50%", top: -150, right: -150, background: "radial-gradient(circle,rgba(74,222,128,0.07) 0%,transparent 70%)", animation: "blob 12s ease-in-out infinite", pointerEvents: "none" },
  bg2:  { position: "absolute", width: 450, height: 450, borderRadius: "50%", bottom: -100, left: -100, background: "radial-gradient(circle,rgba(234,179,8,0.05) 0%,transparent 70%)", animation: "blob 15s ease-in-out infinite reverse", pointerEvents: "none" },
  grid: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" },
 
  header: { textAlign: "center", marginBottom: 36, position: "relative" },
  tag:    { display: "inline-block", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "4px 12px", borderRadius: 20, marginBottom: 12 },
  title:  { fontFamily: "'Syne',sans-serif", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, margin: "0 0 8px", background: "linear-gradient(135deg,#fff 30%,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  sub:    { fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0 },
 
  layout:  { display: "grid", gridTemplateColumns: "340px 1fr", gap: 22, maxWidth: 1100, margin: "0 auto", alignItems: "start" },
  leftCol: { display: "flex", flexDirection: "column", gap: 14 },
 
  statusCard: { background: "rgba(8,22,13,0.8)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 18, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 },
  statusIconWrap: { flexShrink: 0, width: 48, height: 48, borderRadius: 14, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center" },
  successIcon: { fontSize: 22, color: "#4ade80", fontWeight: 700 },
  errorIcon:   { fontSize: 22, color: "#f87171" },
  statusTitle: { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3 },
  statusSub:   { fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 },
 
  coordGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  coordCard: { background: "rgba(8,22,13,0.8)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 16, padding: "16px 18px" },
  coordIconBox: { width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, marginBottom: 10 },
  coordLabel:  { fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 5 },
  coordValue:  { fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 0.5 },
 
  infoStack: { background: "rgba(8,22,13,0.8)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 16, overflow: "hidden" },
  infoRow:   { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid rgba(74,222,128,0.07)" },
  infoIcon:  { fontSize: 16, flexShrink: 0, width: 24, textAlign: "center" },
  infoLabel: { fontSize: 13, color: "rgba(255,255,255,0.45)", flex: 1 },
  infoValue: { fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'Syne',sans-serif" },
 
  btnRow: { display: "flex", gap: 10 },
  btnPrimary: {
    flex: 1, padding: "13px", background: "linear-gradient(135deg,#16a34a,#4ade80)",
    border: "none", borderRadius: 13, color: "#fff",
    fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Syne',sans-serif", letterSpacing: 0.3,
    transition: "opacity 0.2s",
  },
  btnSecondary: {
    padding: "13px 18px", background: "rgba(74,222,128,0.08)",
    border: "1px solid rgba(74,222,128,0.25)", borderRadius: 13,
    color: "#4ade80", fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "'Syne',sans-serif",
  },
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
 
  tipsCard:  { background: "rgba(8,22,13,0.7)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 16, padding: "16px 18px" },
  tipsTitle: { fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 12, letterSpacing: 0.3 },
  tipItem:   { fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, lineHeight: 1.5 },
  tipDot:    { width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0, marginTop: 5 },
 
  rightCol: { display: "flex", flexDirection: "column", gap: 12 },
  mapCard:  {
    background: "rgba(8,22,13,0.8)", border: "1px solid rgba(74,222,128,0.15)",
    borderRadius: 20, overflow: "hidden", position: "relative",
  },
  mapHeader: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "16px 20px", borderBottom: "1px solid rgba(74,222,128,0.1)",
  },
  mapHeaderIcon:  { fontSize: 18, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 9, padding: "5px 7px" },
  mapHeaderTitle: { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" },
  liveBadge:      { marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 20, padding: "3px 10px", animation: "pulse 2s ease-in-out infinite" },
 
  mapPlaceholder: {
    height: 380, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 12, padding: 32,
  },
  mapPlaceholderText: { fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 1.6 },
  mapIframe: { width: "100%", height: 380, border: "none", display: "block" },
  mapLoadingOverlay: {
    position: "absolute", inset: 0, background: "rgba(7,26,16,0.7)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  },
  coordOverlay: {
    position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
    background: "rgba(7,26,16,0.9)", border: "1px solid rgba(74,222,128,0.3)",
    borderRadius: 20, padding: "6px 16px",
  },
  coordOverlayText: { fontSize: 12, fontWeight: 600, color: "#4ade80", whiteSpace: "nowrap", fontFamily: "'Syne',sans-serif" },
 
  mapLinksRow: { display: "flex", gap: 10 },
  mapLink: {
    flex: 1, padding: "12px", textAlign: "center",
    background: "rgba(8,22,13,0.8)", border: "1px solid rgba(74,222,128,0.12)",
    borderRadius: 13, color: "rgba(255,255,255,0.6)",
    fontSize: 13, fontWeight: 500, textDecoration: "none",
    transition: "all 0.2s",
  },
 
  spinnerLg: { width: 28, height: 28, border: "2.5px solid rgba(74,222,128,0.2)", borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  spinnerSm: { width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" },
};
 