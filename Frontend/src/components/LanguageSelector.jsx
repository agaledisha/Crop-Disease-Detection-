// src/components/LanguageSelector.jsx

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", native: "English" },
  { code: "hi", label: "Hindi",   flag: "🇮🇳", native: "हिंदी"   },
  { code: "mr", label: "Marathi", flag: "🌿",  native: "मराठी"   },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("cropai_lang", code);
    setOpen(false);
  };

  return (
    <div style={S.wrap}>
      <button style={S.trigger} onClick={() => setOpen((p) => !p)}>
        <span style={S.flag}>{current.flag}</span>
        <span style={S.triggerLabel}>{current.native}</span>
        <span style={{ ...S.arrow, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>

      {open && (
        <>
          <div style={S.overlay} onClick={() => setOpen(false)} />
          <div style={S.dropdown}>
            <div style={S.dropHeader}>🌐 Select Language</div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                style={{ ...S.option, ...(lang.code === i18n.language ? S.optionActive : {}) }}
                onClick={() => switchLang(lang.code)}
              >
                <span style={S.optFlag}>{lang.flag}</span>
                <div style={S.optText}>
                  <span style={S.optNative}>{lang.native}</span>
                  <span style={S.optLabel}>{lang.label}</span>
                </div>
                {lang.code === i18n.language && <span style={S.checkmark}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const S = {
  wrap: { position: "relative", display: "inline-block", zIndex: 1000 },
  trigger: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
    borderRadius: 10, padding: "7px 12px", color: "#4ade80",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
  },
  flag: { fontSize: 16 },
  triggerLabel: { fontSize: 13 },
  arrow: { fontSize: 10, transition: "transform 0.2s", display: "inline-block" },
  overlay: { position: "fixed", inset: 0, zIndex: 998 },
  dropdown: {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    background: "rgba(10,30,15,0.97)", border: "1px solid rgba(74,222,128,0.25)",
    borderRadius: 14, padding: "8px", minWidth: 180, zIndex: 999,
    animation: "dropIn 0.18s ease",
    boxShadow: "0 12px 40px rgba(0,0,0,0.4)", backdropFilter: "blur(16px)",
  },
  dropHeader: {
    fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600,
    letterSpacing: 1, padding: "6px 10px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 6, textTransform: "uppercase",
  },
  option: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", background: "none", border: "1px solid transparent",
    borderRadius: 10, padding: "10px 12px", cursor: "pointer",
    color: "#fff", transition: "background 0.15s", textAlign: "left",
    fontFamily: "'DM Sans', sans-serif",
  },
  optionActive: { background: "rgba(74,222,128,0.12)", borderColor: "rgba(74,222,128,0.2)" },
  optFlag: { fontSize: 18, width: 24, textAlign: "center" },
  optText: { display: "flex", flexDirection: "column", flex: 1 },
  optNative: { fontSize: 14, fontWeight: 600, color: "#fff" },
  optLabel: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 },
  checkmark: { color: "#4ade80", fontSize: 14, fontWeight: 700 },
};
