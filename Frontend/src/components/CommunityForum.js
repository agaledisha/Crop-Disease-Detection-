// src/components/CommunityForum.js
import React, { useEffect, useState, useCallback } from "react";

const BACKEND = "http://127.0.0.1:5000";
const PAGE_SIZE = 6;

// ── Mock posts shown when backend is offline ──────────────────────────────────
const MOCK_POSTS = [
  { id: 1, name: "Rajesh Patil", title: "Tomato leaves turning yellow", message: "My tomato plants are showing yellow patches on leaves. Is this a nutrient deficiency or disease?", likes: 12, timestamp: "2025-03-10T09:00:00" },
  { id: 2, name: "Sunita Deshmukh", title: "Best organic pesticide for cotton?", message: "Looking for effective organic alternatives to chemical pesticides for my cotton crop.", likes: 8, timestamp: "2025-03-11T11:30:00" },
  { id: 3, name: "Arjun Shinde", title: "Paddy blight — urgent help needed", message: "Noticed brownish lesions spreading rapidly on paddy leaves. Attached image for reference.", likes: 15, timestamp: "2025-03-12T07:45:00" },
  { id: 4, name: "Meena Kulkarni", title: "Soil pH correction tips", message: "My soil test shows pH 5.2. What should I add to bring it to 6.5 for groundnut farming?", likes: 6, timestamp: "2025-03-13T14:00:00" },
  { id: 5, name: "Vikram More", title: "Drip irrigation for sugarcane", message: "Planning to install drip irrigation. Any experience with water savings vs flood irrigation?", likes: 20, timestamp: "2025-03-14T08:15:00" },
  { id: 6, name: "Anita Jadhav", title: "NPK ratio for wheat — second crop", message: "What NPK ratio is recommended for the second wheat crop? First crop was rice.", likes: 9, timestamp: "2025-03-14T16:20:00" },
];

