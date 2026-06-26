import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJson } from "./api";
import { useToken } from "./token";
import { Center, FONT, formatDuration, LinkError } from "./ui";

const PRIMARY = "#6244ff";
const PRIMARY_DARK = "#4326d6";

// 완료 시각(UTC ISO) → "오후 3:24" (한국 시각)
function formatClock(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "numeric", minute: "2-digit" });
}

const TABS = [
  { key: "speed", label: "⚡ 빠른 순", listKey: "by_speed", rankKey: "speed_rank", suffix: "등" },
  { key: "submit", label: "🏅 먼저 낸 순", listKey: "by_submit", rankKey: "submit_rank", suffix: "등" },
];

// 탭별 주/보조 표시값 (속도=걸린시간 / 제출=완료시각이 핵심)
const primaryText = (e, key) => (key === "speed" ? formatDuration(e.elapsed_seconds) : formatClock(e.completed_at));
const secondaryText = (e, key) =>
  key === "speed"
    ? (e.completed_at ? `${formatClock(e.completed_at)} 완료` : "")
    : (e.elapsed_seconds != null ? `${formatDuration(e.elapsed_seconds)} 걸림` : "");

const nick = (n) => n || "익명";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const PODIUM = {
  1: { bg: "#ffe07a", shadow: "#ecbe24", h: 92 },
  2: { bg: "#dfe7ef", shadow: "#bcc6d6", h: 70 },
  3: { bg: "#ffd0a6", shadow: "#e7ab74", h: 54 },
};

function PodiumCol({ entry, place, metric }) {
  if (!entry) return <div style={{ flex: 1 }} />;
  const cfg = PODIUM[place];
  const me = entry.is_me;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
      <div style={{ fontSize: place === 1 ? 38 : 30, lineHeight: 1 }}>{MEDAL[place]}</div>
      <div style={{ marginTop: 8, maxWidth: "100%", fontSize: 13.5, fontWeight: 900, color: "#241c4d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 2px" }}>{nick(entry.nickname)}</div>
      {me && <div style={{ marginTop: 3, fontSize: 10, fontWeight: 900, color: "#fff", background: PRIMARY, borderRadius: 7, padding: "1px 6px" }}>나</div>}
      <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 900, color: PRIMARY, fontVariantNumeric: "tabular-nums" }}>{primaryText(entry, metric)}</div>
      <div style={{ width: "100%", height: cfg.h, marginTop: 8, background: cfg.bg, borderRadius: "14px 14px 0 0", boxShadow: `inset 0 -6px 0 ${cfg.shadow}`, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 8, boxSizing: "border-box", border: me ? `2.5px solid ${PRIMARY}` : "none" }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.12)" }}>{place}</span>
      </div>
    </div>
  );
}

function Row({ entry, metric }) {
  const me = entry.is_me;
  const sub = secondaryText(entry, metric);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 14, marginTop: 8, background: me ? "#f1eeff" : "#fff", border: `2px solid ${me ? PRIMARY : "#f0edfa"}`, boxShadow: me ? "none" : "0 3px 0 #efe9fb" }}>
      <div style={{ width: 28, textAlign: "center", fontSize: 15, fontWeight: 900, color: "#8d87a8", fontVariantNumeric: "tabular-nums" }}>{entry.rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#241c4d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {nick(entry.nickname)}
          {me && <span style={{ marginLeft: 7, fontSize: 11, fontWeight: 900, color: "#fff", background: PRIMARY, borderRadius: 8, padding: "2px 7px" }}>나</span>}
        </div>
        {sub && <div style={{ fontSize: 11, color: "#b3abd6", fontWeight: 600, marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, color: PRIMARY, fontVariantNumeric: "tabular-nums", flex: "none" }}>{primaryText(entry, metric)}</div>
    </div>
  );
}

// 내 기록 카드 — 활성 탭 등수를 크게, 나머지 등수와 평균 비교를 보조로.
function MeCard({ me, tab, average }) {
  const rank = me[tab.rankKey];
  const diff = average != null && me.elapsed_seconds != null ? average - me.elapsed_seconds : null;
  const cmp =
    diff == null ? null
    : diff >= 0 ? `평균보다 ${formatDuration(diff)} 빠름 🔥`
    : `평균보다 ${formatDuration(-diff)} 느림`;
  return (
    <div style={{ background: PRIMARY, color: "#fff", borderRadius: 18, padding: "15px 18px", margin: "16px 0", boxShadow: `0 6px 0 ${PRIMARY_DARK}` }}>
      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>내 기록</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 5 }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em" }}>{rank}{tab.suffix}</div>
        <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.9, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nick(me.nickname)}</div>
        <div style={{ marginLeft: "auto", fontSize: 16, fontWeight: 900, fontVariantNumeric: "tabular-nums", flex: "none" }}>{formatDuration(me.elapsed_seconds)}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.92, marginTop: 8 }}>
        ⚡ 속도 {me.speed_rank}등 · 🏅 제출 {me.submit_rank}등{cmp ? ` · ${cmp}` : ""}
      </div>
    </div>
  );
}

