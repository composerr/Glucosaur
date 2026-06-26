const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { createContext, useState, useContext, useEffect } from 'react';

import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

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

      const cachedAuth = localStorage.getItem("glucosaur_authenticated") === "true";

      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        localStorage.setItem("glucosaur_authenticated", "true");
      } else if (cachedAuth) {
        const mockEmail = localStorage.getItem("glucosaur_mock_email") || "glucosaur@example.com";
        const mockName = localStorage.getItem("glucosaur_mock_name") || "Glucosaur Patient";
        setUser({
          id: "glucosaur_mock_user_1",
          email: mockEmail,
          name: mockName
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
      const currentUser = await db.auth.me();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        localStorage.setItem("glucosaur_authenticated", "true");
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
    localStorage.removeItem("glucosaur_mock_email");
    localStorage.removeItem("glucosaur_mock_name");
    if (db.auth && typeof db.auth.logout === 'function') {
      try {
        db.auth.logout();
      } catch (e) {
        console.error("db.auth.logout failed:", e);
      }
    } else if (db.auth && typeof db.auth.signOut === 'function') {
      try {
        db.auth.signOut();
      } catch (e) {
        console.error("db.auth.signOut failed:", e);
      }
    }
  };

  const navigateToLogin = async () => {
    setIsLoadingAuth(true);
    if (db.auth && typeof db.auth.loginWithProvider === 'function') {
      try {
        db.auth.loginWithProvider('google', window.location.href);
        return;
      } catch (e) {
        console.error("loginWithProvider failed:", e);
      }
    }

    let loggedInUser = null;
    if (db.auth && typeof db.auth.login === 'function') {
      try {
        await db.auth.login();
        loggedInUser = await db.auth.me();
      } catch (e) {
        console.error("Real login failed:", e);
      }
    } else if (db.auth && typeof db.auth.signInWithGoogle === 'function') {
      try {
        await db.auth.signInWithGoogle();
        loggedInUser = await db.auth.me();
      } catch (e) {
        console.error("Real signInWithGoogle failed:", e);
      }
    }

    if (!loggedInUser) {
      const mockEmail = localStorage.getItem("glucosaur_mock_email") || "glucosaur@example.com";
      const mockName = localStorage.getItem("glucosaur_mock_name") || "Glucosaur Patient";
      loggedInUser = {
        id: "glucosaur_mock_user_1",
        email: mockEmail,
        name: mockName
      };
    }

    setUser(loggedInUser);
    setIsAuthenticated(true);
    localStorage.setItem("glucosaur_authenticated", "true");
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
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