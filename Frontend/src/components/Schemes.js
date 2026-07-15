// src/components/Schemes.js
import React, { useEffect, useState } from "react";

const BACKEND = "http://127.0.0.1:5000";

// ── Fallback schemes (shown when backend/json is offline) ─────────────────────
const FALLBACK_SCHEMES = {
  en: [
    { title: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)", description: "Direct income support of ₹6,000/year to small and marginal farmers in three installments of ₹2,000 each.", link: "https://pmkisan.gov.in", category: "Income Support" },
    { title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)", description: "Crop insurance scheme providing financial support to farmers suffering crop loss due to natural calamities, pests, and diseases.", link: "https://pmfby.gov.in", category: "Crop Insurance" },
    { title: "Soil Health Card Scheme", description: "Free soil testing and Soil Health Cards issued to farmers with crop-wise recommendations for fertilizer dosage.", link: "https://soilhealth.dac.gov.in", category: "Soil & Fertilizer" },
    { title: "Kisan Credit Card (KCC)", description: "Provides short-term credit to farmers for cultivation, post-harvest expenses, and maintenance of farm assets at subsidized rates.", link: "https://www.nabard.org", category: "Credit & Finance" },
    { title: "National Mission for Sustainable Agriculture (NMSA)", description: "Promotes sustainable agriculture through water-use efficiency, soil health management, and climate-resilient farming practices.", link: "https://nmsa.dac.gov.in", category: "Sustainability" },
    { title: "Paramparagat Krishi Vikas Yojana (PKVY)", description: "Financial assistance to farmers for organic farming. ₹50,000/hectare is provided over 3 years for cluster formation and certification.", link: "https://pgsindia-ncof.gov.in", category: "Organic Farming" },
    { title: "PM Krishi Sinchayee Yojana (PMKSY)", description: "'Har Khet Ko Pani, More Crop Per Drop' — ensures irrigation facilities to every farm and improves water-use efficiency.", link: "https://pmksy.gov.in", category: "Irrigation" },
    { title: "eNAM — National Agriculture Market", description: "Online trading platform for agricultural commodities. Links farmers to buyers nationally for better price realization.", link: "https://enam.gov.in", category: "Market Access" },
    { title: "Rashtriya Krishi Vikas Yojana (RKVY)", description: "Provides states flexibility to plan agricultural development. Supports farmers with modern technology and market linkage.", link: "https://rkvy.nic.in", category: "Development" },
    { title: "Namo Shetkari Maha Samman Nidhi (Maharashtra)", description: "Maharashtra state scheme providing additional ₹6,000/year to farmers, over and above PM-KISAN benefit.", link: "https://nsmsnidhi.maharashtra.gov.in", category: "State Scheme" },
    { title: "Dr. Panjabrao Deshmukh Krishi Vidyapeeth Schemes", description: "Scholarships and training programs for agricultural education and skill development in Maharashtra.", link: "https://pdkv.ac.in", category: "Education" },
    { title: "Mukhyamantri Saur Krishi Pump Yojana", description: "Subsidized solar pumps provided to farmers for irrigation, reducing dependency on electricity and diesel pumps.", link: "https://www.mahadiscom.in", category: "Solar & Energy" },
  ],
  mr: [
    { title: "पीएम-किसान (प्रधानमंत्री किसान सन्मान निधी)", description: "लहान व सीमांत शेतकऱ्यांना वार्षिक ₹6,000 थेट आर्थिक सहाय्य, तीन हप्त्यांमध्ये दिले जाते.", link: "https://pmkisan.gov.in", category: "उत्पन्न सहाय्य" },
    { title: "प्रधानमंत्री फसल विमा योजना (PMFBY)", description: "नैसर्गिक आपत्ती, कीड व रोगामुळे पीक नुकसान झाल्यास शेतकऱ्यांना आर्थिक संरक्षण देणारी विमा योजना.", link: "https://pmfby.gov.in", category: "पीक विमा" },
    { title: "माती आरोग्य कार्ड योजना", description: "शेतकऱ्यांना विनामूल्य माती तपासणी आणि पीकनिहाय खत शिफारशींसह माती आरोग्य कार्ड दिले जाते.", link: "https://soilhealth.dac.gov.in", category: "माती व खत" },
    { title: "किसान क्रेडिट कार्ड (KCC)", description: "शेती खर्च, कापणीनंतरचे खर्च आणि शेत मालमत्तेच्या देखभालीसाठी अल्पकालीन कर्ज सवलतीच्या दरात.", link: "https://www.nabard.org", category: "कर्ज व वित्त" },
    { title: "नमो शेतकरी महासन्मान निधी (महाराष्ट्र)", description: "महाराष्ट्र राज्य शेतकऱ्यांना पीएम-किसानव्यतिरिक्त वार्षिक ₹6,000 अतिरिक्त सहाय्य देते.", link: "https://nsmsnidhi.maharashtra.gov.in", category: "राज्य योजना" },
    { title: "मुख्यमंत्री सौर कृषी पंप योजना", description: "शेतकऱ्यांना सिंचनासाठी अनुदानित सौर पंप, वीज व डिझेलवरील अवलंबन कमी करण्यासाठी.", link: "https://www.mahadiscom.in", category: "सौर ऊर्जा" },
    { title: "परंपरागत कृषी विकास योजना (PKVY)", description: "सेंद्रिय शेतीसाठी ₹50,000/हेक्टर अनुदान, 3 वर्षांत प्रमाणीकरणासह दिले जाते.", link: "https://pgsindia-ncof.gov.in", category: "सेंद्रिय शेती" },
  ],
  hi: [
    { title: "पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)", description: "छोटे और सीमांत किसानों को ₹6,000 प्रति वर्ष सीधे बैंक खाते में दिया जाता है।", link: "https://pmkisan.gov.in", category: "आय सहायता" },
    { title: "प्रधानमंत्री फसल बीमा योजना (PMFBY)", description: "प्राकृतिक आपदाओं से फसल नुकसान होने पर किसानों को वित्तीय सुरक्षा प्रदान करती है।", link: "https://pmfby.gov.in", category: "फसल बीमा" },
    { title: "मृदा स्वास्थ्य कार्ड योजना", description: "किसानों को मुफ्त मिट्टी परीक्षण और फसलवार उर्वरक सिफारिशों के साथ मृदा स्वास्थ्य कार्ड दिया जाता है।", link: "https://soilhealth.dac.gov.in", category: "मिट्टी और उर्वरक" },
    { title: "किसान क्रेडिट कार्ड (KCC)", description: "खेती के खर्च के लिए रियायती दरों पर अल्पकालिक ऋण प्रदान करता है।", link: "https://www.nabard.org", category: "ऋण और वित्त" },
    { title: "परम्परागत कृषि विकास योजना (PKVY)", description: "जैविक खेती के लिए ₹50,000/हेक्टेयर अनुदान, 3 वर्षों में प्रमाणीकरण के साथ दिया जाता है।", link: "https://pgsindia-ncof.gov.in", category: "जैविक खेती" },
    { title: "eNAM — राष्ट्रीय कृषि बाजार", description: "किसानों को राष्ट्रीय स्तर पर खरीदारों से जोड़ने और बेहतर मूल्य दिलाने का ऑनलाइन मंच।", link: "https://enam.gov.in", category: "बाजार पहुंच" },
  ],
};

