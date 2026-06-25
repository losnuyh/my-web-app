import React, { useEffect, useMemo, useState } from "react";

export const FONT = "Pretendard, 'Apple SD Gothic Neo', sans-serif";

// 경과 초 → "M:SS" (1시간 넘으면 "H:MM:SS")
function formatElapsed(totalSec) {
  const pad = (n) => String(n).padStart(2, "0");
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// started_at(ISO) 부터 지금까지 경과 시간을 매초 갱신해 보여주는 타이머.
// running=false 면 갱신을 멈춰 그 시점 기록으로 고정한다(완료 시).
export function Timer({ startedAt, running = true }) {
  const startMs = useMemo(() => {
    const t = new Date(startedAt).getTime();
    return Number.isNaN(t) ? null : t;
  }, [startedAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running || startMs === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running, startMs]);

  if (startMs === null) return null;
  const sec = Math.max(0, Math.floor((now - startMs) / 1000));
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flex: "none", background: "#f1eeff", color: "#6244ff", borderRadius: 20, padding: "5px 11px", fontSize: 12.5, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
      ⏱ {formatElapsed(sec)}
    </span>
  );
}

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

// 초 → "1분 35초" (1분 미만이면 "35초")
function formatDuration(totalSec) {
  if (totalSec == null) return "";
  const s = Math.round(totalSec);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}분 ${s % 60}초` : `${s}초`;
}

// 등수 보드 — 서버 응답(data)의 speed_rank / submit_rank / elapsed_seconds 를 표시.
// 값이 없는 항목은 자동 생략, 셋 다 없으면 아무것도 안 그린다.
export function RankBoard({ data, style }) {
  if (!data) return null;
  const stats = [
    data.speed_rank != null && { icon: "⚡", label: "속도 등수", value: `${data.speed_rank}등` },
    data.submit_rank != null && { icon: "🏅", label: "제출 순번", value: `${data.submit_rank}번째` },
    data.elapsed_seconds != null && { icon: "⏱", label: "걸린 시간", value: formatDuration(data.elapsed_seconds) },
  ].filter(Boolean);
  if (stats.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, ...style }}>
      {stats.map((s) => (
        <div key={s.label} style={{ flex: 1, background: "#f6f4ff", borderRadius: 14, padding: "13px 6px" }}>
          <div style={{ fontSize: 18 }}>{s.icon}</div>
          <div style={{ fontSize: 11, color: "#8d87a8", fontWeight: 700, marginTop: 5 }}>{s.label}</div>
          <div style={{ fontSize: 15, color: "#6244ff", fontWeight: 900, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// 오늘 필사를 이미 마친 구독자에게 보여주는 화면.
// data = 서버의 already_completed 응답 { completed_at, submit_rank, speed_rank, elapsed_seconds }
export function AlreadyDone({ data }) {
  const when = formatCompletedAt(data?.completed_at);
  return (
    <div style={{ minHeight: "100vh", background: "#f3f0ff", fontFamily: FONT, color: "#241c4d", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 28, boxShadow: "0 12px 0 #e3def7, 0 28px 50px rgba(60,40,160,0.14)", padding: "40px 28px", textAlign: "center", boxSizing: "border-box" }}>
        <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#e6faf2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto" }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 20, letterSpacing: "-0.03em" }}>오늘은 이미 완료했어요 🙌</div>
        <div style={{ fontSize: 14, color: "#6b6589", marginTop: 10, lineHeight: 1.65, fontWeight: 500, wordBreak: "keep-all" }}>
          오늘의 필사를 이미 마쳤어요.<br />내일 새로운 말씀으로 만나요!
        </div>
        <RankBoard data={data} style={{ marginTop: 22 }} />
        {when && (
          <div style={{ marginTop: 14, fontSize: 12.5, color: "#a99ff0", fontWeight: 700 }}>
            완료 시각 · {when}
          </div>
        )}
      </div>
    </div>
  );
}
