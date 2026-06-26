import React, { useState, useMemo } from "react";
import { isSpace, matchesTarget, scoreInput } from "./scoring";
import { Timer, RankBoard, FONT } from "./ui";

/**
 * 로고스(logos) — 필사 화면 (게임풍)
 *
 * 표준 React 컴포넌트. 의존성 없음(React만 필요), 인라인 스타일.
 * 매일의 성경 구절을 본문 그대로 타이핑해서 일치하면 완료됩니다.
 *
 * 채점 규칙(자세한 로직은 scoring.js):
 *  - 자모 단위 비교 — 입력이 본문 자모열의 prefix면 정답. 조합 중인 글자
 *    ("ㅎ","한", 천지인 "히"…)가 빨강으로 선판정되지 않는다.
 *  - 마지막(조합 중) 글자는 빨강 대신 '입력 중'(보라)로 표시.
 *  - 공백은 관대하게: 공백류(NBSP 등) 통일, 연속 공백 1칸, 앞뒤 trim, NFD→NFC.
 *  - 완료 판정은 정규화 후 전체 일치. 완료는 되돌릴 수 없음(입력 잠금).
 *
 * Pretendard 폰트(선택):
 *   <link rel="stylesheet"
 *     href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
 *
 * props:
 *   verseText  본문 (개역개정)         기본값 있음
 *   reference  구절 출처              예: "시편 23편 1절"
 *   dateLabel  날짜 라벨
 *   startedAt  필사 시작 시각(ISO) — 경과 타이머용. 없으면 타이머 숨김
 *   result     완료 기록 서버 응답(등수). null이면 '저장 중…' 표시
 *   onComplete 완료 시 콜백 (text: string) => void  (text = 필사한 텍스트)
 */

