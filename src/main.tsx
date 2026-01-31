import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SplashScreen from "./components/pwa/SplashScreen";
import { registerSW } from "virtual:pwa-register";

// Register Service Worker
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
    
    // Request Periodic Sync for prayer times
    if (registration && 'periodicSync' in registration) {
      try {
        const status = await (navigator as any).permissions.query({
          name: 'periodic-background-sync',
        });
        
        if (status.state === 'granted') {
          await (registration as any).periodicSync.register('update-prayer-times', {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          });
          console.log('Periodic sync registered');
        }
      } catch (error) {
        console.error('Periodic sync registration failed:', error);
      }
    }
  }
});

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