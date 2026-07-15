// src/App.js  ← save as App.js (delete App.jsx and App_fixed.jsx)

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar          from "./components/Navbar";
import Home            from "./components/Home";
import DiseaseDetector from "./components/DiseaseDetector";
import ClickPic        from "./components/ClickPic";
import SoilTestBooking from "./components/SoilTestBooking";
import CommunityForum  from "./components/CommunityForum";
import Schemes         from "./components/Schemes";
import Chatbot         from "./components/Chatbot";
import GeoLocation     from "./components/GeoLocation";
import Dashboard       from "./components/Dashboard";
import Login           from "./components/pages/Login";
import Signup          from "./components/pages/Signup";

// ─── Redirect to login if not authenticated ───────────────────────────────────
function ProtectedRoute({ children }) {
  const user = localStorage.getItem("cropai_user");
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ─── Hide navbar on login/signup pages ───────────────────────────────────────
function AppShell() {
  const location = useLocation();
  const hideNav = ["/login", "/signup"].includes(location.pathname.toLowerCase());

  return (
    <>
      {!hideNav && <Navbar />}

      <Routes>
        {/* Public */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route path="/"            element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/detect"      element={<ProtectedRoute><DiseaseDetector /></ProtectedRoute>} />
        <Route path="/click-photo" element={<ProtectedRoute><ClickPic /></ProtectedRoute>} />
        <Route path="/soil-test"   element={<ProtectedRoute><SoilTestBooking /></ProtectedRoute>} />
        <Route path="/forum"       element={<ProtectedRoute><CommunityForum /></ProtectedRoute>} />
        <Route path="/schemes"     element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
        <Route path="/chatbot"     element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
        <Route path="/GeoLocation" element={<ProtectedRoute><GeoLocation /></ProtectedRoute>} />
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/Dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
