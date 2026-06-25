# 로고스 — 필사 화면

`src/FilsaScreen.jsx` 한 화면을 S3 정적 웹으로 배포합니다.
매일의 성경 구절을 본문 그대로 타이핑해서 100% 일치하면 완료되는 화면입니다.
의존성 없는(React만 필요) 함수형 컴포넌트이고, 스타일은 전부 인라인입니다.

## S3 정적 웹 배포

Vite로 빌드해서 나온 `dist/`를 S3 정적 호스팅 버킷에 그대로 올리면 됩니다.
(CloudFront 루트 도메인에서 서빙되므로 절대 경로 `base: "/"` 로 빌드합니다.
React Router 딥링크/새로고침은 CloudFront의 404/403 → `index.html` 처리로 동작합니다.)

```bash
npm install
npm run build          # → dist/ 생성
npm run dev            # 로컬 개발 서버
npm run preview        # 빌드 결과 미리보기

# S3 업로드 (버킷명만 바꾸세요)
aws s3 sync dist/ s3://YOUR_BUCKET_NAME/ --delete
```

S3 버킷 설정:
- **속성 → 정적 웹 사이트 호스팅** 활성화, 인덱스 문서 `index.html`
- 퍼블릭 접근이 필요하면 버킷 정책으로 `s3:GetObject` 허용 (또는 CloudFront 연결)

## 폰트 (선택)

Pretendard를 `index.html`에서 CDN으로 로드합니다. 연결이 없으면 기본 고딕으로 대체됩니다.

## FilsaScreen — props

표시할 구절은 `src/main.jsx`에서 `<FilsaScreen ... />` 에 넘기면 됩니다.

```jsx
<FilsaScreen
  verseText="여호와는 나의 목자시니 내게 부족함이 없으리로다"
  reference="시편 23편 1절"
  dateLabel="2026년 6월 23일 화요일"
  onComplete={() => api.markDone()}   // 100% 일치 시 1회 호출
/>
```

채점 규칙: 앞뒤 공백·줄바꿈만 trim, 내부는 글자 단위 엄격 일치. 한글 IME는 조합 중인 글자를 오류로 세지 않고(보라색 '입력 중'), 글자가 완성되면 채점. 완료는 되돌릴 수 없음(입력 잠금).

> 타이핑 임팩트 효과(슬램/축포 등)는 빠진 상태입니다 — 별도로 얹으면 됩니다.
