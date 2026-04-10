import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/dashboard/",
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
});
