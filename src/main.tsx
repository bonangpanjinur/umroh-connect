import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SplashScreen from "./components/pwa/SplashScreen";

// Detect Lovable preview / iframe — never register a Service Worker there.
// Service workers in iframes redirect, cache stale builds, and break navigation.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();
const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("id-preview--"));

const shouldRegisterSW = import.meta.env.PROD && !isInIframe && !isPreviewHost;

if (shouldRegisterSW) {
  // Lazy import — keeps the virtual module out of the dev bundle entirely.
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        if (confirm("Ada pembaruan aplikasi. Muat ulang sekarang?")) {
          window.location.reload();
        }
      },
      onOfflineReady() {
        console.log("Aplikasi siap digunakan secara offline.");
      },
      async onRegistered(registration) {
        console.log("Service Worker terdaftar:", registration);
        if (registration && "periodicSync" in registration) {
          try {
            const status = await (navigator as any).permissions.query({
              name: "periodic-background-sync",
            });
            if (status.state === "granted") {
              await (registration as any).periodicSync.register("update-prayer-times", {
                minInterval: 24 * 60 * 60 * 1000,
              });
              console.log("Periodic sync registered");
            }
          } catch (error) {
            console.error("Periodic sync registration failed:", error);
          }
        }
      },
    });
  });
} else if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  // Cleanup: unregister any previously-registered SW so preview stops serving stale assets.
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister().catch(() => undefined));
  }).catch(() => undefined);
}

const Root = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit or after 24 hours
    const lastVisit = localStorage.getItem('arah-umroh-last-visit');
    if (!lastVisit) return true;
    const hoursSinceLastVisit = (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60);
    return hoursSinceLastVisit > 24;
  });

  const handleSplashFinish = () => {
    localStorage.setItem('arah-umroh-last-visit', Date.now().toString());
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <App />
    </>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);