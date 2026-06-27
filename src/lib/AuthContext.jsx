const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { createContext, useState, useContext, useEffect } from 'react';
import { appParams } from '@/lib/app-params';

// Dynamic patch for the global mock DB so it aligns with standard Gmail account picker
const getRealNameForEmail = (email, rawName) => {
  if (!email) return "Google User";
  const normalizedEmail = email.toLowerCase().trim();
  
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const accountsRaw = localStorage.getItem("glucosaur_google_accounts");
      if (accountsRaw) {
        const accounts = JSON.parse(accountsRaw);
        const match = accounts.find(acc => acc.email.toLowerCase().trim() === normalizedEmail);
        if (match && match.name && match.name !== "Сергій" && match.name !== "Google User") {
          return match.name;
        }
      }
    } catch (e) {}
  }

  if (rawName && rawName !== "Сергій" && rawName !== "Google User") {
    return rawName;
  }

  // Fallback to the username part of the email
  const parts = normalizedEmail.split("@");
  return parts[0] || "Google User";
};

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    if (localStorage.getItem("glucosaur_active_user_name") === "Сергій") {
      localStorage.setItem("glucosaur_active_user_name", "sba30048");
    }
    const accountsRaw = localStorage.getItem("glucosaur_google_accounts");
    if (accountsRaw) {
      let accounts = JSON.parse(accountsRaw);
      let changed = false;
      accounts = accounts.map(acc => {
        if (acc.email.toLowerCase().trim() === "sba30048@gmail.com") {
          if (acc.name === "Сергій" || acc.name === "Google User") {
            changed = true;
            return { ...acc, name: "sba30048" };
          }
        } else if (acc.name === "Сергій") {
          changed = true;
          const fallback = acc.email.split("@")[0];
          return { ...acc, name: fallback };
        }
        return acc;
      });
      if (changed) {
        localStorage.setItem("glucosaur_google_accounts", JSON.stringify(accounts));
      }
    }
  } catch (e) {
    console.warn("Storage migration failed:", e);
  }
}

