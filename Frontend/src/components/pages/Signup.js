import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ 1. password match check
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 800));

      // ✅ 2. Save FULL user data (IMPORTANT FIX)
      const userData = { name, email, password };

      localStorage.setItem("cropai_user", JSON.stringify(userData));

      // ✅ 3. direct login after signup
      navigate("/");
    } catch {
      setError("Registration failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div style={styles.root}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.grid} />

      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>🌿</div>
          <div>
            <div style={styles.logoTitle}>CropAI</div>
            <div style={styles.logoSub}>Create your account</div>
          </div>
        </div>

        <h2 style={styles.heading}>Join CropAI</h2>
        <p style={styles.subheading}>Start detecting crop diseases with AI</p>

        <form onSubmit={handleSignup} style={styles.form}>

          {/* Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rajesh Patil"
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                style={styles.input}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                required
                style={styles.input}
              />
            </div>
          </div>

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account..." : "🚀 Create Account"}
          </button>
        </form>

        {/* ✅ Back to login (NEW but small change) */}
        <div style={styles.footer}>
          Already have an account?{" "}
          <a href="/login" style={styles.link}>Sign In</a>
        </div>
      </div>
    </div>
  );
}
const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0a1a0f 0%, #0d2b1a 40%, #071a10 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
    padding: "20px",
  },
  blob1: {
    position: "absolute",
    width: 500,
    height: 500,
    background: "radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 70%)",
    borderRadius: "50%",
    top: "-120px",
    left: "-100px",
  },
  blob2: {
    position: "absolute",
    width: 350,
    height: 350,
    background: "radial-gradient(circle, rgba(234,179,8,0.09) 0%, transparent 70%)",
    borderRadius: "50%",
    bottom: "-60px",
    right: "-60px",
  },
  grid: {
    position: "absolute",
    inset: 0,
  },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(10,30,15,0.75)",
    borderRadius: "24px",
    padding: "44px 40px",
    width: "100%",
    maxWidth: "440px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  logoIcon: { fontSize: 34 },
  logoTitle: { fontSize: 20, color: "#4ade80" },
  logoSub: { fontSize: 12 },
  heading: { fontSize: 26, color: "#fff" },
  subheading: { fontSize: 14, color: "#aaa" },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 13 },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: 14 },
  input: {
  width: "100%",
  padding: "12px 14px 12px 42px",
  borderRadius: 12,
  color: "#000",
  background: "#fff",
  },
  errorBox: {
    padding: "10px",
    color: "red",
  },
  submitBtn: {
    padding: "14px",
    borderRadius: 12,
    background: "#16a34a",
    color: "#fff",
  },
  footer: {
    marginTop: 22,
    textAlign: "center",
  },
  link: {
    color: "#4ade80",
  },
};