export default function FilsaScreen({
  verseText = "여호와는 나의 목자시니 내게 부족함이 없으리로다",
  reference = "시편 23편 1절",
  dateLabel = "2026년 6월 23일 화요일",
  startedAt,
  result,
  onComplete,
} = {}) {
  const [input, setInput] = useState("");
  const [composing, setComposing] = useState(false);
  const [done, setDone] = useState(false);

  const TARGET = verseText;

  // text: 사용자가 필사한 텍스트(서버 완료 기록에 그대로 전달)
  const finish = (text) => {
    if (!done) {
      setDone(true);
      onComplete && onComplete(text);
    }
  };

  const handleInput = (e) => {
    if (done) return;
    const isComposing = !!(e.nativeEvent && e.nativeEvent.isComposing);
    // 띄어쓰기 2개 연속 방지 — 연속된 공백은 하나로 합친다(더블스페이스 입력 차단)
    const raw = e.target.value;
    const val = raw.replace(/ {2,}/g, " ");
    // state 가 그대로면 리렌더가 생략돼 DOM 에 두 칸이 남는다 → textarea 값을 직접 맞춘다
    if (val !== raw) e.target.value = val;
    setInput(val);
    setComposing(isComposing);
    // setInput 직후라 finish 안에서 input 은 아직 옛 값 → val 을 직접 넘긴다
    if (!isComposing && matchesTarget(val, TARGET)) finish(val);
  };

  const handleCompositionEnd = () => {
    setComposing(false);
    if (!done && matchesTarget(input, TARGET)) finish(input);
  };

  // 글자 상태별 스타일. inline-block 을 주지 않아야(=일반 inline) textarea 와
  // 줄바꿈이 동일하게 정렬된다.
  const styleFor = (s) => {
    if (s === "bad") return { color: "#ff5f4c", background: "rgba(255,95,76,0.14)", borderRadius: 5 };
    if (s === "extra") return { color: "#ff5f4c", background: "rgba(255,95,76,0.22)", borderRadius: 5, textDecoration: "line-through" };
    if (s === "typing") return { color: "#6244ff", background: "rgba(98,68,255,0.12)", borderRadius: 5 };
    if (s === "pending") return { color: "#cfc8ee" };
    return { color: "#241c4d" }; // ok
  };

  const view = useMemo(() => {
    const { segs, err, firstErr } = scoreInput(TARGET, input);
    const isDone = done || (!composing && input.length > 0 && matchesTarget(input, TARGET));
    return { segs, value: input, err, firstErr, done: isDone };
  }, [input, composing, done, TARGET]);

  const hint = (() => {
    const v = view, t = TARGET;
    if (v.done) return { text: "완벽해요! 100% 일치 🎯", color: "#1fa67c", bg: "#e6faf2", icon: "✅" };
    if (v.value.length === 0) return { text: "본문을 보고 그대로 입력해 보세요", color: "#8d87a8", bg: "#f3f1fb", icon: "⌨️" };
    if (v.err === 0) return { text: "정확하게 콱콱 찍고 있어요!", color: "#1fa67c", bg: "#e6faf2", icon: "🔥" };
    if (v.firstErr >= t.length) return { text: "본문보다 길어요 — 뒤를 지워보세요", color: "#ff5f4c", bg: "#ffecea", icon: "✂️" };
    return { text: v.err + "개 글자가 본문과 달라요", color: "#ff5f4c", bg: "#ffecea", icon: "❌" };
  })();

  const border = view.done ? "#1fcb97" : view.err > 0 ? "#ff5f4c" : view.value.length ? "#6244ff" : "#ece9f8";

  const taStyle = {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%",
    padding: 16, boxSizing: "border-box", fontFamily: FONT, fontSize: 19, lineHeight: 1.95,
    letterSpacing: "-0.01em", wordBreak: "break-all", whiteSpace: "pre-wrap", border: "none",
    outline: "none", resize: "none", background: "transparent", color: "transparent",
    WebkitTextFillColor: "transparent", caretColor: "#6244ff", zIndex: 2, overflow: "hidden",
  };

  return (
    <>
      <style>{`
        @keyframes lg-fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes lg-popIn{0%{transform:scale(.4);opacity:0}55%{transform:scale(1.22)}100%{transform:scale(1);opacity:1}}
        @keyframes lg-floatY{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-12px) rotate(var(--r,0deg))}}
        .lg-ta::placeholder{color:#b8b2d6}
      `}</style>

      <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh", background: "#f3f0ff", fontFamily: FONT, color: "#241c4d", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
        {/* decorative blobs */}
        <div style={{ position: "absolute", top: -60, left: -40, width: 240, height: 240, borderRadius: "50%", background: "#ffe07a", opacity: 0.5, animation: "lg-floatY 7s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -50, right: -30, width: 220, height: 220, borderRadius: "50%", background: "#9d8bff", opacity: 0.32, animation: "lg-floatY 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: 80, right: "12%", width: 40, height: 40, borderRadius: 12, background: "#ff7a68", "--r": "18deg", animation: "lg-floatY 5.5s ease-in-out infinite" }} />

        <div style={{ position: "relative", width: "100%", maxWidth: 460, background: "#fff", borderRadius: 30, boxShadow: "0 14px 0 #e3def7, 0 30px 56px rgba(60,40,160,0.16)", padding: "26px 24px 24px", overflow: "hidden", boxSizing: "border-box" }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>오늘의 말씀 ✏️</div>
              <div style={{ fontSize: 12.5, color: "#8d87a8", marginTop: 4, fontWeight: 600 }}>{dateLabel}</div>
            </div>
            {startedAt && <Timer startedAt={startedAt} running={!view.done} />}
          </div>

          {/* verse card */}
          <div style={{ background: "#f6f4ff", borderRadius: 18, padding: "17px 18px", marginTop: 18 }}>
            <div style={{ fontSize: 11.5, fontWeight: 900, color: "#6244ff", letterSpacing: "0.03em" }}>📖 본문 · 개역개정</div>
            <div style={{ fontSize: 17, color: "#2a2550", lineHeight: 1.85, marginTop: 9, wordBreak: "keep-all", fontWeight: 600 }}>{TARGET}</div>
            <div style={{ fontSize: 12, color: "#a99ff0", marginTop: 9, fontWeight: 700 }}>{reference}</div>
          </div>

          {/* typing zone */}
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#6b6589", margin: "18px 0 9px" }}>여기에 그대로 입력하세요</div>
          <div style={{ position: "relative", border: `2.5px solid ${border}`, borderRadius: 16, background: "#faf9ff", transition: "border-color .15s" }}>
            <div style={{ position: "relative", zIndex: 1, pointerEvents: "none", padding: 16, fontFamily: FONT, fontSize: 19, lineHeight: 1.95, letterSpacing: "-0.01em", wordBreak: "break-all", whiteSpace: "pre-wrap", minHeight: 118 }}>
              {view.segs.map((seg, i) => {
                // 오답인 공백류(NBSP 등)는 빈칸이라 빨강이 안 보인다 → 가운뎃점으로 표시
                const wsErr = (seg.cls === "bad" || seg.cls === "extra") && isSpace(seg.ch);
                return (
                  <span key={i} style={styleFor(seg.cls)}>{wsErr ? "·" : seg.ch}</span>
                );
              })}
            </div>
            <textarea
              className="lg-ta"
              value={input}
              onChange={handleInput}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={handleCompositionEnd}
              readOnly={view.done}
              style={taStyle}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* hint */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14, padding: "12px 14px", background: hint.bg, borderRadius: 13 }}>
            <span style={{ fontSize: 15, flex: "none" }}>{hint.icon}</span>
            <span style={{ fontSize: 13, color: hint.color, fontWeight: 700 }}>{hint.text}</span>
          </div>

          {/* done overlay */}
          {view.done && (
            <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "#faf9ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40, animation: "lg-fadeUp .4s ease", overflow: "hidden", boxSizing: "border-box" }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#e6faf2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, animation: "lg-popIn .55s ease", position: "relative", zIndex: 2 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 20, letterSpacing: "-0.03em", position: "relative", zIndex: 2 }}>클리어! 오늘 완료 🙌</div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "18px 18px", marginTop: 22, boxShadow: "0 6px 0 #e3def7", position: "relative", zIndex: 2 }}>
                <div style={{ fontSize: 16, color: "#2a2550", lineHeight: 1.9, wordBreak: "keep-all", fontWeight: 600 }}>“{TARGET}”</div>
                <div style={{ fontSize: 12, color: "#6244ff", fontWeight: 800, marginTop: 11 }}>{reference} · 개역개정</div>
              </div>
              {/* 서버가 등수를 내려주면 표시, 아직이면 저장 중 안내 */}
              {result == null ? (
                <div style={{ position: "relative", zIndex: 2, marginTop: 16, fontSize: 12.5, color: "#a99ff0", fontWeight: 700 }}>기록 저장 중…</div>
              ) : (
                <RankBoard data={result} style={{ position: "relative", zIndex: 2, marginTop: 18, width: "100%", maxWidth: 320 }} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
