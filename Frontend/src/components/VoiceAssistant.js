// src/components/VoiceAssistant.js
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

// ✅ Correct API path
import { getVoiceResponse } from "../api/diseaseApi";

export default function VoiceAssistant() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";

  const [listening, setListening] = useState(false);

  const startListen = async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = lang.startsWith("mr")
      ? "mr-IN"
      : lang.startsWith("hi")
      ? "hi-IN"
      : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setListening(true);
    rec.start();

    rec.onresult = async (e) => {
      const spokenText = e.results[0][0].transcript;
      console.log("User said: ", spokenText);

      try {
        const response = await getVoiceResponse(spokenText, lang);
        const reply = response?.response || "Sorry, I didn't understand.";

        // Speak response
        const speak = new SpeechSynthesisUtterance(reply);
        speak.lang = rec.lang;
        speechSynthesis.speak(speak);
      } catch (error) {
        console.error(error);
        alert("Voice Assistant Error.");
      } finally {
        setListening(false);
      }
    };

    rec.onerror = () => setListening(false);
  };

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 999 }}>
      <button
        onClick={startListen}
        title="Voice Assistant"
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "none",
          background: listening ? "#dc2626" : "#22c55e",
          color: "#fff",
          fontSize: 28,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          cursor: "pointer",
          transition: "0.2s",
        }}
      >
        🎤
      </button>
    </div>
  );
}
