import React from "react";
import { Routes, Route } from "react-router-dom";
import Transcription from "./Transcription";
import Ranking from "./Ranking";
import { Center } from "./ui";

// 필사 화면은 /transcription 경로에서 노출된다.
//   예: https://dev-app.play-logos.com/transcription?token={token}
export default function App() {
  return (
    <Routes>
      <Route path="/transcription" element={<Transcription />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="*" element={<Center>여기는 빈 페이지예요 🙂</Center>} />
    </Routes>
  );
}
