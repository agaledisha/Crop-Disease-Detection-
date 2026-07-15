// src/api/diseaseApi.js

import axios from "axios";

/* ---------------------------------------------------------
   Axios Instance
--------------------------------------------------------- */

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",   // backend URL
  timeout: 15000
});


/* ---------------------------------------------------------
   1️⃣ Crop Disease Detection
--------------------------------------------------------- */

export const uploadLeafImage = async (file, location) => {

  const formData = new FormData();
  formData.append("file", file);

  if (location) {
    formData.append("location", JSON.stringify(location));
  }

  try {

    const res = await api.post("/api/detect-disease", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    console.log("Detection Response:", res.data);

    return res.data;

  } catch (err) {

    console.error("Disease Detection Error:", err);

    if (err.response) {
      return err.response.data;
    }

    return { error: "Network error. Backend may not be running." };
  }
};


/* ---------------------------------------------------------
   2️⃣ Soil Testing Booking
--------------------------------------------------------- */

export const postSoilBooking = async (payload) => {

  try {

    const res = await api.post("/api/book-soil-test", payload);

    console.log("Soil Booking Response:", res.data);

    return res.data;

  } catch (err) {

    console.error("Soil Booking Error:", err);

    return { error: "Soil booking failed" };
  }
};


/* ---------------------------------------------------------
   3️⃣ AI Chatbot
--------------------------------------------------------- */

export const chatAI = async (query, lang = "en") => {

  try {

    const res = await api.post("/api/chat", {
      query,
      lang
    });

    return res.data;

  } catch (err) {

    console.error("Chatbot Error:", err);

    return { error: "Chatbot request failed" };
  }
};


/* ---------------------------------------------------------
   4️⃣ Government Schemes
--------------------------------------------------------- */

export const getSchemes = async (lang = "en") => {

  try {

    const res = await api.get(`/api/gov-schemes?lang=${lang}`);

    return res.data;

  } catch (err) {

    console.error("Schemes API Error:", err);

    return { error: "Unable to fetch schemes" };
  }
};


/* ---------------------------------------------------------
   5️⃣ Voice Assistant
--------------------------------------------------------- */

export const getVoiceResponse = async (text, lang = "en") => {

  try {

    const res = await api.post("/api/voice-assistant", {
      query: text,
      lang
    });

    return res.data;

  } catch (err) {

    console.error("Voice Assistant Error:", err);

    return { response: "Voice assistant server error." };
  }
};