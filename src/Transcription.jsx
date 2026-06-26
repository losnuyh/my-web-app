import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FilsaScreen from "./FilsaScreen";
import { postJson } from "./api";
import { Center, AlreadyDone, Expired, NotFound } from "./ui";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-06-24" → "2026년 6월 24일 수요일"
function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 ${wd}요일`;
}

/**
 * 필사 화면 (/transcription).
 * 링크 형식: https://dev-app.play-logos.com/transcription?token=...
 * 알림톡 버튼 URL 의 ?token=... 을 그대로 서버에 보낸다.
 * user_id / date 는 토큰 안에 들어 있으므로 따로 보내지 않는다.
 */
export default function Transcription() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [passage, setPassage] = useState(null);
  const [result, setResult] = useState(null); // 방금 완료 기록의 서버 응답(등수)
  // 필사 대신 보여줄 안내 화면: { type: "already"|"expired"|"notfound", data }
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("유효하지 않은 링크예요. 알림톡의 버튼으로 다시 들어와 주세요.");
      return;
    }
    // 필사 시작 — 토큰은 헤더, 본문 없음.
    postJson("/transcriptions", token)
      .then(({ status, ok, data }) => {
        if (ok) {
          setPassage(data); // { date, reference, text, started_at }
          return;
        }
        if (status === 400 && data.code === "already_completed") return setNotice({ type: "already", data });
        if (status === 400 && data.code === "expired") return setNotice({ type: "expired", data });
        if (status === 404 && data.code === "not_found") return setNotice({ type: "notfound", data });
        if (status === 403) return setError("유효하지 않은 링크예요. 알림톡의 버튼으로 다시 들어와 주세요.");
        throw new Error(`HTTP ${status}`);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  // 필사 완료. 100% 일치 시 서버에 완료를 기록한다.
  const handleComplete = (text) => {
    postJson("/transcriptions/complete", token, { text })
      .then(({ status, ok, data }) => {
        // 불일치 → 400 { detail } (재시도 가능)
        if (status === 400) throw new Error(data.detail || "필사한 텍스트가 오늘의 말씀과 일치하지 않습니다.");
        if (!ok) throw new Error(`HTTP ${status}`);
        // 200 { completed, submit_rank, speed_rank, elapsed_seconds, total, average_elapsed_seconds }
        // (멱등 재완료는 { completed } 만 올 수 있음)
        return data;
      })
      .then(setResult)
      .catch((e) => {
        // 화면 완료 UX 는 로컬 채점으로 이미 표시됨. 기록 실패는 로깅만.
        // result 를 빈 값으로 채워 '저장 중…' 표시는 거둔다.
        console.error("필사 완료 기록 실패:", e.message);
        setResult({});
      });
  };

  if (error) return <Center>{error}</Center>;
  if (notice?.type === "already") return <AlreadyDone data={notice.data} token={token} />;
  if (notice?.type === "expired") return <Expired data={notice.data} />;
  if (notice?.type === "notfound") return <NotFound date={notice.data?.date} />;
  if (!passage) return <Center>오늘의 말씀을 불러오는 중…</Center>;

  return (
    <FilsaScreen
      verseText={passage.text}
      reference={passage.reference}
      dateLabel={formatDate(passage.date)}
      startedAt={passage.started_at}
      result={result}
      token={token}
      onComplete={handleComplete}
    />
  );
}
