// src/components/Dashboard.js
// Works perfectly even when backend is offline — shows demo data with clear indicators

import React, { useEffect, useState } from "react";

const BACKEND = "http://127.0.0.1:5000";

const TIPS = [
  "📸 Use natural daylight for clearest leaf photos.",
  "💧 Water early morning to reduce fungal risk.",
  "🌱 Rotate crops each season to prevent soil disease.",
  "🧪 Test soil pH before applying fertilizers.",
  "🛡️ Use neem-based sprays for organic pest control.",
  "🌾 Remove infected leaves immediately to stop spread.",
  "🌡️ Monitor temperature — most fungi thrive above 25°C.",
  "💡 Intercropping reduces pest pressure naturally.",
];

const MOCK_DETECTION = { disease: "Tomato___Early_blight", confidence: "87.42%", date: new Date().toISOString().split("T")[0], is_mock: true };
const MOCK_BOOKING   = { farmer_name: "Demo Farmer", status: "Pending", date: new Date().toISOString().split("T")[0], is_mock: true };
const MOCK_WEATHER   = { temp: 33, humidity: 68, wind_speed: 3.2, condition: "partly cloudy", city: "Kolhapur", is_mock: true };

function weatherIcon(cond = "") {
  const c = cond.toLowerCase();
  if (c.includes("rain"))  return "🌧️";
  if (c.includes("cloud")) return "⛅";
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("storm")) return "⛈️";
  if (c.includes("fog"))   return "🌫️";
  return "🌤️";
}

function statusColor(s = "") {
  const l = s.toLowerCase();
  if (l === "completed") return "#4ade80";
  if (l === "pending")   return "#facc15";
  return "#93c5fd";
}

