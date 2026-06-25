import React from "react";

export const FONT = "Pretendard, 'Apple SD Gothic Neo', sans-serif";

// 로딩/에러/빈 페이지 등 한 줄 안내를 가운데 정렬해 보여주는 박스.
export function Center({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f0ff", color: "#6b6589", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontWeight: 700, textAlign: "center" }}>
      {children}
    </div>
  );
}

// ISO 시각 → "2026년 6월 25일 오후 3:24" (한국 시각)
function formatCompletedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// 오늘 필사를 이미 마친 구독자에게 보여주는 화면.
export function AlreadyDone({ completedAt }) {
  const when = formatCompletedAt(completedAt);
  return (
    <div style={{ minHeight: "100vh", background: "#f3f0ff", fontFamily: FONT, color: "#241c4d", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 28, boxShadow: "0 12px 0 #e3def7, 0 28px 50px rgba(60,40,160,0.14)", padding: "40px 28px", textAlign: "center", boxSizing: "border-box" }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#e6faf2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto" }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 20, letterSpacing: "-0.03em" }}>오늘은 이미 완료했어요 🙌</div>
        <div style={{ fontSize: 14, color: "#6b6589", marginTop: 10, lineHeight: 1.65, fontWeight: 500, wordBreak: "keep-all" }}>
          오늘의 필사를 이미 마쳤어요.<br />내일 새로운 말씀으로 만나요!
        </div>
        {when && (
          <div style={{ display: "inline-block", marginTop: 22, background: "#f6f4ff", borderRadius: 14, padding: "12px 18px", fontSize: 13, color: "#6244ff", fontWeight: 800 }}>
            완료 시각 · {when}
          </div>
        )}
      </div>
    </div>
  );
}
