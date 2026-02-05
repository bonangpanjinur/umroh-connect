import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ElderlyModeProvider } from "@/contexts/ElderlyModeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PageDetail from "./pages/PageDetail";
import AgentPublicProfile from "./pages/AgentPublicProfile";
import NotFound from "./pages/NotFound";
import DynamicSlugHandler from "./pages/DynamicSlugHandler";
import { OfflineBanner } from "./components/pwa/OfflineBanner";
import { UpdatePrompt } from "./components/pwa/UpdatePrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ElderlyModeProvider>
          <LanguageProvider>
            <TooltipProvider>
              <OfflineBanner />
              <UpdatePrompt />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/agent" element={<AgentDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/agent/:slug" element={<AgentPublicProfile />} />
                  <Route path="/:slug" element={<DynamicSlugHandler />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </ElderlyModeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
