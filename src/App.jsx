import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tractor, Shield } from "lucide-react";

import Navbar from "./components/common/Navbar";
import Auth from "./components/common/Auth";
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./components/common/SplashScreen";
import ScrollToTop from "./components/common/ScrollToTop";

// Contexts
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BookingProvider } from "./context/BookingContext";
import { UIProvider } from "./context/UIContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

function AppContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoggedIn, userData, loading, logout } = useAuth();

  const [authRole, setAuthRole] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // Manage global background visibility
  useEffect(() => {
    if (showSplash) {
      document.body.classList.remove("show-bg");
    } else {
      document.body.classList.add("show-bg");
    }
  }, [showSplash]);


  // ================= LOADING =================
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agri-green"></div>
      </div>
    );
  }

  // ================= SPLASH =================
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }


  // ================= NORMAL APP LAYOUT =================
  return (
    <main className="relative font-sans antialiased text-black min-h-screen flex flex-col">
      <ScrollToTop />

      <Navbar
        isLoggedIn={isLoggedIn}
        userData={userData}
        onAuthClick={(role) => setAuthRole(role)}
        onLogout={logout}
        onNavigate={(target) => navigate(`/${target}`)}
      />

      {authRole && (
        <Auth
          initialRole={authRole}
          onClose={() => setAuthRole(null)}
          onLogin={() => setAuthRole(null)}
        />
      )}

      <div className="flex-grow">
        <AppRoutes />
      </div>

      <footer className="bg-[oklch(92.2%_0.005_34.3)] border-t border-slate-200 text-black py-12 text-center relative z-10">
        <div className="flex flex-col items-center gap-6">

          <p className="text-black/60 text-sm font-medium tracking-wide">
            {t("footer.tagline")}
          </p>

          {!isLoggedIn && (
            <div className="w-full max-w-md border-t border-slate-300 pt-8 mt-4 flex flex-col items-center gap-3">

              <p className="text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em]">
                {t("footer.areYouProvider")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                <button
                  onClick={() => setAuthRole("provider")}
                  className="group flex items-center gap-3 bg-[oklch(95.3%_0.051_180.801)] hover:opacity-90 text-emerald-950 px-8 py-4 rounded-2xl text-sm font-black transition-all border border-emerald-200 shadow-xl hover:scale-105 active:scale-95"
                >
                  <Tractor
                    size={20}
                    className="text-emerald-700 group-hover:rotate-12 transition-transform"
                  />
                  <span className="uppercase tracking-widest">{t("footer.loginAsProvider")}</span>
                </button>

              </div>

            </div>
          )}

        </div>
      </footer>

    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <LanguageProvider>
          <BookingProvider>
            <AppContent />
          </BookingProvider>
        </LanguageProvider>
      </UIProvider>
    </AuthProvider>
  );
}

export default App;