function InfoRow({ icon, label, value, color = "#4ade80" }) {
  return (
    <div style={S.infoRow}>
      <div style={{ ...S.infoIcon, background: `${color}15`, border: `1px solid ${color}25` }}>{icon}</div>
      <div>
        <div style={S.infoLabel}>{label}</div>
        <div style={{ ...S.infoValue, color }}>{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [detection, setDetection] = useState(null);
  const [booking,   setBooking]   = useState(null);
  const [weather,   setWeather]   = useState(null);
  const [backendUp, setBackendUp] = useState(true);
  const [tipIdx,    setTipIdx]    = useState(0);
  const [gpsNote,   setGpsNote]   = useState("");
  const [clock,     setClock]     = useState(new Date());

  const user = (() => { try { return JSON.parse(localStorage.getItem("cropai_user")); } catch { return null; } })();

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Tip rotator
  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 4500);
    return () => clearInterval(t);
  }, []);

  // Backend data
  useEffect(() => {
    const tryFetch = (url, setter, fallback) =>
      fetch(url).then(r => r.json()).then(d => setter(d || fallback)).catch(() => { setter(fallback); setBackendUp(false); });

    tryFetch(`${BACKEND}/dashboard/last-detection`,      setDetection, MOCK_DETECTION);
    tryFetch(`${BACKEND}/dashboard/latest-soil-booking`, setBooking,   MOCK_BOOKING);
  }, []);

  // Weather
  useEffect(() => {
    if (!navigator.geolocation) { setWeather(MOCK_WEATHER); setGpsNote("GPS not supported — demo weather shown"); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(`${BACKEND}/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`);
          const d = await r.json();
          setWeather(d.temp !== undefined ? d : MOCK_WEATHER);
          if (d.temp === undefined) setGpsNote("Backend offline — demo weather shown");
        } catch { setWeather(MOCK_WEATHER); setBackendUp(false); setGpsNote("Backend offline — demo weather shown"); }
      },
      () => { setWeather(MOCK_WEATHER); setGpsNote("GPS permission denied — demo weather shown"); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const greeting = () => { const h = clock.getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; };

  return (
    <div style={S.page}>
      <div style={S.bg1} /><div style={S.bg2} /><div style={S.gridBg} />

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.tag}>FARMER DASHBOARD</div>
          <h1 style={S.title}>{greeting()}, {user?.name?.split(" ")[0] || "Farmer"} 👋</h1>
          <p style={S.sub}>Here's your farm overview and local conditions.</p>
        </div>
        <div style={S.clock}>
          <div style={S.clockTime}>{clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
          <div style={S.clockDate}>{clock.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div>
        </div>
      </div>

      {/* Offline banner */}
      {!backendUp && (
        <div style={S.offlineBanner}>
          <span style={S.pulseDot} />
          Backend offline — run <code style={S.code}>python app.py</code> in your Backend folder to enable live data.
          Showing demo data.
        </div>
      )}

      {/* Tip bar */}
      <div style={S.tipBar}>
        <span style={S.greenDot} />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{TIPS[tipIdx]}</span>
      </div>

      {/* Grid */}
      <div style={S.grid}>

        {/* Weather — full width */}
        <div style={{ ...S.card, gridColumn: "span 2" }}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🌦️</span>
            <span style={S.cardTitle}>Local Weather</span>
            <span style={weather?.is_mock ? S.demoBadge : S.liveBadge}>{weather?.is_mock ? "Demo" : "Live"}</span>
          </div>
          {weather ? (
            <div style={S.weatherRow}>
              <div style={S.wLeft}>
                <div style={{ fontSize: 64 }}>{weatherIcon(weather.condition)}</div>
                <div>
                  <div style={S.wTemp}>{Math.round(weather.temp)}°C</div>
                  <div style={S.wCond}>{weather.condition}</div>
                  {weather.city && <div style={S.wCity}>📍 {weather.city}</div>}
                </div>
              </div>
              <div style={S.wStats}>
                {[
                  { icon: "💧", label: "Humidity",  value: `${weather.humidity}%`     },
                  { icon: "💨", label: "Wind",       value: `${weather.wind_speed} m/s`},
                  { icon: "🌡️", label: "Feels Like", value: `${Math.round(weather.temp - 2)}°C` },
                ].map(w => (
                  <div key={w.label} style={S.wStat}>
                    <div style={{ fontSize: 26 }}>{w.icon}</div>
                    <div style={S.wStatVal}>{w.value}</div>
                    <div style={S.wStatLabel}>{w.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={S.loadRow}><div style={S.spinner} /> Detecting location...</div>
          )}
          {gpsNote && <div style={S.note}>ℹ️ {gpsNote}</div>}
        </div>

        {/* Last Detection */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🔬</span>
            <span style={S.cardTitle}>Last Disease Detection</span>
            {detection?.is_mock && <span style={S.demoBadge}>Demo</span>}
          </div>
          {detection ? (
            <div style={S.colGap}>
              <InfoRow icon="🦠" label="Disease"    value={detection.disease?.replace(/_+/g," ")} color="#f87171" />
              <InfoRow icon="📊" label="Confidence" value={detection.confidence}                  color="#4ade80" />
              <InfoRow icon="📅" label="Date"       value={detection.date}                        color="#93c5fd" />
              <div style={S.alertBadge}>⚠️ Disease Detected — Review Treatment</div>
              <a href="/detect" style={S.link}>🔬 Run New Detection →</a>
            </div>
          ) : (
            <div style={S.empty}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🌱</div>
              <div style={S.emptyTitle}>No detections yet</div>
              <div style={S.emptyHint}>Upload a leaf image to get started</div>
              <a href="/detect" style={S.link}>🔬 Detect Now →</a>
            </div>
          )}
        </div>

        {/* Soil Booking */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🧪</span>
            <span style={S.cardTitle}>Soil Test Booking</span>
            {booking?.is_mock && <span style={S.demoBadge}>Demo</span>}
          </div>
          {booking ? (
            <div style={S.colGap}>
              <InfoRow icon="👨‍🌾" label="Farmer"  value={booking.farmer_name} color="#4ade80" />
              <InfoRow icon="📅"   label="Date"    value={booking.date}        color="#93c5fd" />
              <div style={{ ...S.statusBadge, color: statusColor(booking.status), borderColor: statusColor(booking.status) + "40" }}>
                ● Status: {booking.status}
              </div>
              <a href="/soil-test" style={S.link}>🧪 Book Another Test →</a>
            </div>
          ) : (
            <div style={S.empty}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🧪</div>
              <div style={S.emptyTitle}>No bookings yet</div>
              <div style={S.emptyHint}>Book a soil test to improve yield</div>
              <a href="/soil-test" style={S.link}>🧪 Book Now →</a>
            </div>
          )}
        </div>

        {/* Farming Tips */}
        <div style={{ ...S.card, gridColumn: "span 2" }}>
          <div style={S.cardHead}><span style={S.cardIcon}>💡</span><span style={S.cardTitle}>Smart Farming Tips</span></div>
          <div style={S.tipsGrid}>
            {TIPS.map((t, i) => (
              <div key={i} style={{ ...S.tipCard, ...(i === tipIdx ? S.tipActive : {}) }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ ...S.card, gridColumn: "span 2" }}>
          <div style={S.cardHead}><span style={S.cardIcon}>⚡</span><span style={S.cardTitle}>Quick Actions</span></div>
          <div style={S.actRow}>
            {[
              { label: "Detect Disease",  icon: "🔬", href: "/detect",      color: "#4ade80" },
              { label: "Book Soil Test",  icon: "🧪", href: "/soil-test",   color: "#facc15" },
              { label: "AI Chatbot",      icon: "🤖", href: "/chatbot",     color: "#93c5fd" },
              { label: "Gov Schemes",     icon: "📋", href: "/schemes",     color: "#f9a8d4" },
              { label: "Community",       icon: "💬", href: "/forum",       color: "#6ee7b7" },
              { label: "My Location",     icon: "📍", href: "/GeoLocation", color: "#fb923c" },
            ].map(a => (
              <a key={a.label} href={a.href} style={{ ...S.actBtn, borderColor: a.color + "30" }}>
                <span style={{ fontSize: 28 }}>{a.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: a.color, textAlign: "center", lineHeight: 1.4 }}>{a.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Backend guide when offline */}
        {!backendUp && (
          <div style={{ ...S.card, gridColumn: "span 2", borderColor: "rgba(234,179,8,0.2)" }}>
            <div style={S.cardHead}><span style={S.cardIcon}>🔌</span><span style={S.cardTitle}>How to Start Backend</span></div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 14, lineHeight: 1.7 }}>
              Start your Flask backend to see live weather, real detections, and soil bookings:
            </p>
            <div style={S.codeBlock}>
              <div style={S.codeLine}><span style={{ color: "#4ade80" }}>$</span> cd Backend</div>
              <div style={S.codeLine}><span style={{ color: "#4ade80" }}>$</span> venv\Scripts\activate &nbsp;&nbsp;<span style={{ color: "rgba(255,255,255,0.3)" }}># Windows</span></div>
              <div style={S.codeLine}><span style={{ color: "#4ade80" }}>$</span> python app.py</div>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 10 }}>
              API will run at <span style={{ color: "#4ade80" }}>http://localhost:5000</span>
            </p>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes blob { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", padding: "80px 24px 60px", background: "linear-gradient(160deg,#071a10 0%,#0d2818 55%,#0a1a0f 100%)", fontFamily: "'DM Sans',sans-serif", color: "#fff", position: "relative", overflow: "hidden" },
  bg1:   { position: "absolute", width: 600, height: 600, borderRadius: "50%", top: -150, right: -150, background: "radial-gradient(circle,rgba(74,222,128,0.07) 0%,transparent 70%)", animation: "blob 12s ease-in-out infinite", pointerEvents: "none" },
  bg2:   { position: "absolute", width: 450, height: 450, borderRadius: "50%", bottom: -100, left: -100, background: "radial-gradient(circle,rgba(234,179,8,0.05) 0%,transparent 70%)", animation: "blob 15s ease-in-out infinite reverse", pointerEvents: "none" },
  gridBg:{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" },
  header:{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20, position: "relative" },
  tag:   { display: "inline-block", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "4px 12px", borderRadius: 20, marginBottom: 10 },
  title: { fontFamily: "'Syne',sans-serif", fontSize: "clamp(20px,3.5vw,34px)", fontWeight: 800, margin: "0 0 6px", background: "linear-gradient(135deg,#fff 30%,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  sub:   { fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0 },
  clock: { background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 14, padding: "10px 18px", textAlign: "center", flexShrink: 0 },
  clockTime: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#4ade80" },
  clockDate: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  offlineBanner: { display: "flex", alignItems: "center", gap: 10, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.22)", borderRadius: 12, padding: "11px 16px", marginBottom: 14, fontSize: 13, color: "rgba(234,179,8,0.85)" },
  pulseDot: { width: 8, height: 8, background: "#facc15", borderRadius: "50%", flexShrink: 0, boxShadow: "0 0 6px #facc15", animation: "pulse 2s ease-in-out infinite" },
  code: { background: "rgba(255,255,255,0.1)", padding: "2px 7px", borderRadius: 5, fontSize: 12, fontFamily: "monospace", color: "#fff" },
  tipBar: { display: "flex", alignItems: "center", gap: 10, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 12, padding: "11px 16px", marginBottom: 22 },
  greenDot: { width: 7, height: 7, background: "#4ade80", borderRadius: "50%", flexShrink: 0, boxShadow: "0 0 5px #4ade80" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, maxWidth: 1100, margin: "0 auto" },
  card: { background: "rgba(8,22,13,0.8)", backdropFilter: "blur(16px)", border: "1px solid rgba(74,222,128,0.11)", borderRadius: 20, padding: "20px 22px", position: "relative" },
  cardHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 },
  cardIcon: { fontSize: 19, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 9, padding: "5px 7px" },
  cardTitle: { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" },
  demoBadge: { marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: 1, background: "rgba(234,179,8,0.1)", color: "#facc15", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 7, padding: "3px 9px" },
  liveBadge: { marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: 1, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 7, padding: "3px 9px" },
  infoRow:  { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(74,222,128,0.07)", borderRadius: 11, padding: "11px 14px" },
  infoIcon: { width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 },
  infoLabel:{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
  infoValue:{ fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  colGap:   { display: "flex", flexDirection: "column", gap: 10 },
  alertBadge:{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#fca5a5" },
  statusBadge:{ background: "rgba(250,204,21,0.08)", border: "1px solid", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 600 },
  link: { display: "inline-block", marginTop: 4, fontSize: 13, fontWeight: 700, color: "#4ade80", textDecoration: "none" },
  empty:{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", textAlign: "center" },
  emptyTitle: { fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 5 },
  emptyHint:  { fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 12 },
  weatherRow: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 },
  wLeft: { display: "flex", alignItems: "center", gap: 16 },
  wTemp: { fontFamily: "'Syne',sans-serif", fontSize: 50, fontWeight: 800, color: "#fff", lineHeight: 1 },
  wCond: { fontSize: 14, color: "rgba(255,255,255,0.5)", textTransform: "capitalize", marginTop: 4 },
  wCity: { fontSize: 12, color: "rgba(74,222,128,0.65)", marginTop: 3 },
  wStats:{ display: "flex", gap: 12, flexWrap: "wrap" },
  wStat: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 13, padding: "12px 18px", textAlign: "center", minWidth: 84 },
  wStatVal:  { fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", margin: "5px 0 3px" },
  wStatLabel:{ fontSize: 11, color: "rgba(255,255,255,0.36)" },
  note: { fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 10, padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 7 },
  tipsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 },
  tipCard:  { background: "rgba(74,222,128,0.03)", border: "1px solid rgba(74,222,128,0.09)", borderRadius: 11, padding: "12px 14px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, transition: "all 0.4s" },
  tipActive:{ background: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.28)", color: "#fff" },
  actRow:   { display: "flex", gap: 10, flexWrap: "wrap" },
  actBtn:   { display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid", borderRadius: 14, textDecoration: "none", transition: "all 0.2s", minWidth: 84 },
  loadRow:  { display: "flex", alignItems: "center", gap: 12, padding: "20px 0", color: "rgba(255,255,255,0.4)", fontSize: 14 },
  spinner:  { width: 20, height: 20, border: "2px solid rgba(74,222,128,0.2)", borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  codeBlock:{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 11, padding: "13px 16px", display: "flex", flexDirection: "column", gap: 6, fontFamily: "monospace" },
  codeLine: { fontSize: 13, color: "#fff", letterSpacing: 0.3 },
};
