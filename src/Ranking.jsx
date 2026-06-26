import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getJson } from "./api";
import { Center, FONT, formatDuration } from "./ui";

const PRIMARY = "#6244ff";
const PRIMARY_DARK = "#4326d6";

// 등수 표시(1~3등은 메달)
const rankLabel = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank);

// 랭킹 한 줄
function Row({ rank, nickname, elapsed_seconds, isMe }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, marginTop: 8, background: isMe ? "#f1eeff" : "#fff", border: `2px solid ${isMe ? PRIMARY : "#f0edfa"}` }}>
      <div style={{ width: 30, textAlign: "center", fontSize: rank <= 3 ? 19 : 15, fontWeight: 900, color: "#6244ff", fontVariantNumeric: "tabular-nums" }}>{rankLabel(rank)}</div>
      <div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: "#241c4d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {nickname || "익명"}
        {isMe && <span style={{ marginLeft: 7, fontSize: 11, fontWeight: 900, color: "#fff", background: PRIMARY, borderRadius: 8, padding: "2px 7px" }}>나</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, color: "#6244ff", fontVariantNumeric: "tabular-nums" }}>{formatDuration(elapsed_seconds)}</div>
    </div>
  );
}

// 내 등수 강조 카드 (상단 고정)
function MyCard({ me }) {
  return (
    <div style={{ background: PRIMARY, color: "#fff", borderRadius: 18, padding: "16px 18px", marginBottom: 18, boxShadow: `0 6px 0 ${PRIMARY_DARK}` }}>
      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>내 등수</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 6 }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em" }}>{me.rank}등</div>
        <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.nickname || "익명"}</div>
        <div style={{ marginLeft: "auto", fontSize: 15, fontWeight: 900, fontVariantNumeric: "tabular-nums", flex: "none" }}>{formatDuration(me.elapsed_seconds)}</div>
      </div>
    </div>
  );
}

/**
 * 오늘의 속도 랭킹 Top 100 + 내 등수.
 * GET /rankings/today?token=...  →  { top: [...], me: {...}|null }
 */
export default function Ranking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return setError("유효하지 않은 링크예요.");
    getJson("/rankings/today", token)
      .then(({ ok, status, data }) => {
        if (!ok) throw new Error(`HTTP ${status}`);
        setData(data);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) return <Center>랭킹을 불러오지 못했어요 — {error}</Center>;
  if (!data) return <Center>랭킹을 불러오는 중…</Center>;

  const top = data.top || [];
  const me = data.me;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f0ff", fontFamily: FONT, color: "#241c4d", padding: "22px 16px 40px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, flex: "none", borderRadius: 12, border: "none", background: "#fff", boxShadow: "0 3px 0 #e3def7", color: "#6244ff", fontSize: 20, fontWeight: 900, cursor: "pointer", lineHeight: 1 }}>‹</button>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>🏆 오늘의 속도 랭킹</div>
        </div>
        <div style={{ fontSize: 13, color: "#8d87a8", fontWeight: 600, margin: "6px 0 18px 44px" }}>필사를 빨리 끝낸 순 · Top 100</div>

        {/* 내 등수 */}
        {me ? (
          <MyCard me={me} />
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 18, fontSize: 13.5, color: "#6b6589", fontWeight: 700, textAlign: "center", boxShadow: "0 4px 0 #e3def7" }}>
            오늘 필사를 완료하면 랭킹에 올라요!
          </div>
        )}

        {/* Top 100 */}
        {top.length === 0 ? (
          <div style={{ textAlign: "center", color: "#a99ff0", fontWeight: 700, padding: "30px 0", fontSize: 14 }}>아직 완료한 사람이 없어요. 1등을 노려보세요! 🔥</div>
        ) : (
          top.map((r) => (
            <Row key={r.rank} rank={r.rank} nickname={r.nickname} elapsed_seconds={r.elapsed_seconds} isMe={r.is_me} />
          ))
        )}
      </div>
    </div>
  );
}
