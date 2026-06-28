import React, { useEffect, useState } from "react";
import FilsaScreen from "./FilsaScreen";
import { postJson } from "./api";
import { normalize } from "./scoring";
import { useToken } from "./token";
import { Center, AlreadyDone, Expired, NotFound, LinkError } from "./ui";

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
 * 진입 시 ?token 은 메모리·localStorage 로 옮겨지고 주소에선 제거된다(token.jsx).
 * API 호출엔 Authorization 헤더로 실린다. user_id/date 는 토큰 안에 있다.
 */
export default function Transcription() {
  const token = useToken();

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
        if (status === 401 || status === 403) return setNotice({ type: "linkerror", data, status }); // 만료/위조
        if (status === 400 && data.code === "already_completed") return setNotice({ type: "already", data });
        if (status === 400 && data.code === "expired") return setNotice({ type: "expired", data });
        if (status === 404 && data.code === "not_found") return setNotice({ type: "notfound", data });
        throw new Error(`HTTP ${status}`);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  // 필사 완료. 100% 일치 시 서버에 완료를 기록한다.
  // 서버 대조와 어긋나지 않도록 클라와 동일하게 정규화한 텍스트를 보낸다.
  const handleComplete = (text) => {
    setResult(null); // '채점 확인 중…' 상태로 (재시도 시에도 되돌림)
    postJson("/transcriptions/complete", token, { text: normalize(text) })
      .then(({ status, ok, data }) => {
        // 성공: { completed, submit_rank, speed_rank, elapsed_seconds, total, ... }
        if (ok) return data;
        // 실패는 화면에 드러낸다(원인 코드 보이게). 400 불일치 / 401 만료 등.
        const reason = status === 400 ? (data.detail || "본문 불일치") : `오류 ${status}`;
        console.error("필사 완료 기록 실패:", status, data);
        return { failed: true, reason };
      })
      .then(setResult)
      .catch((e) => {
        console.error("필사 완료 기록 네트워크 오류:", e);
        setResult({ failed: true, reason: "네트워크 오류" });
      });
  };

  if (error) return <Center>{error}</Center>;
  if (notice?.type === "linkerror") return <LinkError code={notice.data?.detail?.code} detail={`진단: 진입 ${notice.status}`} />;
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
