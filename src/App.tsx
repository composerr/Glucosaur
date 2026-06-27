import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import useAppSettings from '@/lib/useAppSettings';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Glucose from './pages/Glucose';
import Meals from './pages/Meals';
import Medications from './pages/Medications';
import Reports from './pages/Reports';
import SettingsPage from './pages/SettingsPage';
import Recipes from './pages/Recipes';
import GlycemicIndex from './pages/GlycemicIndex';
import DailyTips from './pages/DailyTips';
import Stores from './pages/Stores';
import Reminders from './pages/Reminders';
import Achievements from './pages/Achievements';
import useReminders from './hooks/useReminders';
import Glucosaur from '@/components/Glucosaur';
import { Shield, Loader2 } from 'lucide-react';
import { appParams } from '@/lib/app-params';

const SUPPORTED = ["en", "uk", "de", "fr", "es"];

function detectLang() {
  if (typeof navigator === 'undefined') return 'en';
  const bl = (navigator.language || "en").slice(0, 2).toLowerCase();
  return SUPPORTED.includes(bl) ? bl : "en";
}

const authTranslations = {
  en: {
    title: "Glucosaur",
    subtitle: "Diabetes Management Companion",
    description: "Your simple and smart assistant for tracking blood glucose, meals, and medication.",
    signin_google: "Continue with Google",
    privacy: "Secure authentication powered by Google"
  },
  uk: {
    title: "Glucosaur",
    subtitle: "Ваш розумний помічник при діабеті",
    description: "Простий та інтелектуальний сервіс для моніторингу рівня цукру, харчування та медикаментів.",
    signin_google: "Продовжити через Google",
    privacy: "Безпечна авторизація через Google"
  }
};

function isInsideIframe() {
  if (typeof window === "undefined") return false;
  return window !== window.parent;
}

function loginViaPopup(url: string, redirectUrl: string, expectedOrigin: string) {
  const width = 500;
  const height = 600;
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
  const popup = window.open(url, "base44_auth", `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  if (!popup) {
    // Fallback if popup is blocked
    window.location.href = url;
    return;
  }
  
  const cleanup = () => {
    window.removeEventListener("message", onMessage);
    clearInterval(pollTimer);
    if (!popup.closed) popup.close();
  };
  
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== expectedOrigin) return;
    if (event.source !== popup) return;
    if (!event.data?.access_token) return;
    
    cleanup();
    const callbackUrl = new URL(redirectUrl);
    const { access_token, is_new_user } = event.data;
    callbackUrl.searchParams.set("access_token", access_token);
    if (is_new_user != null) {
      callbackUrl.searchParams.set("is_new_user", String(is_new_user));
    }
    window.location.href = callbackUrl.toString();
  };
  
  const pollTimer = setInterval(() => {
    if (popup.closed) cleanup();
  }, 500);
  
  window.addEventListener("message", onMessage);
}

// Elegant, custom Auth Layout component
const AuthLayout = () => {
  const lang = detectLang() === "uk" ? "uk" : "en";
  const t = authTranslations[lang];
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const triggerGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      
      const appId = appParams.appId || "mock-app-id";
      const appBaseUrl = appParams.appBaseUrl || window.location.origin;
      const redirectUrl = window.location.href;
      
      // Force the standard Google Account Picker by appending the 'prompt=select_account' query parameter
      const loginUrl = `${appBaseUrl}/api/apps/auth/login?app_id=${appId}&from_url=${encodeURIComponent(redirectUrl)}&prompt=select_account`;
      
      if (isInsideIframe()) {
        const popupLoginUrl = `${loginUrl}&popup_origin=${encodeURIComponent(window.location.origin)}`;
        loginViaPopup(popupLoginUrl, redirectUrl, window.location.origin);
      } else {
        window.location.href = loginUrl;
      }
    } catch (err: any) {
      console.error("Google login failed:", err);
      setErrorMsg(err.message || "Failed to trigger Google authentication");
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
         style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-84 h-84 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="flex flex-col items-center text-center max-w-sm w-full z-10">
        <div className="relative animate-bounce-subtle">
          <Glucosaur size={120} />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-black/10 rounded-full blur-[2px]" />
        </div>

        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-6 leading-none">
          {t.title}
        </h1>
        <p className="text-sm font-semibold text-primary mt-1.5 tracking-wide uppercase">
          {t.subtitle}
        </p>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-[280px]">
          {t.description}
        </p>

        {errorMsg && (
          <div className="w-full mt-6 p-3.5 rounded-2xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 text-center animate-fade-in">
            {errorMsg}
          </div>
        )}

        <button
          onClick={triggerGoogleLogin}
          disabled={isSigningIn}
          className="w-full mt-8 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:bg-primary/95 hover:shadow-primary/35 active:scale-[0.98] transition-all disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
        >
          {isSigningIn ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" opacity="0.9" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" opacity="0.8" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" opacity="0.9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{isSigningIn ? "Connecting..." : t.signin_google}</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] font-medium text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-primary/70 shrink-0" />
          <span>{t.privacy}</span>
        </div>
      </div>
    </div>
  );
};

const AuthenticatedApp = () => {
  useReminders();
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, authChecked } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useAppSettings();

  if (isLoadingPublicSettings || isLoadingAuth || settingsLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <AuthLayout />;
    }
  }

  // Not authenticated — show custom authentication layout
  if (!isAuthenticated && authChecked) {
    return <AuthLayout />;
  }

  const currentLang = settings?.language || 'en';

  return (
    <Routes>
      <Route element={<Layout lang={currentLang} settings={settings} />}>
        <Route path="/" element={<Dashboard settings={settings} />} />
        <Route path="/glucose" element={<Glucose settings={settings} />} />
        <Route path="/meals" element={<Meals settings={settings} />} />
        <Route path="/medications" element={<Medications settings={settings} />} />
        <Route path="/reports" element={<Reports settings={settings} />} />
        <Route path="/settings" element={<SettingsPage settings={settings} updateSettings={updateSettings} />} />
        <Route path="/recipes" element={<Recipes settings={settings} />} />
        <Route path="/glycemic" element={<GlycemicIndex settings={settings} />} />
        <Route path="/tips" element={<DailyTips settings={settings} />} />
        <Route path="/stores" element={<Stores settings={settings} />} />
        <Route path="/reminders" element={<Reminders settings={settings} />} />
        <Route path="/achievements" element={<Achievements settings={settings} />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
