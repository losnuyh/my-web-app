import React, { useEffect, useMemo, useState } from "react";
import NicknamePrompt from "./NicknamePrompt";

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
export function formatDuration(totalSec) {
  if (totalSec == null) return "";
  const s = Math.round(totalSec);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}분 ${s % 60}초` : `${s}초`;
}

// 등수 보드 — 서버 응답(data)의 등수/시간과 전체 참가자(total)·평균을 함께 표시.
// 값이 없는 항목은 자동 생략, 셋 다 없으면 아무것도 안 그린다.
export function RankBoard({ data, style }) {
  if (!data) return null;
  const total = data.total;
  const stats = [
    data.speed_rank != null && { icon: "⚡", label: "속도 등수", value: `${data.speed_rank}등`, sub: total != null ? `${total}명 중` : null },
    data.submit_rank != null && { icon: "🏅", label: "제출 순번", value: `${data.submit_rank}번째`, sub: total != null ? `${total}명` : null },
    data.elapsed_seconds != null && { icon: "⏱", label: "걸린 시간", value: formatDuration(data.elapsed_seconds), sub: data.average_elapsed_seconds != null ? `평균 ${formatDuration(data.average_elapsed_seconds)}` : null },
  ].filter(Boolean);
  if (stats.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, ...style }}>
      {stats.map((s) => (
        <div key={s.label} style={{ flex: 1, background: "#f6f4ff", borderRadius: 14, padding: "13px 6px" }}>
          <div style={{ fontSize: 18 }}>{s.icon}</div>
          <div style={{ fontSize: 11, color: "#8d87a8", fontWeight: 700, marginTop: 5 }}>{s.label}</div>
          <div style={{ fontSize: 15, color: "#6244ff", fontWeight: 900, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          {s.sub && <div style={{ fontSize: 10.5, color: "#a99ff0", fontWeight: 700, marginTop: 2 }}>{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// 보라 배경 + 흰 카드 공용 셸 (안내 화면들이 공유)
function CardScreen({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f3f0ff", fontFamily: FONT, color: "#241c4d", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 28, boxShadow: "0 12px 0 #e3def7, 0 28px 50px rgba(60,40,160,0.14)", padding: "40px 28px", textAlign: "center", boxSizing: "border-box" }}>
        {children}
      </div>
    </div>
  );
}

// 아이콘 원 + 제목 + 부제
function NoticeHead({ icon, iconBg = "#e6faf2", title, subtitle }) {
  return (
    <>
      <div style={{ width: 84, height: 84, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto" }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 20, letterSpacing: "-0.03em" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14, color: "#6b6589", marginTop: 10, lineHeight: 1.65, fontWeight: 500, wordBreak: "keep-all" }}>{subtitle}</div>}
    </>
  );
}

// 말씀 카드 (본문 + 출처)
function VerseCard({ text, reference, label = "📖 오늘의 말씀 · 개역개정" }) {
  if (!text) return null;
  return (
    <div style={{ background: "#f6f4ff", borderRadius: 16, padding: "16px 18px", marginTop: 22, textAlign: "left" }}>
      <div style={{ fontSize: 11.5, fontWeight: 900, color: "#6244ff", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: 15, color: "#2a2550", lineHeight: 1.85, marginTop: 9, wordBreak: "keep-all", fontWeight: 600 }}>{text}</div>
      {reference && <div style={{ fontSize: 12, color: "#a99ff0", marginTop: 9, fontWeight: 700 }}>{reference}</div>}
    </div>
  );
}

// 오늘 필사를 이미 마친 구독자 화면.
// data = already_completed 응답 { completed_at, date, reference, text, +등수 }
export function AlreadyDone({ data, token }) {
  const when = formatCompletedAt(data?.completed_at);
  return (
    <CardScreen>
      <NoticeHead icon="✅" title="오늘은 이미 완료했어요 🙌" />
      <VerseCard text={data?.text} reference={data?.reference} />
      <RankBoard data={data} style={{ marginTop: 18 }} />
      {when && <div style={{ marginTop: 14, fontSize: 12.5, color: "#a99ff0", fontWeight: 700 }}>완료 시각 · {when}</div>}
      <NicknamePrompt token={token} />
    </CardScreen>
  );
}

// 지난 말씀(오늘 것이 아님) — 읽기만 가능, 필사 불가.
// data = expired 응답 { date, reference, text }
export function Expired({ data }) {
  return (
    <CardScreen>
      <NoticeHead icon="📜" iconBg="#fff7ec" title="이미 지난 말씀이에요" subtitle="오늘의 말씀만 필사할 수 있어요. 아래에서 읽어볼 수 있어요." />
      <VerseCard text={data?.text} reference={data?.reference} label="📖 그날의 말씀 · 개역개정" />
    </CardScreen>
  );
}

// 토큰 만료/위조(401) 안내.
//  - token_expired → 링크 만료(7일), 새 알림톡 유도
//  - 그 외(invalid_token 등) → 잘못된 접근
export function LinkError({ code, detail }) {
  const expired = code === "token_expired";
  return (
    <CardScreen>
      <NoticeHead
        icon={expired ? "⏰" : "🚫"}
        iconBg={expired ? "#fff7ec" : "#ffecea"}
        title={expired ? "링크가 만료됐어요" : "유효하지 않은 링크예요"}
        subtitle={
          expired
            ? <>링크는 발급 후 7일간만 열려요.<br />알림톡에서 새 링크로 다시 들어와 주세요.</>
            : <>알림톡의 버튼으로 다시 들어와 주세요.</>
        }
      />
      {detail && <div style={{ marginTop: 18, fontSize: 11, color: "#c4bfe0", fontWeight: 600 }}>{detail}</div>}
    </CardScreen>
  );
}

// 아직 공개되지 않은(미래) 말씀.
// data = not_found 응답 { date }
export function NotFound({ date }) {
  return (
    <CardScreen>
      <NoticeHead icon="🌙" iconBg="#f3f1fb" title="아직 공개 전이에요" subtitle={<>아직 공개되지 않은 말씀이에요.<br />조금만 기다려 주세요!</>} />
      {date && <div style={{ marginTop: 18, fontSize: 12.5, color: "#a99ff0", fontWeight: 700 }}>{date}</div>}
    </CardScreen>
  );
}
