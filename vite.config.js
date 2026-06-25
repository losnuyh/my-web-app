import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// CloudFront 루트 도메인(dev-app.play-logos.com)에서 서빙된다.
// 절대 경로(/)로 빌드해야 /transcription/result 같은 중첩 라우트에서도
// 에셋(/assets/...)을 항상 올바르게 가리킨다.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = process.env.VITE_API_BASE || env.VITE_API_BASE;

  // 프로덕션 빌드에는 API 주소가 반드시 필요. 미설정 시 빌드를 멈춘다.
  if (command === "build" && !apiBase) {
    throw new Error(
      "VITE_API_BASE 가 설정되지 않았습니다. 예: VITE_API_BASE=https://api.example.com npm run build"
    );
  }

  return {
    base: "/",
    plugins: [react()],
  };
});
