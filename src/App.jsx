import React, { useEffect, useState } from "react";
import FilsaScreen from "./FilsaScreen";

// API 주소. 로컬은 .env.development, 배포는 CI의 VITE_API_BASE 로 주입된다.
const API_BASE = import.meta.env.VITE_API_BASE;

const FONT = "Pretendard, 'Apple SD Gothic Neo', sans-serif";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-06-24" → "2026년 6월 24일 수요일"
function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 ${wd}요일`;
}

function Center({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f0ff", color: "#6b6589", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontWeight: 700, textAlign: "center" }}>
      {children}
    </div>
  );
}

export default function App() {
  const [passage, setPassage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/passages/today`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setPassage)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Center>오늘의 구절을 불러오지 못했어요 — {error}</Center>;
  if (!passage) return <Center>오늘의 말씀을 불러오는 중…</Center>;

  return (
    <FilsaScreen
      verseText={passage.text}
      reference={passage.reference}
      dateLabel={formatDate(passage.date)}
    />
  );
}
