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