const CATEGORY_COLORS = {
  "Income Support": "#4ade80", "Crop Insurance": "#f87171", "Soil & Fertilizer": "#facc15",
  "Credit & Finance": "#93c5fd", "Sustainability": "#6ee7b7", "Organic Farming": "#a78bfa",
  "Irrigation": "#38bdf8", "Market Access": "#fb923c", "Development": "#f9a8d4",
  "State Scheme": "#fbbf24", "Education": "#c4b5fd", "Solar & Energy": "#fde68a",
  "उत्पन्न सहाय्य": "#4ade80", "पीक विमा": "#f87171", "माती व खत": "#facc15",
  "कर्ज व वित्त": "#93c5fd", "राज्य योजना": "#fbbf24", "सौर ऊर्जा": "#fde68a",
  "सेंद्रिय शेती": "#a78bfa", "आय सहायता": "#4ade80", "फसल बीमा": "#f87171",
  "मिट्टी और उर्वरक": "#facc15", "ऋण और वित्त": "#93c5fd", "जैविक खेती": "#a78bfa",
  "बाजार पहुंच": "#fb923c",
};

export default function Schemes() {
  const [schemes, setSchemes]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [lang, setLang]         = useState("en");

  // Detect language from i18n localStorage
  useEffect(() => {
    const l = localStorage.getItem("i18nextLng") || "en";
    setLang(l.split("-")[0]);
  }, []);

  // Load schemes from backend, fallback to hardcoded
  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/api/gov-schemes?lang=${lang}`)
      .then(r => r.json())
      .then(d => {
        const list = d?.schemes || [];
        if (list.length > 0) { setSchemes(list); setFiltered(list); }
        else { const fb = FALLBACK_SCHEMES[lang] || FALLBACK_SCHEMES.en; setSchemes(fb); setFiltered(fb); }
      })
      .catch(() => {
        const fb = FALLBACK_SCHEMES[lang] || FALLBACK_SCHEMES.en;
        setSchemes(fb); setFiltered(fb);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) { setFiltered(schemes); return; }
    const q = search.toLowerCase();
    setFiltered(schemes.filter(s => (s.title || "").toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q)));
  }, [search, schemes]);

  const langLabel = { en: "English", mr: "मराठी", hi: "हिंदी" };

  return (
    <div style={S.page}>
      <div style={S.bg1} /><div style={S.bg2} />

      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.pageTag}>GOVERNMENT</div>
        <h1 style={S.pageTitle}>Agriculture Schemes</h1>
        <p style={S.pageDesc}>Discover government schemes, subsidies, and financial support available for farmers.</p>

        {/* Language + Search row */}
        <div style={S.controlRow}>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search schemes..."
              style={S.searchInput}
              onFocus={e => e.target.style.borderColor = "#4ade80"}
              onBlur={e => e.target.style.borderColor = "rgba(74,222,128,0.2)"}
            />
            {search && <button style={S.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>
          <div style={S.langRow}>
            {["en", "mr", "hi"].map(l => (
              <button key={l} style={{ ...S.langBtn, ...(lang === l ? S.langBtnActive : {}) }} onClick={() => setLang(l)}>
                {langLabel[l]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={S.statsBar}>
        <span style={S.statItem}>📋 <strong>{filtered.length}</strong> schemes found</span>
        <span style={S.statItem}>🏛️ Government of India & State schemes</span>
        <span style={S.statItem}>🆓 Most schemes are free to apply</span>
      </div>

      {/* Loading */}
      {loading && <div style={S.loading}><div style={S.spinner} /> Loading schemes...</div>}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={S.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          No schemes match "<strong>{search}</strong>"
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div style={S.grid}>
          {filtered.map((s, i) => {
            const color = CATEGORY_COLORS[s.category] || "#4ade80";
            return (
              <div key={i} style={S.card}>
                {s.category && (
                  <div style={{ ...S.categoryBadge, background: `${color}15`, color, borderColor: `${color}35` }}>
                    {s.category}
                  </div>
                )}
                <h3 style={S.cardTitle}>{s.title}</h3>
                <p style={S.cardDesc}>{s.description}</p>
                {s.link && (
                  <a href={s.link} target="_blank" rel="noreferrer" style={{ ...S.cardLink, color }}>
                    Visit Official Site →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blob { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      `}</style>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", padding: "88px 28px 60px", background: "linear-gradient(160deg,#071a10 0%,#0d2818 60%,#0a1a0f 100%)", fontFamily: "'DM Sans',sans-serif", color: "#fff", position: "relative", overflow: "hidden" },
  bg1: { position: "absolute", width: 500, height: 500, borderRadius: "50%", top: -100, right: -100, background: "radial-gradient(circle,rgba(74,222,128,0.08) 0%,transparent 70%)", animation: "blob 10s ease-in-out infinite", pointerEvents: "none" },
  bg2: { position: "absolute", width: 400, height: 400, borderRadius: "50%", bottom: -80, left: -80, background: "radial-gradient(circle,rgba(234,179,8,0.06) 0%,transparent 70%)", animation: "blob 13s ease-in-out infinite reverse", pointerEvents: "none" },
  pageHeader: { textAlign: "center", marginBottom: 28, position: "relative" },
  pageTag: { display: "inline-block", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: 11, fontWeight: 700, letterSpacing: 2, padding: "4px 12px", borderRadius: 20, marginBottom: 12 },
  pageTitle: { fontFamily: "'Syne',sans-serif", fontSize: "clamp(24px,4vw,42px)", fontWeight: 800, margin: "0 0 10px", background: "linear-gradient(135deg,#fff 30%,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  pageDesc: { fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 24px" },
  controlRow: { display: "flex", gap: 14, alignItems: "center", justifyContent: "center", flexWrap: "wrap" },
  searchWrap: { position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 14, fontSize: 15 },
  searchInput: { padding: "11px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", width: 280, fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.2s" },
  clearBtn: { position: "absolute", right: 12, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 },
  langRow: { display: "flex", gap: 8 },
  langBtn: { padding: "9px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", transition: "all 0.2s" },
  langBtnActive: { background: "rgba(74,222,128,0.12)", borderColor: "rgba(74,222,128,0.4)", color: "#4ade80", fontWeight: 700 },
  statsBar: { display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 32, padding: "12px 20px", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 14, maxWidth: 700, margin: "0 auto 32px" },
  statItem: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 60, color: "rgba(255,255,255,0.5)", fontSize: 15 },
  spinner: { width: 22, height: 22, border: "2px solid rgba(74,222,128,0.2)", borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  empty: { textAlign: "center", padding: "60px 24px", color: "rgba(255,255,255,0.5)", fontSize: 15 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 20, maxWidth: 1100, margin: "0 auto" },
  card: { background: "rgba(10,30,15,0.7)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 10, transition: "border-color 0.2s, transform 0.2s" },
  categoryBadge: { display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: "4px 12px", borderRadius: 20, border: "1px solid", width: "fit-content" },
  cardTitle: { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.5 },
  cardDesc: { fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: 0, flex: 1 },
  cardLink: { fontSize: 13, fontWeight: 600, textDecoration: "none", marginTop: "auto" },
};
