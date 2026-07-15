import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Demo credentials
const DEMO_USERS = [
  { email: "farmer@cropai.com", password: "farm123", name: "Rajesh Patil" },
  { email: "admin@cropai.com", password: "admin123", name: "Admin" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 900));

    // ✅ 1. Check demo users
    let user = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    // ✅ 2. Check signup user (localStorage)
    if (!user) {
      const storedUser = JSON.parse(localStorage.getItem("cropai_user"));
      if (
        storedUser &&
        storedUser.email === email &&
        storedUser.password === password
      ) {
        user = storedUser;
      }
    }

    // ✅ 3. If login success
    if (user) {
      localStorage.setItem(
        "cropai_user",
        JSON.stringify({ name: user.name, email: user.email, password: user.password })
      );
      navigate("/");
    } else {
      setError("Invalid email or password. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div style={styles.root}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />
      <div style={styles.grid} />

      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>🌿</div>
          <div>
            <div style={styles.logoTitle}>CropAI</div>
            <div style={styles.logoSub}>Smart Disease Detection</div>
          </div>
        </div>

        <h2 style={styles.heading}>Welcome Back</h2>
        <p style={styles.subheading}>Sign in to your farmer dashboard</p>

        <form onSubmit={handleLogin} style={styles.form}>
          
          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@cropai.com"
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
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* Demo hint */}
          <div style={styles.hint}>
            Demo: <strong>farmer@cropai.com</strong> / <strong>farm123</strong>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? "Signing in..." : "🚀 Sign In to Dashboard"}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          Don't have an account?{" "}
          <a href="/signup" style={styles.link}>
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
}

// 🔥 styles same ठेवले आहेत (unchanged)
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
  blob1: { position: "absolute", width: 500, height: 500, background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)", borderRadius: "50%", top: "-100px", left: "-100px" },
  blob2: { position: "absolute", width: 400, height: 400, background: "radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%)", borderRadius: "50%", bottom: "-80px", right: "-80px" },
  blob3: { position: "absolute", width: 300, height: 300, background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)", borderRadius: "50%", top: "50%", left: "60%" },
  grid: { position: "absolute", inset: 0 },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(10, 30, 15, 0.75)",
    borderRadius: "24px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "440px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px" },
  logoIcon: { fontSize: "36px" },
  logoTitle: { fontSize: "22px", color: "#4ade80" },
  logoSub: { fontSize: "12px" },
  heading: { fontSize: "28px", color: "#fff" },
  subheading: { fontSize: "14px", color: "#aaa" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "14px" },
  input: { width: "100%", padding: "13px 14px 13px 44px", borderRadius: "12px" },
  eyeBtn: { position: "absolute", right: "14px", background: "none", border: "none" },
  errorBox: { padding: "10px", color: "red" },
  hint: { fontSize: "12px" },
  submitBtn: { padding: "15px", borderRadius: "12px", background: "#16a34a", color: "#fff" },
  footer: { marginTop: "24px", textAlign: "center" },
  link: { color: "#4ade80" },
};