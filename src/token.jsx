import React, { createContext, useContext, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// 토큰 보관 — URL → 메모리 → localStorage 3중으로 유실을 막는다.
//  - localStorage: 새로고침/웹뷰 재로드에도 살아남음(sessionStorage 보다 견고).
//  - 메모리(memToken): storage 가 막힌 환경(사파리 프라이빗/일부 인앱브라우저)에서도
//    리로드 없는 SPA 이동은 토큰을 유지.
//  - 진입 시 ?token 은 저장 후 주소에서 제거.
//  ※ 토큰은 7일 만료라 localStorage 에 둬도 위험이 제한적.
const KEY = "logos_token";
let memToken = null;

function persist(t) {
  memToken = t;
  try { localStorage.setItem(KEY, t); } catch { /* 저장 불가 환경: 메모리로 버팀 */ }
}
function load() {
  if (memToken) return memToken;
  try { return localStorage.getItem(KEY); } catch { return null; }
}

const TokenContext = createContext(null);

export function TokenProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlToken = searchParams.get("token");
  if (urlToken) memToken = urlToken; // 효과 실행 전이라도 즉시 메모리 확보
  const token = urlToken || load();

  useEffect(() => {
    if (!urlToken) return;
    persist(urlToken);
    // 다른 쿼리는 보존하고 token 만 주소에서 제거
    const next = new URLSearchParams(searchParams);
    next.delete("token");
    setSearchParams(next, { replace: true });
  }, [urlToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
}

export const useToken = () => useContext(TokenContext);
