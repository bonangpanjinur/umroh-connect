import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SplashScreen from "./components/pwa/SplashScreen";

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