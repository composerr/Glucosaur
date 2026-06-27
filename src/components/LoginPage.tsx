import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { appParams } from "@/lib/app-params";
import { Shield, Loader2, Lock, Sparkles } from "lucide-react";

/**
 * Technical requirement implementation notes:
 * 
 * 1. For Firebase Auth (Web):
 *    To ensure the standard Google Account Chooser is forced on every sign-in attempt,
 *    we configure the GoogleAuthProvider with custom parameters as shown below:
 * 
 *    ```typescript
 *    import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
 *    
 *    const provider = new GoogleAuthProvider();
 *    provider.setCustomParameters({
 *      prompt: 'select_account' // Forces the standard multi-account selection UI
 *    });
 *    const auth = getAuth();
 *    await signInWithPopup(auth, provider);
 *    ```
 * 
 * 2. For Android Credential Manager (or Google Identity Services / One Tap):
 *    Make sure that account filtering is disabled so that all Google accounts on the device are displayed:
 * 
 *    ```kotlin
 *    val googleIdOption = GetGoogleIdOption.Builder()
 *        .setFilterByAuthorizedAccounts(false) // Ensures ALL Google accounts are visible, not just pre-authorized ones
 *        .setServerClientId(webClientId)
 *        .build()
 *    ```
 */

export default function LoginPage() {
  const { navigateToLogin, isLoadingAuth } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      // Trigger the auth flow that forces account selection
      await navigateToLogin();
    } catch (err) {
      console.error("Google Sign-In Error:", err);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoadingAuth || isSigningIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Connecting to Google Secure Auth...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-primary/10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="h-2 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05]" />

        <div className="p-8 sm:p-10 flex flex-col items-center">
          {/* Logo & Header */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#4285F4]/10 flex items-center justify-center mx-auto mb-4 relative">
              <Lock className="w-8 h-8 text-[#4285F4]" />
              <div className="absolute -top-1 -right-1 bg-[#34A853] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Glucosaur Secure Log In
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-[280px] mx-auto">
              Access your personalized diabetes tracker and health insights
            </p>
          </div>

          {/* Action Area */}
          <div className="w-full space-y-4">
            {/* Primary Google Sign-In Button forcing Account Picker */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleGoogleSignIn}
              id="google-signin-btn"
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-base rounded-2xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </motion.button>
          </div>

          {/* Secure / Privacy Notice */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Encrypted with standard Google OAuth 2.0 protocol</span>
          </div>
        </div>

        {/* Footer info links */}
        <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer hover:underline transition-colors">
            Privacy Policy
          </span>
          <span className="hover:text-slate-600 cursor-pointer hover:underline transition-colors">
            Terms of Service
          </span>
        </div>
      </div>
    </div>
  );
}
