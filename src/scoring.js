// 필사 채점 로직 (순수 함수, React 비의존).
//
// 핵심 아이디어: 글자(음절)가 아니라 "자모(字母)" 단위로 비교한다.
// 입력 자모열이 본문 자모열의 prefix 이면 아직 오답이 아니다.
// 덕분에 조합 중인 글자("ㅎ","하","한")가 빨강으로 선판정되지 않는다.
// (모바일 IME 의 조합 플래그에 의존하지 않는다.)

// \s 는 NBSP(U+00A0) 등 모든 공백을 포함 → 공백류를 일반 공백과 동일 취급
export const isSpace = (c) => /\s/.test(c);

// 완료/정답 판정용 정규화: NFC + 공백류 통일 + 중복 공백 합치기 + 양끝 trim
export const normalize = (s) => s.normalize("NFC").replace(/\s+/g, " ").trim();
export const matchesTarget = (input, target) => normalize(input) === normalize(target);

const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
// 중성·종성의 복합 자모는 낱자로 쪼갠다(ㅘ→ㅗㅏ, ㄺ→ㄹㄱ). 입력 중간 상태가 prefix 가 되도록.
const JUNG = [["ㅏ"],["ㅐ"],["ㅑ"],["ㅒ"],["ㅓ"],["ㅔ"],["ㅕ"],["ㅖ"],["ㅗ"],["ㅗ","ㅏ"],["ㅗ","ㅐ"],["ㅗ","ㅣ"],["ㅛ"],["ㅜ"],["ㅜ","ㅓ"],["ㅜ","ㅔ"],["ㅜ","ㅣ"],["ㅠ"],["ㅡ"],["ㅡ","ㅣ"],["ㅣ"]];
const JONG = [[],["ㄱ"],["ㄲ"],["ㄱ","ㅅ"],["ㄴ"],["ㄴ","ㅈ"],["ㄴ","ㅎ"],["ㄷ"],["ㄹ"],["ㄹ","ㄱ"],["ㄹ","ㅁ"],["ㄹ","ㅂ"],["ㄹ","ㅅ"],["ㄹ","ㅌ"],["ㄹ","ㅍ"],["ㄹ","ㅎ"],["ㅁ"],["ㅂ"],["ㅂ","ㅅ"],["ㅅ"],["ㅆ"],["ㅇ"],["ㅈ"],["ㅊ"],["ㅋ"],["ㅌ"],["ㅍ"],["ㅎ"]];

const charToJamo = (ch) => {
  if (isSpace(ch)) return [" "]; // 공백류는 모두 일반 공백으로
  const c = ch.charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) {
    const s = c - 0xac00;
    return [CHO[Math.floor(s / 588)], ...JUNG[Math.floor((s % 588) / 28)], ...JONG[s % 28]];
  }
  return [ch]; // 한글 외(영문/숫자/문장부호/조합 중 낱자) 는 그대로
};

// 문자열 → 자모열. 각 자모에 원본 글자 index(ci) 를 달아 글자별 채점에 쓴다.
const decompose = (str) => {
  const s = str.normalize("NFC");
  const arr = [];
  for (let ci = 0; ci < s.length; ci++)
    for (const j of charToJamo(s[ci])) arr.push({ j, ci });
  return arr;
};

/**
 * 입력을 본문과 자모 단위로 비교해 글자별 채점 결과를 만든다.
 * @returns {{ segs: {ch:string, cls:string}[], err:number, firstErr:number }}
 *   cls: ok(정답) | bad(오답) | extra(초과·취소선) | typing(입력 중·보라) | pending(아직 안 침·회색)
 *   - 마지막(=조합 중) 글자는 빨강(bad/extra) 대신 'typing' 으로 둬 선판정을 막는다.
 *     (천지인처럼 중간 상태가 prefix 가 아닌 경우 "히"→"하" 도 안 튀게)
 */
export function scoreInput(target, input) {
  const Tj = decompose(target);
  const Ij = decompose(input);

  // 입력 자모열이 본문 자모열과 일치하는 길이(m). m 이후(첫 불일치~)는 오답.
  let m = 0;
  while (m < Ij.length && m < Tj.length && Ij[m].j === Tj[m].j) m++;

  // 글자에 오답 자모가 하나라도 걸리면 그 글자를 오답으로 본다.
  const badChar = {};
  for (let k = 0; k < Ij.length; k++) badChar[Ij[k].ci] = badChar[Ij[k].ci] || k >= m;

  const segs = [];
  const last = input.length - 1; // 마지막(조합 중) 글자
  let err = 0, firstErr = -1;
  const pushBad = (i, cls) => {
    if (i === last) { segs.push({ ch: input[i], cls: "typing" }); return; }
    err++; if (firstErr < 0) firstErr = i;
    segs.push({ ch: input[i], cls });
  };

  for (let i = 0; i < target.length; i++) {
    if (i >= input.length) { segs.push({ ch: target[i], cls: "pending" }); continue; }
    if (badChar[i]) pushBad(i, "bad");
    else segs.push({ ch: input[i], cls: "ok" });
  }
  for (let i = target.length; i < input.length; i++) pushBad(i, "extra"); // 본문보다 길게 친 부분

  return { segs, err, firstErr };
}
