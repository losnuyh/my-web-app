import React, { useState } from "react";
import { postJson } from "./api";

const FONT = "Pretendard, 'Apple SD Gothic Neo', sans-serif";
const PRIMARY = "#6244ff";
const CORAL = "#ff5f4c";
const CORAL_DARK = "#d94432";

/**
 * 구독 취소(탈퇴) — 필사 화면 하단의 작은 링크.
 * 누르면 경고 모달 → POST /unsubscribe (토큰 헤더, body 없음).
 *  - 200 → 완료 안내
 *  - 404 이미 탈퇴 / 401 만료 / 그 외 오류 별도 안내
 */
export default function Unsubscribe({ token }) {
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // "ok" | "gone" | "expired" | "error"

  const submit = async () => {
    setBusy(true);
    const { status, ok } = await postJson("/unsubscribe", token);
    setBusy(false);
    setDone(ok ? "ok" : status === 404 ? "gone" : status === 401 ? "expired" : "error");
  };

  // 결과 전체화면
  if (done) {
    const m = {
      ok: { icon: "👋", title: "구독이 취소됐어요", desc: "그동안 함께해 주셔서 감사했어요.\n이제 매일 말씀 알림톡을 보내지 않아요." },
      gone: { icon: "✅", title: "이미 구독 취소 상태예요", desc: "받고 있는 알림톡이 없어요." },
      expired: { icon: "⏰", title: "링크가 만료됐어요", desc: "알림톡에서 새 링크로 다시 들어와 주세요." },
      error: { icon: "😢", title: "취소에 실패했어요", desc: "잠시 후 다시 시도해 주세요." },
    }[done];
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#f3f0ff", fontFamily: FONT, color: "#241c4d", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 28, boxShadow: "0 12px 0 #e3def7, 0 28px 50px rgba(60,40,160,0.14)", padding: "40px 28px", textAlign: "center", boxSizing: "border-box" }}>
          <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#f3f1fb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto" }}>{m.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 20, letterSpacing: "-0.03em" }}>{m.title}</div>
          <div style={{ fontSize: 14, color: "#6b6589", marginTop: 10, lineHeight: 1.65, fontWeight: 500, whiteSpace: "pre-line", wordBreak: "keep-all" }}>{m.desc}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 작은 링크 — 기존 레이아웃 안 해치게 */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button onClick={() => setModal(true)} style={{ background: "none", border: "none", padding: 4, fontFamily: "inherit", fontSize: 12, color: "#b3abd6", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
          구독 취소
        </button>
      </div>

      {/* 경고 모달 */}
      {modal && (
        <div onClick={() => !busy && setModal(false)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(36,28,77,0.42)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 24, boxShadow: "0 24px 60px rgba(36,28,77,0.3)", padding: "24px 22px", boxSizing: "border-box", textAlign: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", color: "#241c4d" }}>정말 구독을 취소할까요?</div>
            <div style={{ marginTop: 14, background: "#fff7ec", border: "2px solid #ffe2b8", borderRadius: 14, padding: "14px 15px", textAlign: "left" }}>
              <div style={{ fontSize: 13, color: "#a9711f", fontWeight: 700, lineHeight: 1.75, wordBreak: "keep-all" }}>
                · 더 이상 매일 말씀 알림톡을 받지 않아요.<br />
                · <b style={{ color: "#8a5a12" }}>지금까지의 필사 기록은 연동되지 않고 사라져요.</b> 다시 시작하면 새 계정으로 처음부터예요(복구 아님).<br />
                · 오늘 이미 오른 랭킹엔 잠깐 남을 수 있어요(다음 날부터 사라짐).
              </div>
            </div>
            <button onClick={submit} disabled={busy} style={{ width: "100%", height: 52, marginTop: 18, border: "none", borderRadius: 14, fontFamily: "inherit", fontSize: 15, fontWeight: 900, background: busy ? "#f0b8b1" : CORAL, color: "#fff", cursor: busy ? "default" : "pointer", boxShadow: busy ? "none" : `0 5px 0 ${CORAL_DARK}` }}>
              {busy ? "처리 중…" : "구독 취소하기"}
            </button>
            <button onClick={() => setModal(false)} disabled={busy} style={{ width: "100%", marginTop: 10, background: "none", border: "none", padding: 8, fontFamily: "inherit", fontSize: 14, fontWeight: 800, color: PRIMARY, cursor: "pointer" }}>
              계속 필사할래요
            </button>
          </div>
        </div>
      )}
    </>
  );
}
