// API 주소. 로컬은 .env.development, 배포는 CI의 VITE_API_BASE 로 주입된다.
export const API_BASE = import.meta.env.VITE_API_BASE;

// 토큰은 항상 Authorization 헤더로 보낸다 (알림톡에서 받은 token).
const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

async function parse(r) {
  const data = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, data };
}

// GET — 토큰은 헤더로.
export async function getJson(path, token) {
  return parse(await fetch(`${API_BASE}${path}`, { headers: authHeaders(token) }));
}

// POST — 토큰은 헤더, 데이터(body)는 선택(없으면 본문 없이 전송).
export async function postJson(path, token, body) {
  const opts = { method: "POST", headers: authHeaders(token) };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  return parse(await fetch(`${API_BASE}${path}`, opts));
}
