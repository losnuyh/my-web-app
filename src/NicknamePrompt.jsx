import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJson, postJson } from "./api";

const PRIMARY = "#6244ff";
const PRIMARY_DARK = "#4326d6";

/**
 * 완료/재접근 화면에 들어가는 닉네임 블록.
 *  - GET /nickname 으로 현재 닉네임 확인
 *  - 닉네임 없음 → 입력란 + "랭킹 top 100 보러가기"(저장 후 랭킹 이동)
 *  - 닉네임 있음 → 바로 "랭킹 top 100 보러가기" 버튼
 *  - 비구독자(404)/토큰오류(403) → 아무것도 안 보임
 */
export default function NicknamePrompt({ token }) {
  const navigate = useNavigate();
  const [nick, setNick] = useState(undefined); // undefined=로딩, null=미설정, string=설정됨
  const [hidden, setHidden] = useState(false); // 비구독자/토큰오류 → 표시 안 함
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) return setHidden(true);
    getJson("/nickname", token)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(); // 404/403 → 숨김
        setNick(data.nickname ?? null);
      })
      .catch(() => setHidden(true));
  }, [token]);

  const goRanking = () => navigate("/ranking"); // 토큰은 sessionStorage 에 있음

  const save = async () => {
    const nickname = value.trim();
    if (nickname.length < 2 || nickname.length > 10) {
      setErr("닉네임은 2~10글자로 입력해 주세요.");
      return;
    }
    setSaving(true);
    setErr("");
    const { status, ok } = await postJson("/nickname", token, { nickname });
    if (status === 422) {
      setErr("닉네임은 2~10글자로 입력해 주세요.");
      setSaving(false);
      return;
    }
    if (status === 401 || status === 403) {
      setErr("링크가 만료됐어요. 알림톡에서 새 링크로 다시 들어와 주세요.");
      setSaving(false);
      return;
    }
    if (!ok) {
      setErr("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
      return;
    }
    goRanking();
  };

  if (hidden || nick === undefined) return null;

  const button = (label, onClick, disabled) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", height: 52, marginTop: 14, border: "none", borderRadius: 14,
        fontFamily: "inherit", fontSize: 15, fontWeight: 900,
        background: disabled ? "#e0daf5" : PRIMARY, color: disabled ? "#b3abd6" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : `0 5px 0 ${PRIMARY_DARK}`,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 320, margin: "18px auto 0" }}>
      {nick ? (
        // 이미 닉네임 있음 → 바로 랭킹 보기
        button("🏆 랭킹 top 100 보러가기", goRanking, false)
      ) : (
        // 미설정 → 입력 + 저장 후 랭킹
        <>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#6b6589", marginBottom: 8, textAlign: "center" }}>
            닉네임을 정하고 랭킹에 참여해 보세요!
          </div>
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); setErr(""); }}
            maxLength={10}
            placeholder="닉네임 (2~10글자)"
            style={{
              width: "100%", height: 50, boxSizing: "border-box", padding: "0 14px",
              border: `2px solid ${err ? "#ff5f4c" : "#ece9f8"}`, borderRadius: 13, background: "#faf9ff",
              fontFamily: "inherit", fontSize: 16, fontWeight: 800, color: "#241c4d", outline: "none", textAlign: "center",
            }}
          />
          {err && <div style={{ fontSize: 12, color: "#ff5f4c", fontWeight: 700, marginTop: 7, textAlign: "center" }}>{err}</div>}
          {button("🏆 랭킹 top 100 보러가기", save, saving)}
        </>
      )}
    </div>
  );
}
