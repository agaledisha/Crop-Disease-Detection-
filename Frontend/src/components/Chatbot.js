// src/components/Chatbot.js
import React, { useState, useRef, useEffect } from "react";

const BACKEND = "http://127.0.0.1:5000";

// ✅ Quick Questions in all 3 languages
const QUICK_QUESTIONS = {
  en: [
    "How to treat tomato blight?",
    "Best fertilizer for wheat?",
    "How to prevent fungal disease?",
    "Signs of nutrient deficiency?",
    "Organic pest control methods?",
  ],
  mr: [
    "टोमॅटो ब्लाइट वर उपाय काय?",
    "गव्हासाठी सर्वोत्तम खत कोणते?",
    "फफुंद रोग कसे टाळावे?",
    "पोषण कमतरतेची लक्षणे कोणती?",
    "सेंद्रिय कीड नियंत्रण पद्धती?",
  ],
  hi: [
    "टमाटर ब्लाइट का इलाज कैसे करें?",
    "गेहूं के लिए सबसे अच्छा उर्वरक?",
    "फंगल रोग कैसे रोकें?",
    "पोषक तत्व की कमी के लक्षण?",
    "जैविक कीट नियंत्रण के तरीके?",
  ],
};

// ✅ Greeting in all 3 languages
const GREETING = {
  en: "🌿 Hello! I'm your AI Agriculture Advisor. Ask me anything about crop diseases, fertilizers, pests, or farming techniques.",
  mr: "🌿 नमस्कार! मी तुमचा AI शेती सल्लागार आहे. पिक रोग, खते, कीड किंवा शेती तंत्रांबद्दल काहीही विचारा.",
  hi: "🌿 नमस्ते! मैं आपका AI कृषि सलाहकार हूं। फसल रोग, उर्वरक, कीट या खेती तकनीकों के बारे में कुछ भी पूछें।",
};

// ✅ Placeholder in all 3 languages
const PLACEHOLDER = {
  en: "Ask about crop disease, fertilizer, pests...",
  mr: "पिक रोग, खत, कीड याबद्दल विचारा...",
  hi: "फसल रोग, उर्वरक, कीट के बारे में पूछें...",
};

// ✅ UI labels in all 3 languages
const LABELS = {
  en: { language: "Language", quickQ: "Quick Questions", clear: "🗑️ Clear Chat", advisor: "Agriculture AI Advisor", active: "Active", online: "● Online", send: "➤", listening: "Listening...", voiceError: "Voice recognition not supported." },
  mr: { language: "भाषा", quickQ: "झटपट प्रश्न", clear: "🗑️ चॅट साफ करा", advisor: "शेती AI सल्लागार", active: "सक्रिय", online: "● ऑनलाइन", send: "➤", listening: "ऐकत आहे...", voiceError: "व्हॉइस ओळख समर्थित नाही." },
  hi: { language: "भाषा", quickQ: "त्वरित प्रश्न", clear: "🗑️ चैट साफ करें", advisor: "कृषि AI सलाहकार", active: "सक्रिय", online: "● ऑनलाइन", send: "➤", listening: "सुन रहा हूं...", voiceError: "वॉयस पहचान समर्थित नहीं।" },
};

const LANG_LABELS = { en: "English", mr: "मराठी", hi: "हिंदी" };
const SPEECH_LANG = { en: "en-US", mr: "mr-IN", hi: "hi-IN" };

