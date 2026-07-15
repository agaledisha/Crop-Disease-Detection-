import React, { useState } from "react";
import { uploadLeafImage } from "../api/diseaseApi";

export default function UploadLeaf() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Please choose an image");

    const res = await uploadLeafImage(file);

    setResult(res);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-green-900 text-white p-6">
      <div className="bg-green-800 p-6 rounded-xl shadow-xl w-full max-w-md">

        <h2 className="text-2xl font-bold mb-4">Upload Leaf Image</h2>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4"
        />

        <button
          onClick={handleUpload}
          className="bg-yellow-400 text-black px-4 py-2 rounded font-bold"
        >
          Detect Disease
        </button>

        {result && (
          <div className="mt-4 p-4 bg-green-700 rounded">
            <p><b>Disease:</b> {result.prediction_label}</p>
            <p><b>Confidence:</b> {result.confidence}</p>
          </div>
        )}
      </div>
    </div>
  );
}
