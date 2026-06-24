import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// S3 정적 호스팅용. 상대 경로(./)로 빌드해서 버킷 어느 하위 경로에 올려도 동작하게 함.
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
    base: "./",
    plugins: [react()],
  };
});