/**
 * 오늘의 랭킹 — 빠른 순 / 먼저 낸 순 + 내 등수.
 * GET /rankings/today (토큰은 Authorization 헤더)
 *   → { date, reference, total, average_elapsed_seconds, by_speed[], by_submit[], me|null }
 */
export default function Ranking() {
  const navigate = useNavigate();
  const token = useToken();

  const [data, setData] = useState(null);
  const [linkCode, setLinkCode] = useState(null);
  const [error, setError] = useState(null);
  const [tabKey, setTabKey] = useState("speed");

  useEffect(() => {
    if (!token) return setLinkCode("invalid_token");
    getJson("/rankings/today", token)
      .then(({ ok, status, data }) => {
        if (status === 401 || status === 403) return setLinkCode(data?.detail?.code || "invalid_token");
        if (!ok) throw new Error(`HTTP ${status}`);
        setData(data);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  if (linkCode) return <LinkError code={linkCode} />;
  if (error) return <Center>랭킹을 불러오지 못했어요 — {error}</Center>;
  if (!data) return <Center>랭킹을 불러오는 중…</Center>;

  const tab = TABS.find((t) => t.key === tabKey);
  const list = data[tab.listKey] || [];
  const me = data.me;
  const hasPodium = list.length >= 3;
  const listRows = hasPodium ? list.slice(3) : list;

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh", background: "#f3f0ff", fontFamily: FONT, color: "#241c4d" }}>
      <div style={{ position: "absolute", top: -70, right: -40, width: 240, height: 240, borderRadius: "50%", background: "#ffe07a", opacity: 0.4 }} />
      <div style={{ position: "absolute", top: 220, left: -60, width: 200, height: 200, borderRadius: "50%", background: "#9d8bff", opacity: 0.25 }} />

      <div style={{ position: "relative", maxWidth: 460, margin: "0 auto", padding: "22px 16px 40px" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, flex: "none", borderRadius: 12, border: "none", background: "#fff", boxShadow: "0 3px 0 #e3def7", color: PRIMARY, fontSize: 20, fontWeight: 900, cursor: "pointer", lineHeight: 1 }}>‹</button>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>🏆 오늘의 랭킹</div>
        </div>
        <div style={{ fontSize: 13, color: "#8d87a8", fontWeight: 600, margin: "6px 0 16px 44px" }}>
          {data.reference ? `${data.reference} · ` : ""}총 {data.total ?? 0}명 참여
          {data.average_elapsed_seconds != null ? ` · 평균 ${formatDuration(data.average_elapsed_seconds)}` : ""}
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          {TABS.map((t) => {
            const active = t.key === tabKey;
            return (
              <button key={t.key} onClick={() => setTabKey(t.key)} style={{ flex: 1, height: 44, borderRadius: 13, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 900, cursor: "pointer", background: active ? PRIMARY : "#fff", color: active ? "#fff" : "#8d87a8", boxShadow: active ? `0 4px 0 ${PRIMARY_DARK}` : "0 3px 0 #e3def7" }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 내 기록 */}
        {me ? (
          <MeCard me={me} tab={tab} average={data.average_elapsed_seconds} />
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", margin: "16px 0", fontSize: 13.5, color: "#6b6589", fontWeight: 700, textAlign: "center", boxShadow: "0 4px 0 #e3def7" }}>
            오늘 필사를 완료하면 랭킹에 올라요! 🔥
          </div>
        )}

        {/* Top 3 시상대 */}
        {hasPodium && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
            <PodiumCol entry={list[1]} place={2} metric={tab.key} />
            <PodiumCol entry={list[0]} place={1} metric={tab.key} />
            <PodiumCol entry={list[2]} place={3} metric={tab.key} />
          </div>
        )}

        {/* 4등 이하 */}
        {list.length === 0 ? (
          <div style={{ textAlign: "center", color: "#a99ff0", fontWeight: 700, padding: "20px 0", fontSize: 14 }}>아직 완료한 사람이 없어요. 1등을 노려보세요! 🔥</div>
        ) : (
          listRows.map((e) => <Row key={e.rank} entry={e} metric={tab.key} />)
        )}
      </div>
    </div>
  );
}
