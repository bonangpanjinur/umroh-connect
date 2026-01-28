import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        id: "/",
        name: "Arah Umroh - Marketplace & Pendamping Ibadah",
        short_name: "Arah Umroh",
        description: "Marketplace umroh terpercaya dengan fitur pendamping ibadah lengkap. Temukan paket umroh terbaik, panduan manasik, jadwal sholat, dan fitur pendamping perjalanan ibadah Anda.",
        theme_color: "#059669",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "id",
        dir: "ltr",
        categories: ["travel", "lifestyle", "education", "navigation"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshots/home-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "Halaman Utama Arah Umroh",
          },
          {
            src: "/screenshots/home-narrow.png",
            sizes: "540x720",
            type: "image/png",
            form_factor: "narrow",
            label: "Tampilan Mobile Arah Umroh",
          },
        ],
        shortcuts: [
          {
            name: "Cari Paket Umroh",
            short_name: "Paket",
            description: "Temukan paket umroh terbaik",
            url: "/?view=paket",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Panduan Manasik",
            short_name: "Manasik",
            description: "Pelajari tata cara ibadah",
            url: "/?view=manasik",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Doa & Dzikir",
            short_name: "Doa",
            description: "Kumpulan doa dan dzikir",
            url: "/?view=doa",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
        related_applications: [],
        prefer_related_applications: false,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "weather-api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 30, // 30 minutes
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.aladhan\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "prayer-times-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:mp3|wav|ogg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));
