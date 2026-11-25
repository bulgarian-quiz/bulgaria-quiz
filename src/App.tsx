import { useEffect, useState, lazy, Suspense } from "react";
import { useExperience, isDesktop3DCapable } from "@/experience/store";
const Experience = lazy(() => import("@/experience/Experience"));
import { useTouchMode } from "@/hooks/useTouchMode";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Navigate, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { wantsHub } from "@/lib/journey";

// Hosted previews have no server-side routing, so they opt into hash URLs.
const Router = import.meta.env.VITE_ROUTER === "hash" ? HashRouter : BrowserRouter;
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PointsProvider } from "@/contexts/PointsContext";
// Routes are split so a visit to one page doesn't download every other page
// (the homepage's Earth scene alone pulls in three.js).
const Home = lazy(() => import("./pages/Home"));
const Games = lazy(() => import("./pages/Games"));
const About = lazy(() => import("./pages/About"));
const Game = lazy(() => import("./pages/Game"));
const DragDropGame = lazy(() => import("./pages/DragDropGame"));
const PhotoQuiz = lazy(() => import("./pages/PhotoQuiz"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const FlashcardView = lazy(() => import("./pages/FlashcardView"));
const Profile = lazy(() => import("./pages/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Legal = lazy(() => import("./pages/Legal"));

// Same colour as the page behind it, so the brief chunk load never flashes.
const RouteFallback = () => <div className="min-h-[100svh] bg-background" />;
import Chatbot from "./components/Chatbot";
import CookieBanner from "./components/CookieBanner";
import BanScreen from "./components/BanScreen";

/** New pages open at the top (the browser keeps the old scroll position otherwise); Back/Forward keep theirs. */
const ScrollToTop = () => {
  const { pathname, state } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType === "POP" || wantsHub(state)) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    // Only a change of page should scroll; state is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  useTouchMode();
  const [desktop, setDesktop] = useState(isDesktop3DCapable);
  const mode = useExperience((s) => s.mode);
  const show3D = desktop && mode === "game";

  useEffect(() => {
    const update = () => setDesktop(isDesktop3DCapable());
    const coarse = window.matchMedia("(pointer: coarse)");
    coarse.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      coarse.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return (
    show3D ? (
      <Suspense fallback={<div className="fixed inset-0 bg-background" />}><Experience /></Suspense>
    ) : (
    <Router>
      <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/about" element={<About />} />
        <Route path="/game" element={<Game />} />
        <Route path="/drag-drop-game" element={<DragDropGame />} />
        <Route path="/photo-quiz" element={<PhotoQuiz />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/flashcards/:category" element={<FlashcardView />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy-policy" element={<Legal kind="privacy" />} />
        <Route path="/terms-and-conditions" element={<Legal kind="terms" />} />
        {/* Earlier short addresses keep working. */}
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <Chatbot />
      <CookieBanner />
      </>
    </Router>
    )
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
          <AuthProvider>
            <PointsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppContent />
                <BanScreen />
              </TooltipProvider>
            </PointsProvider>
          </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export const LegacyRoutes = ({ onHome }: { onHome: () => void }) => (
  <Suspense fallback={<RouteFallback />}>
  <Routes>
    <Route path="/" element={<HomeExit onHome={onHome} />} />
    <Route path="/games" element={<Games />} />
    <Route path="/about" element={<About />} />
    <Route path="/game" element={<Game />} />
    <Route path="/drag-drop-game" element={<DragDropGame />} />
    <Route path="/flashcards" element={<Flashcards />} />
    <Route path="/flashcards/:category" element={<FlashcardView />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="*" element={<HomeExit onHome={onHome} />} />
  </Routes>
  </Suspense>
);

const HomeExit = ({ onHome }: { onHome: () => void }) => {
  useEffect(() => { onHome(); }, [onHome]);
  return null;
};

export default App;
