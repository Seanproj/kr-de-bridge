// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";

// 배포 주소: SITE_URL (예: https://kr-de-bridge.pages.dev), GitHub Pages 하위 경로면 BASE_PATH=/kr-de-bridge
const site = process.env.SITE_URL ?? "https://kr-de-bridge.pages.dev";
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  vite: { plugins: [tailwindcss()] },
  integrations: [
    AstroPWA({
      registerType: "autoUpdate",
      base,
      scope: base,
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "한독 행정 브릿지",
        short_name: "한독브릿지",
        description: "독일에 사는 한국인을 위한 행정 정보 카드",
        lang: "ko",
        theme_color: "#0b1020",
        background_color: "#f5f3ee",
        display: "standalone",
        start_url: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallback: null,
        // 앱 셸(CSS·JS·폰트)은 미리 캐시, 페이지는 열어본 것부터 캐시 → 오프라인에서 이미 본 카드 열람
        globPatterns: ["**/*.{css,js,svg}", "icons/*.png"],
        globIgnores: ["pagefind/**"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "pages", networkTimeoutSeconds: 4, expiration: { maxEntries: 120 } },
          },
          {
            // Pretendard는 유니코드 범위별로 쪼개진 파일이라 실제 쓰인 조각만 캐시
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 200 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/pagefind/"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "search-index" },
          },
        ],
      },
    }),
  ],
});