if (globalThis.__B44_DB__ && globalThis.__B44_DB__.auth) {
  globalThis.__B44_DB__.auth.me = async () => {
    const isAuth = localStorage.getItem("glucosaur_authenticated") === "true";
    if (!isAuth) return null;
    const email = localStorage.getItem("glucosaur_active_user_email") || "sba30048@gmail.com";
    const rawName = localStorage.getItem("glucosaur_active_user_name") || "sba30048";
    const name = getRealNameForEmail(email, rawName);
    return {
      id: "glucosaur_mock_user_1",
      email: email,
      name: name
    };
  };

  globalThis.__B44_DB__.auth.logout = async () => {
    localStorage.removeItem("glucosaur_authenticated");
    localStorage.removeItem("glucosaur_active_user_email");
    localStorage.removeItem("glucosaur_active_user_name");
  };
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      const publicSettings = {
        id: appParams.appId || "mock-app-id",
        public_settings: {
          auth_required: true
        }
      };
      setAppPublicSettings(publicSettings);
      
      let currentUser = null;
      if (db.auth && typeof db.auth.me === 'function') {
        try {
          currentUser = await db.auth.me();
        } catch (e) {
          console.error("Failed to check silent login session:", e);
        }
      }

      const activeEmail = localStorage.getItem("glucosaur_active_user_email");
      const activeName = localStorage.getItem("glucosaur_active_user_name");
      const cachedAuth = localStorage.getItem("glucosaur_authenticated") === "true";

      if (currentUser) {
        const email = currentUser.email || "";
        if (email.toLowerCase().endsWith("@gmail.com")) {
          setUser(currentUser);
          setIsAuthenticated(true);
          localStorage.setItem("glucosaur_authenticated", "true");
        } else if (activeEmail && activeEmail.toLowerCase().endsWith("@gmail.com") && cachedAuth) {
          setUser({
            id: "glucosaur_mock_user_1",
            email: activeEmail,
            name: activeName || "Google User"
          });
          setIsAuthenticated(true);
          localStorage.setItem("glucosaur_authenticated", "true");
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("glucosaur_authenticated");
        }
      } else if (cachedAuth && activeEmail && activeEmail.toLowerCase().endsWith("@gmail.com")) {
        setUser({
          id: "glucosaur_mock_user_1",
          email: activeEmail,
          name: activeName || "Google User"
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("glucosaur_authenticated");
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const currentUser = await db.auth.me();
      
      const activeEmail = localStorage.getItem("glucosaur_active_user_email");
      const activeName = localStorage.getItem("glucosaur_active_user_name");
      const cachedAuth = localStorage.getItem("glucosaur_authenticated") === "true";

      if (currentUser) {
        const email = currentUser.email || "";
        if (email.toLowerCase().endsWith("@gmail.com")) {
          setUser(currentUser);
          setIsAuthenticated(true);
          localStorage.setItem("glucosaur_authenticated", "true");
        } else if (activeEmail && activeEmail.toLowerCase().endsWith("@gmail.com") && cachedAuth) {
          setUser({
            id: "glucosaur_mock_user_1",
            email: activeEmail,
            name: activeName || "Google User"
          });
          setIsAuthenticated(true);
          localStorage.setItem("glucosaur_authenticated", "true");
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("glucosaur_authenticated");
        }
      } else if (cachedAuth && activeEmail && activeEmail.toLowerCase().endsWith("@gmail.com")) {
        setUser({
          id: "glucosaur_mock_user_1",
          email: activeEmail,
          name: activeName || "Google User"
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("glucosaur_authenticated");
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    localStorage.removeItem("glucosaur_authenticated");
    localStorage.removeItem("glucosaur_active_user_email");
    localStorage.removeItem("glucosaur_active_user_name");
    localStorage.removeItem("glucosaur_mock_email");
    localStorage.removeItem("glucosaur_mock_name");
    
    if (db.auth && typeof db.auth.logout === 'function') {
      try {
        db.auth.logout();
      } catch (e) {
        console.error("db.auth.logout failed:", e);
      }
    }
  };

  const loginWithGoogleAccount = (email, name) => {
    if (!email || !email.toLowerCase().endsWith("@gmail.com")) {
      setAuthError("Only @gmail.com accounts are permitted to log in.");
      return false;
    }
    
    localStorage.setItem("glucosaur_active_user_email", email.toLowerCase().trim());
    localStorage.setItem("glucosaur_active_user_name", name ? name.trim() : "Google User");
    localStorage.setItem("glucosaur_authenticated", "true");
    
    // Add to device accounts list
    let accounts = [];
    try {
      accounts = JSON.parse(localStorage.getItem("glucosaur_google_accounts") || "[]");
    } catch (e) {}
    
    const normalizedEmail = email.toLowerCase().trim();
    if (!accounts.some(acc => acc.email.toLowerCase() === normalizedEmail)) {
      accounts.push({
        email: normalizedEmail,
        name: name ? name.trim() : "Google User"
      });
      localStorage.setItem("glucosaur_google_accounts", JSON.stringify(accounts));
    }
    
    setUser({
      id: "glucosaur_mock_user_1",
      email: normalizedEmail,
      name: name ? name.trim() : "Google User"
    });
    setIsAuthenticated(true);
    setAuthError(null);
    return true;
  };

  const isInsideIframe = () => {
    if (typeof window === "undefined") return false;
    return window !== window.parent;
  };

  const loginViaPopup = (url, redirectUrl, expectedOrigin) => {
    const width = 500;
    const height = 600;
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(url, "base44_auth", `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
    if (!popup) {
      window.location.href = url;
      return;
    }
    
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(pollTimer);
      if (!popup.closed) popup.close();
    };
    
    const onMessage = (event) => {
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
  };

  const navigateToLogin = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
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
    } catch (e) {
      console.error("navigateToLogin failed:", e);
      setAuthError(e.message || "Failed to navigate to Google login");
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      setAuthError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      loginWithGoogleAccount,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
