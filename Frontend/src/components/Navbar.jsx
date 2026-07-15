// src/components/Navbar.jsx
// Updated Navbar — fully translated with i18n

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("cropai_user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("cropai_user");
    localStorage.removeItem("cropai_token");
    navigate("/login");
  };

  const navLinks = [
    { to: "/detect",    label: t("detect")    },
    { to: "/soil-test", label: t("soilTest")  },
    { to: "/schemes",   label: t("schemes")   },
    { to: "/dashboard", label: t("dashboard") },
    { to: "/forum",     label: t("forum")     },
    { to: "/chatbot",   label: t("aiChat")    },
    { to: "/GeoLocation",label: t("geoLocation") },
  ];

  return (
    <nav style={S.nav}>
      {/* Logo */}
      <Link to="/" style={S.brand}>
        🌿 {t("title")}
      </Link>

      {/* Desktop menu */}
      <div style={S.menuDesktop}>
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} style={S.link}>
            {link.label}
          </Link>
        ))}

        {/* Auth buttons */}
        {user ? (
          <>
            <span style={S.userBadge}>
              {user.name?.charAt(0).toUpperCase()}
            </span>
            <button style={S.logoutBtn} onClick={handleLogout}>
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login"  style={S.loginBtn}>{t("login")}</Link>
            <Link to="/signup" style={S.signupBtn}>{t("signup")}</Link>
          </>
        )}

        {/* Language selector */}
        <LanguageSelector />
      </div>

      {/* Mobile hamburger */}
      <button style={S.hamburger} onClick={() => setMenuOpen((p) => !p)}>
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={S.menuMobile}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={S.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: 12 }}>
            <LanguageSelector />
          </div>
          {user ? (
            <button style={{ ...S.logoutBtn, marginTop: 10 }} onClick={handleLogout}>
              {t("logout")}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Link to="/login"  style={S.loginBtn}  onClick={() => setMenuOpen(false)}>{t("login")}</Link>
              <Link to="/signup" style={S.signupBtn} onClick={() => setMenuOpen(false)}>{t("signup")}</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

const S = {
  nav: {
    width: "100%",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 900,
    background: "rgba(7,26,16,0.92)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(74,222,128,0.15)",
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    fontFamily: "'DM Sans', sans-serif",
  },
  brand: {
    fontSize: 20,
    fontWeight: 800,
    color: "#4ade80",
    textDecoration: "none",
    letterSpacing: 0.5,
    fontFamily: "'Syne', sans-serif",
  },
  menuDesktop: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    "@media (max-width: 768px)": { display: "none" },
  },
  link: {
    color: "rgba(255,255,255,0.75)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "color 0.2s",
  },
  userBadge: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#16a34a,#4ade80)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginBtn: {
    background: "rgba(74,222,128,0.1)",
    border: "1px solid rgba(74,222,128,0.3)",
    borderRadius: 10,
    color: "#4ade80",
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  signupBtn: {
    background: "linear-gradient(135deg,#16a34a,#4ade80)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  logoutBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10,
    color: "#fca5a5",
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  hamburger: {
    display: "none",
    background: "none",
    border: "none",
    color: "#4ade80",
    fontSize: 22,
    cursor: "pointer",
    "@media (max-width: 768px)": { display: "block" },
  },
  menuMobile: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "rgba(7,26,16,0.98)",
    borderBottom: "1px solid rgba(74,222,128,0.15)",
    padding: "16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  mobileLink: {
    color: "rgba(255,255,255,0.75)",
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 500,
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
};
