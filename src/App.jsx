import React, { useEffect, useState } from "react";
import FilsaScreen from "./FilsaScreen";

// API 주소. 로컬은 .env.development, 배포는 CI의 VITE_API_BASE 로 주입된다.
const API_BASE = import.meta.env.VITE_API_BASE;

// 구독자 id 는 링크의 쿼리스트링(?user_id=...)으로 전달된다.
// 없으면 비구독자로 취급(말씀만 표시, 시작/완료 기록 없음).
const USER_ID = new URLSearchParams(window.location.search).get("user_id");

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
    // 오늘의 말씀 열기(= 필사 시작). GET → POST 로 변경되었고,
    // 파라미터는 쿼리스트링이 아닌 JSON 바디로 보낸다.
    // user_id 가 없으면 빈 바디 {} 를 보낸다(없이 보내면 422).
    fetch(`${API_BASE}/passages/today`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(USER_ID ? { user_id: USER_ID } : {}),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setPassage)
      .catch((e) => setError(e.message));
  }, []);

  // 필사 완료. 100% 일치 시 서버에 완료를 기록한다.
  // text 는 사용자가 필사한 텍스트(필수), user_id 는 선택.
  const handleComplete = (text) => {
    fetch(`${API_BASE}/passages/today/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(USER_ID ? { user_id: USER_ID, text } : { text }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        // 불일치 → 400 { detail: "..." }
        if (r.status === 400) {
          throw new Error(
            data.detail || "필사한 텍스트가 오늘의 말씀과 일치하지 않습니다."
          );
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        // 200 { completed: true } 일치/이미 완료, { completed: false } 미기록(비구독자 등)
        return data;
      })
      .catch((e) => {
        // 화면 완료 UX 는 로컬 채점으로 이미 표시됨. 기록 실패는 로깅만.
        console.error("필사 완료 기록 실패:", e.message);
      });
  };

  if (error) return <Center>오늘의 구절을 불러오지 못했어요 — {error}</Center>;
  if (!passage) return <Center>오늘의 말씀을 불러오는 중…</Center>;

  return (
    <FilsaScreen
      verseText={passage.text}
      reference={passage.reference}
      dateLabel={formatDate(passage.date)}
      onComplete={handleComplete}
    />
  );
}