function timeAgo(ts) {
  const d = new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommunityForum() {
  const [posts, setPosts]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [skip, setSkip]         = useState(0);
  const [loading, setLoading]   = useState(true);
  const [offline, setOffline]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [submitting, setSub]    = useState(false);
  const [toast, setToast]       = useState(null);
  const [form, setForm]         = useState({ name: "", title: "", message: "" });
  const [likedPosts, setLiked]  = useState(new Set());
  const [active, setActive] = useState(null);
  const [replyForm, setReply]   = useState({ name: "", message: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPosts = useCallback(async (reset = false) => {
    setLoading(true);
    const currentSkip = reset ? 0 : skip;
    try {
      const res  = await fetch(`${BACKEND}/api/forum?limit=${PAGE_SIZE}&skip=${currentSkip}`);
      const data = await res.json();
      const newPosts = data.posts || [];
      setTotal(data.total || 0);
      setOffline(false);
      if (reset) { setPosts(newPosts); setSkip(newPosts.length); }
      else { setPosts(p => [...p, ...newPosts]); setSkip(s => s + newPosts.length); }
    } catch {
      if (reset) { setPosts(MOCK_POSTS); setTotal(MOCK_POSTS.length); setOffline(true); }
    }
    setLoading(false);
  }, [skip]);

  useEffect(() => { loadPosts(true); }, []); // eslint-disable-line

  const submitPost = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.title.trim() || !form.message.trim()) {
      showToast("Please fill all fields", "error"); return;
    }
    setSub(true);
    try {
      if (editing) {
        await fetch(`${BACKEND}/api/forum/${editing}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title, message: form.message }),
        });
        showToast("Post updated!");
        setEditing(null);
      } else {
        if (offline) {
          // Mock post for demo
          const mock = { id: Date.now(), name: form.name, title: form.title, message: form.message, likes: 0, timestamp: new Date().toISOString() };
          setPosts(p => [mock, ...p]); setTotal(t => t + 1);
          showToast("Post shared (demo mode)");
        } else {
          await fetch(`${BACKEND}/api/forum`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          showToast("Post shared with the community!");
          loadPosts(true);
        }
      }
      setForm({ name: "", title: "", message: "" });
    } catch { showToast("Failed to submit post", "error"); }
    setSub(false);
  };

  const deletePost = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await fetch(`${BACKEND}/api/forum/${id}`, { method: "DELETE" });
      setPosts(p => p.filter(x => x.id !== id));
      showToast("Post deleted");
    } catch { setPosts(p => p.filter(x => x.id !== id)); showToast("Post deleted (demo)"); }
  };

  const toggleLike = async (id) => {
    const liked = likedPosts.has(id);
    setLiked(s => { const n = new Set(s); liked ? n.delete(id) : n.add(id); return n; });
    const endpoint = liked ? "unlike" : "like";
    try {
      const res  = await fetch(`${BACKEND}/api/forum/${id}/${endpoint}`, { method: "POST" });
      const data = await res.json();
      setPosts(p => p.map(x => x.id === id ? { ...x, likes: data.likes } : x));
    } catch {
      setPosts(p => p.map(x => x.id === id ? { ...x, likes: liked ? Math.max(0, x.likes - 1) : x.likes + 1 } : x));
    }
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, title: p.title, message: p.message });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitReply = async (postId) => {
    if (!replyForm.name.trim() || !replyForm.message.trim()) { showToast("Fill reply fields", "error"); return; }
    try {
      await fetch(`${BACKEND}/api/forum/${postId}/reply`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(replyForm),
      });
      showToast("Reply added!");
    } catch { showToast("Reply added (demo)!"); }
    setReply({ name: "", message: "" });
    setActive(null);
  };

  return (
    <div style={S.page}>
      <div style={S.bg1} /><div style={S.bg2} />

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "rgba(239,68,68,0.9)" : "rgba(74,222,128,0.9)" }}>
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.pageTag}>COMMUNITY</div>
        <h1 style={S.pageTitle}>Farmer Forum</h1>
        <p style={S.pageDesc}>Share experiences, ask questions, and help fellow farmers.</p>
        {offline && (
          <div style={S.offlineBanner}>
            📡 Backend offline — showing demo posts. New posts save locally this session.
          </div>
        )}
      </div>

      <div style={S.layout}>
        {/* ── Form ── */}
        <div style={S.sidebar}>
          <div style={S.formCard}>
            <h3 style={S.formTitle}>{editing ? "✏️ Edit Post" : "📝 New Post"}</h3>
            <form onSubmit={submitPost} style={S.form}>
              {[
                { key: "name",    ph: "Your Name",     rows: 1 },
                { key: "title",   ph: "Post Title",     rows: 1 },
                { key: "message", ph: "Share your question or experience...", rows: 4 },
              ].map(f => (
                <div key={f.key} style={S.fieldGroup}>
                  {f.rows === 1 ? (
                    <input
                      value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.ph} style={S.input}
                      onFocus={e => e.target.style.borderColor = "#4ade80"}
                      onBlur={e => e.target.style.borderColor = "rgba(74,222,128,0.2)"}
                    />
                  ) : (
                    <textarea
                      value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.ph} rows={f.rows} style={{ ...S.input, resize: "vertical" }}
                      onFocus={e => e.target.style.borderColor = "#4ade80"}
                      onBlur={e => e.target.style.borderColor = "rgba(74,222,128,0.2)"}
                    />
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={submitting} style={{ ...S.btnPrimary, flex: 1 }}>
                  {submitting ? "Posting..." : editing ? "Update Post" : "Share Post"}
                </button>
                {editing && (
                  <button type="button" style={S.btnCancel}
                    onClick={() => { setEditing(null); setForm({ name: "", title: "", message: "" }); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Stats */}
          <div style={S.statsCard}>
            <div style={S.statRow}><span style={S.statNum}>{total}</span><span style={S.statLbl}>Total Posts</span></div>
            <div style={S.statDivider} />
            <div style={S.statRow}><span style={S.statNum}>{posts.reduce((s, p) => s + (p.likes || 0), 0)}</span><span style={S.statLbl}>Total Likes</span></div>
            <div style={S.statDivider} />
            <div style={S.statRow}><span style={S.statNum}>{new Set(posts.map(p => p.name)).size}</span><span style={S.statLbl}>Contributors</span></div>
          </div>
        </div>

        {/* ── Posts ── */}
        <div style={S.postsCol}>
          {loading && posts.length === 0 && (
            <div style={S.loadingState}>
              <div style={S.spinner} />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading posts...</span>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div style={S.empty}><div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>No posts yet. Be the first to share!</div>
          )}

          {posts.map(p => (
            <div key={p.id} style={S.postCard}>
              <div style={S.postHeader}>
                <div style={S.avatar}>{(p.name || "?").charAt(0).toUpperCase()}</div>
                <div>
                  <div style={S.postName}>{p.name}</div>
                  <div style={S.postTime}>{timeAgo(p.timestamp)}</div>
                </div>
                <div style={S.postActions}>
                  <button style={S.iconBtn} onClick={() => startEdit(p)}>✏️</button>
                  <button style={{ ...S.iconBtn, color: "#f87171" }} onClick={() => deletePost(p.id)}>🗑️</button>
                </div>
              </div>

              <h4 style={S.postTitle}>{p.title}</h4>
              <p style={S.postMsg}>{p.message}</p>

              <div style={S.postFooter}>
                <button
                  style={{ ...S.likeBtn, color: likedPosts.has(p.id) ? "#f87171" : "rgba(255,255,255,0.5)" }}
                  onClick={() => toggleLike(p.id)}
                >
                  {likedPosts.has(p.id) ? "❤️" : "🤍"} {p.likes || 0} Likes
                </button>
                <button style={S.replyBtn} onClick={() => setActive(active === p.id ? null : p.id)}>
                  💬 Reply
                </button>
              </div>

              {/* Reply form */}
              {active === p.id && (
                <div style={S.replyBox}>
                  <input value={replyForm.name} onChange={e => setReply({ ...replyForm, name: e.target.value })}
                    placeholder="Your name" style={S.replyInput} />
                  <textarea value={replyForm.message} onChange={e => setReply({ ...replyForm, message: e.target.value })}
                    placeholder="Write a reply..." rows={2} style={{ ...S.replyInput, resize: "none" }} />
                  <button style={S.btnPrimary} onClick={() => submitReply(p.id)}>Send Reply</button>
                </div>
              )}
            </div>
          ))}

          {posts.length < total && !loading && (
            <button style={S.loadMoreBtn} onClick={() => loadPosts(false)}>Load More Posts</button>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blob { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", padding: "88px 24px 60px", background: "linear-gradient(160deg,#071a10 0%,#0d2818 60%,#0a1a0f 100%)", fontFamily: "'DM Sans',sans-serif", color: "#fff", position: "relative", overflow: "hidden" },
  bg1: { position: "absolute", width: 500, height: 500, borderRadius: "50%", top: -100, right: -100, background: "radial-gradient(circle,rgba(74,222,128,0.08) 0%,transparent 70%)", animation: "blob 10s ease-in-out infinite", pointerEvents: "none" },
  bg2: { position: "absolute", width: 400, height: 400, borderRadius: "50%", bottom: -80, left: -80, background: "radial-gradient(circle,rgba(234,179,8,0.06) 0%,transparent 70%)", animation: "blob 13s ease-in-out infinite reverse", pointerEvents: "none" },
  toast: { position: "fixed", top: 80, right: 24, zIndex: 999, padding: "12px 20px", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, backdropFilter: "blur(10px)", animation: "slideIn 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
  pageHeader: { textAlign: "center", marginBottom: 40, position: "relative" },
  pageTag: { display: "inline-block", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: 11, fontWeight: 700, letterSpacing: 2, padding: "4px 12px", borderRadius: 20, marginBottom: 12 },
  pageTitle: { fontFamily: "'Syne',sans-serif", fontSize: "clamp(26px,4vw,42px)", fontWeight: 800, margin: "0 0 10px", background: "linear-gradient(135deg,#fff 30%,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  pageDesc: { fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 },
  offlineBanner: { margin: "16px auto 0", maxWidth: 500, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "rgba(234,179,8,0.9)" },
  layout: { display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, maxWidth: 1100, margin: "0 auto", alignItems: "start" },
  sidebar: { display: "flex", flexDirection: "column", gap: 16 },
  formCard: { background: "rgba(10,30,15,0.75)", backdropFilter: "blur(24px)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 20, padding: 24 },
  formTitle: { fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "#4ade80", margin: "0 0 18px" },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  fieldGroup: {},
  input: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", transition: "border-color 0.2s" },
  btnPrimary: { padding: "11px 18px", background: "linear-gradient(135deg,#16a34a,#4ade80)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif" },
  btnCancel: { padding: "11px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#fca5a5", fontSize: 14, cursor: "pointer" },
  statsCard: { background: "rgba(10,30,15,0.6)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-around" },
  statRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  statNum: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#4ade80" },
  statLbl: { fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 40, background: "rgba(74,222,128,0.15)" },
  postsCol: { display: "flex", flexDirection: "column", gap: 16 },
  loadingState: { display: "flex", alignItems: "center", gap: 12, padding: 32, justifyContent: "center" },
  spinner: { width: 24, height: 24, border: "2px solid rgba(74,222,128,0.2)", borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  empty: { textAlign: "center", padding: "60px 24px", color: "rgba(255,255,255,0.4)", fontSize: 15 },
  postCard: { background: "rgba(10,30,15,0.7)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 18, padding: 22, transition: "border-color 0.2s" },
  postHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: { width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 },
  postName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  postTime: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  postActions: { marginLeft: "auto", display: "flex", gap: 8 },
  iconBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 4, color: "rgba(255,255,255,0.5)" },
  postTitle: { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#4ade80", margin: "0 0 8px" },
  postMsg: { fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 16px" },
  postFooter: { display: "flex", gap: 12, paddingTop: 14, borderTop: "1px solid rgba(74,222,128,0.08)" },
  likeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "color 0.15s", padding: "4px 0" },
  replyBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600, padding: "4px 0" },
  replyBox: { marginTop: 16, padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 },
  replyInput: { padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%", boxSizing: "border-box" },
  loadMoreBtn: { width: "100%", padding: 14, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 12, color: "#4ade80", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};
