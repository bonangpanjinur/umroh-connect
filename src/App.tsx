import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ElderlyModeProvider } from "./contexts/ElderlyModeContext";
import { RamadhanModeProvider, useRamadhanMode } from "./contexts/RamadhanModeContext";
import Index from "./pages/Index";
import AgentOnboarding from "./pages/AgentOnboarding";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AgentPublicProfile from "./pages/AgentPublicProfile";
import ShopAdminDashboard from "./pages/ShopAdminDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import PageDetail from "./pages/PageDetail";
import InstallPWA from "./components/pwa/PWAInstallPrompt";
import SplashScreen from "./components/pwa/SplashScreen";
import { UpdatePrompt } from "./components/pwa/UpdatePrompt";
import { OfflineBanner } from "./components/pwa/OfflineBanner";
import OfflineManagerView from "./components/offline/OfflineManagerView";
import { useEffect, useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { isRamadhanMode } = useRamadhanMode();

  return (
    <AuthProvider>
      <TooltipProvider>
        <div className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${isRamadhanMode ? 'ramadan-mode' : ''}`}>
          <OfflineBanner />
          <Toaster />
          <Sonner />
          <UpdatePrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/offline" element={<OfflineManagerView />} />
              <Route path="/daftar-agen" element={<AgentOnboarding />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/shop-admin/*" element={<ShopAdminDashboard />} />
              <Route path="/agent/*" element={<AgentDashboard />} />
              <Route path="/seller/*" element={<SellerDashboard />} />
              <Route path="/travel/:slug" element={<AgentPublicProfile />} />
              <Route path="/travel/:slug/:packageSlug" element={<AgentPublicProfile />} />
              <Route path="/:slug" element={<PageDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <InstallPWA />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <ElderlyModeProvider>
            <RamadhanModeProvider>
              <AppContent />
            </RamadhanModeProvider>
          </ElderlyModeProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