// ✅ FIXED: Strong language enforcement in API call
async function callChatAPI(query, lang) {
  const langName = { en: "English", mr: "Marathi (मराठी)", hi: "Hindi (हिंदी)" }[lang] || "English";

  // ✅ Force language in the query itself
  const forcedQuery = `[RESPOND ONLY IN ${langName.toUpperCase()} LANGUAGE] ${query}`;

  const res = await fetch(`${BACKEND}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: forcedQuery,
      lang: lang,
      language_name: langName,
    }),
  });
  const data = await res.json();
  return data.response || data.error || "No response received.";
}

export default function Chatbot() {
  const [lang, setLang] = useState("en");

  const [messages, setMessages] = useState([
    { role: "bot", text: GREETING["en"] }
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ✅ When language changes → update greeting message
  useEffect(() => {
    setMessages([{ role: "bot", text: GREETING[lang] }]);
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const L = LABELS[lang];

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const reply = await callChatAPI(q, lang);
      setMessages(m => [...m, { role: "bot", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "bot", text: "⚠️ AI service unavailable. Please ensure the backend is running." }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert(L.voiceError); return; }
    const rec = new SR();
    rec.lang = SPEECH_LANG[lang] || "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.start();
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    rec.onerror  = ()  => setListening(false);
    rec.onend    = ()  => setListening(false);
  };

  const clearChat = () => {
    setMessages([{ role: "bot", text: GREETING[lang] }]);
  };

  return (
    <div style={S.page}>
      <div style={S.bg1} /><div style={S.bg2} />

      <div style={S.container}>
        {/* ── Sidebar ──────────────────────────────────── */}
        <div style={S.sidebar}>
          <div style={S.sideCard}>
            <div style={S.botAvatar}>🤖</div>
            <div style={S.botName}>CropAI Assistant</div>
            <div style={S.botDesc}>Powered by AI · Agriculture Expert</div>
            <div style={S.onlineDot}>{L.online}</div>
          </div>

          {/* Language selector */}
          <div style={S.sideCard}>
            <div style={S.sideTitle}>🌐 {L.language}</div>
            {["en", "mr", "hi"].map(l => (
              <button
                key={l}
                style={{ ...S.langBtn, ...(lang === l ? S.langBtnActive : {}) }}
                onClick={() => setLang(l)}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>

          {/* ✅ Quick questions in selected language */}
          <div style={S.sideCard}>
            <div style={S.sideTitle}>⚡ {L.quickQ}</div>
            {QUICK_QUESTIONS[lang].map((q, i) => (
              <button key={i} style={S.quickBtn} onClick={() => send(q)}>{q}</button>
            ))}
          </div>

          <button style={S.clearBtn} onClick={clearChat}>{L.clear}</button>
        </div>

        {/* ── Chat area ─────────────────────────────────── */}
        <div style={S.chatArea}>

          {/* Header */}
          <div style={S.chatHeader}>
            <div style={S.chatHeaderLeft}>
              <div style={S.headerAvatar}>🌿</div>
              <div>
                <div style={S.headerTitle}>{L.advisor}</div>
                <div style={S.headerStatus}>● {L.active} · {LANG_LABELS[lang]}</div>
              </div>
            </div>
            {/* ✅ Language badge in header */}
            <div style={S.langBadge}>{LANG_LABELS[lang]}</div>
          </div>

          {/* Messages */}
          <div style={S.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...S.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "bot" && <div style={S.botIcon}>🤖</div>}
                <div style={{ ...S.bubble, ...(m.role === "user" ? S.userBubble : S.botBubble) }}>
                  {m.text}
                </div>
                {m.role === "user" && <div style={S.userIcon}>👤</div>}
              </div>
            ))}

            {loading && (
              <div style={{ ...S.msgRow, justifyContent: "flex-start" }}>
                <div style={S.botIcon}>🤖</div>
                <div style={S.botBubble}>
                  <span style={S.dot} />
                  <span style={{ ...S.dot, animationDelay: "0.2s" }} />
                  <span style={{ ...S.dot, animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ✅ Listening indicator */}
          {listening && (
            <div style={S.listeningBar}>
              🎤 {L.listening}
            </div>
          )}

          {/* Input */}
          <div style={S.inputArea}>
            <button
              style={{
                ...S.voiceBtn,
                background:   listening ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.1)",
                borderColor:  listening ? "rgba(239,68,68,0.4)" : "rgba(74,222,128,0.25)",
              }}
              onClick={startVoice}
              title="Voice input"
            >
              {listening ? "🔴" : "🎤"}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={PLACEHOLDER[lang]}
              style={S.textInput}
              disabled={loading}
              onFocus={e => e.target.style.borderColor = "#4ade80"}
              onBlur={e  => e.target.style.borderColor = "rgba(74,222,128,0.2)"}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{ ...S.sendBtn, opacity: (loading || !input.trim()) ? 0.5 : 1 }}
            >
              {loading ? "⏳" : L.send}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes blob { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
      `}</style>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", padding: "88px 24px 40px", background: "linear-gradient(160deg,#071a10 0%,#0d2818 60%,#0a1a0f 100%)", fontFamily: "'DM Sans',sans-serif", color: "#fff", position: "relative", overflow: "hidden" },
  bg1: { position: "absolute", width: 500, height: 500, borderRadius: "50%", top: -100, right: -100, background: "radial-gradient(circle,rgba(74,222,128,0.07) 0%,transparent 70%)", animation: "blob 10s ease-in-out infinite", pointerEvents: "none" },
  bg2: { position: "absolute", width: 400, height: 400, borderRadius: "50%", bottom: -80, left: -80, background: "radial-gradient(circle,rgba(234,179,8,0.06) 0%,transparent 70%)", animation: "blob 13s ease-in-out infinite reverse", pointerEvents: "none" },
  container: { display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, maxWidth: 1100, margin: "0 auto", height: "calc(100vh - 148px)", position: "relative" },
  sidebar: { display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" },
  sideCard: { background: "rgba(10,30,15,0.7)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 16, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 8 },
  botAvatar: { fontSize: 40, textAlign: "center", marginBottom: 4 },
  botName: { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", textAlign: "center" },
  botDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center" },
  onlineDot: { fontSize: 12, color: "#4ade80", textAlign: "center", fontWeight: 600 },
  sideTitle: { fontSize: 12, fontWeight: 700, color: "rgba(74,222,128,0.7)", letterSpacing: 0.5, marginBottom: 4 },
  langBtn: { padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8, color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", textAlign: "left", transition: "all 0.15s" },
  langBtnActive: { background: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.35)", color: "#4ade80", fontWeight: 700 },
  quickBtn: { padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.55)", fontSize: 12, cursor: "pointer", textAlign: "left", lineHeight: 1.5, transition: "background 0.15s" },
  clearBtn: { padding: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#f87171", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  chatArea: { background: "rgba(10,30,15,0.7)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 20, display: "flex", flexDirection: "column", overflow: "hidden" },
  chatHeader: { padding: "16px 20px", borderBottom: "1px solid rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  chatHeaderLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerAvatar: { fontSize: 28, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" },
  headerStatus: { fontSize: 12, color: "#4ade80", marginTop: 2 },
  langBadge: { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#4ade80" },
  messages: { flex: 1, overflowY: "auto", padding: "20px 20px 10px", display: "flex", flexDirection: "column", gap: 16 },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  botIcon: { fontSize: 22, flexShrink: 0, marginBottom: 2 },
  userIcon: { fontSize: 20, flexShrink: 0, marginBottom: 2 },
  bubble: { maxWidth: "72%", padding: "12px 16px", borderRadius: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" },
  botBubble: { background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", color: "rgba(255,255,255,0.85)", borderRadius: "4px 16px 16px 16px", display: "flex", alignItems: "center", gap: 6 },
  userBubble: { background: "linear-gradient(135deg,#16a34a,#4ade80)", color: "#fff", borderRadius: "16px 4px 16px 16px" },
  dot: { width: 8, height: 8, background: "#4ade80", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s ease-in-out infinite" },
  listeningBar: { padding: "8px 20px", background: "rgba(239,68,68,0.1)", borderTop: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 13, fontWeight: 600, textAlign: "center", flexShrink: 0 },
  inputArea: { padding: "14px 16px", borderTop: "1px solid rgba(74,222,128,0.1)", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 },
  voiceBtn: { width: 40, height: 40, borderRadius: 10, border: "1px solid", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  textInput: { flex: 1, padding: "11px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.2s" },
  sendBtn: { width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#16a34a,#4ade80)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};