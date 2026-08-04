import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
  base: env.VITE_BASE_PATH || "/dbt/",
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api/* to backend during development.
      // Change target to match your local backend:
      //   ASP.NET Core → https://localhost:5001
      //   PHP/CoreServer → http://localhost:8080
      '/api': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: "esnext",
    minify: false,
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
  },
  };
});
