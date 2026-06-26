import React, { createContext, useContext, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// 토큰을 URL 에 남기지 않기 위한 처리.
//  - 진입 시 ?token=... 을 한 번 읽어 sessionStorage 에 저장하고
//  - 주소창에서 token 을 즉시 제거(history replace)
//  - 이후 모든 화면은 useToken() 으로 sessionStorage 의 토큰을 읽는다
//  - sessionStorage 는 새로고침은 버티고, 탭을 닫으면 사라진다(재진입 필요)
const KEY = "logos_token";
const TokenContext = createContext(null);

export function TokenProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlToken = searchParams.get("token");

  // 첫 렌더에 토큰을 바로 쓸 수 있도록: URL 우선, 없으면 저장된 값.
  const token = urlToken || sessionStorage.getItem(KEY);

  useEffect(() => {
    if (!urlToken) return;
    sessionStorage.setItem(KEY, urlToken);
    // 다른 쿼리는 보존하고 token 만 주소에서 제거
    const next = new URLSearchParams(searchParams);
    next.delete("token");
    setSearchParams(next, { replace: true });
  }, [urlToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
}

export const useToken = () => useContext(TokenContext);
