import React from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Bot, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: <Camera size={40} />,
      title: t("clickPic"),
      desc: t("clickPicDesc"),
      route: "/click-photo",   // <-- FIXED CAMERA ROUTE
    },
    {
      icon: <Upload size={40} />,
      title: t("uploadLeaf"),
      desc: t("uploadLeafDesc"),
      route: "/detect",
    },
    {
      icon: <Bot size={40} />,
      title: t("chatbot"),
      desc: t("chatbotDesc"),
      route: "/chatbot",
    },
    {
      icon: <Users size={40} />,
      title: t("forum"),
      desc: t("forumDesc"),
      route: "/forum",
    },
  ];

  return (
    <div className="min-h-screen">

      {/* 🔥 Hero Section with Image Background */}
      <div
        className="h-[60vh] w-full bg-cover bg-center flex flex-col items-center justify-center text-white shadow-xl"
        style={{ backgroundImage: "url('/images/farm.jpg')" }}
      >
        <div className="bg-black/40 w-full h-full flex flex-col items-center justify-center px-4">
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg text-yellow-300">
            {t("title")}
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl text-center">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* 🌾 Feature Section */}
      <div className="px-6 py-16 bg-green-900 text-white">
        <h2 className="text-center text-3xl font-bold mb-10 text-yellow-300">
          {t("AI Tools for Smarter Agriculture") || "AI Tools for Smarter Agriculture"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((f, index) => (
            <div
              key={index}
              onClick={() => navigate(f.route)}
              className="bg-green-800/60 border border-green-700 rounded-2xl p-6 shadow-xl 
                         flex flex-col items-center text-center gap-6 cursor-pointer 
                         transition hover:scale-105 hover:border-yellow-300"
            >
              <div className="p-4 bg-green-700/70 rounded-full text-yellow-300">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold">{f.title}</h3>
              <p className="text-green-200 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    
  );
}
