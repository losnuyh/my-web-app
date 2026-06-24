import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// S3 정적 호스팅용. 상대 경로(./)로 빌드해서 버킷 어느 위치에 올려도 동작하게 함.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
