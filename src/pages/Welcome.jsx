import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Glucosaur from "@/components/Glucosaur";
import { t } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { Shield, Droplets, UtensilsCrossed, Pill, BarChart3, User, Loader2, Globe } from "lucide-react";

const SUPPORTED = ["en", "uk", "de", "fr", "es"];

function detectLang() {
  const bl = (navigator.language || "en").slice(0, 2).toLowerCase();
  return SUPPORTED.includes(bl) ? bl : "en";
}

export default function Welcome() {
  const { navigateToLogin, isLoadingAuth } = useAuth();
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const lang = detectLang();

  const features = [
    { icon: Droplets, key: "welcome_feat_glucose" },
    { icon: UtensilsCrossed, key: "welcome_feat_meals" },
    { icon: Pill, key: "welcome_feat_meds" },
    { icon: BarChart3, key: "welcome_feat_reports" },
  ];

  // Accounts list for the Google OAuth screen - purely Сергій Бабич, no "Glucosaur Patient"
  const googleAccounts = [
    { email: "sba30048@gmail.com", name: "Сергій Бабич", initials: "СБ" }
  ];

  const handleSelectAccount = async (email, name) => {
    setIsSigningIn(true);
    // Simulate natural Google OAuth loading/redirection delay
    setTimeout(async () => {
      try {
        await navigateToLogin();
        localStorage.setItem("glucosaur_mock_email", email);
        localStorage.setItem("glucosaur_mock_name", name || email.split("@")[0]);
        // Complete the auth
        window.location.reload();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSigningIn(false);
      }
    }, 800);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes("@")) return;
    handleSelectAccount(customEmail, customName || customEmail.split("@")[0]);
  };

  if (isLoadingAuth || isSigningIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">
          {isSigningIn ? "Google OAuth..." : t("general_loading", lang)}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <AnimatePresence mode="wait">
        {!showGoogleChooser ? (
          // Main Welcome Screen
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Glucosaur size={120} />
            </motion.div>

            <h1 className="text-2xl font-bold text-foreground mt-6">{t("welcome_title", lang)}</h1>
            <p className="text-base text-primary font-medium mt-1">{t("welcome_subtitle", lang)}</p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{t("welcome_description", lang)}</p>

            <div className="grid grid-cols-4 gap-3 mt-6 w-full">
              {features.map(({ icon: Icon, key }, i) => (
                <div
                  key={key}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{t(key, lang)}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowGoogleChooser(true)}
              className="w-full mt-8 flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-base shadow-lg shadow-primary/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t("welcome_signin", lang)}
            </motion.button>

            <div className="flex items-center gap-1.5 mt-5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span>{t("welcome_privacy", lang)}</span>
            </div>
          </motion.div>
        ) : (
          // Authentic Google Identity OAuth Screen
          <div className="flex flex-col items-center w-full max-w-[450px]">
            <motion.div
              key="google-chooser"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className="w-full bg-white text-[#202124] border border-[#dadce0] rounded-lg p-10 shadow-[0_4px_16px_rgba(0,0,0,0.08)] relative overflow-hidden font-sans"
            >
              {/* Google Brand Logo */}
              <div className="flex flex-col items-center text-center space-y-4 pb-4">
                <div className="flex justify-center mb-2">
                  <svg className="w-11 h-11" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-normal text-[#202124] tracking-tight">{t("google_oauth_title", lang)}</h2>
                  <p className="text-base text-[#5f6368] mt-1.5">
                    {t("google_oauth_subtitle", lang)}
                  </p>
                </div>
              </div>

              {/* List of Accounts */}
              {!showCustomInput ? (
                <div className="mt-4">
                  {/* Account List Items */}
                  <div className="divide-y divide-[#dadce0] border-y border-[#dadce0]">
                    {googleAccounts.map((acc) => (
                      <button
                        onClick={() => handleSelectAccount(acc.email, acc.name)}
                        key={acc.email}
                        className="w-full flex items-center py-3.5 px-2 hover:bg-[#f8f9fa] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 w-full min-w-0">
                          {/* Circle Avatar matching Google OAuth styling */}
                          <div className="w-8 h-8 rounded-full bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                            {acc.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#3c4043] truncate">{acc.name}</p>
                            <p className="text-xs text-[#5f6368] truncate">{acc.email}</p>
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Use Another Account Button */}
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="w-full flex items-center py-3.5 px-2 hover:bg-[#f8f9fa] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-[#5f6368] shrink-0 border border-[#dadce0]">
                          <User className="w-4 h-4 text-[#5f6368]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1a73e8]">{t("google_oauth_use_another", lang)}</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Cancel / Back Button */}
                  <div className="mt-8 flex justify-between items-center">
                    <button
                      onClick={() => setShowGoogleChooser(false)}
                      className="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] px-3 py-1.5 rounded transition-all"
                    >
                      {t("google_oauth_back", lang)}
                    </button>
                  </div>
                </div>
              ) : (
                // Custom Email Input Form conforming to Google Sign-In layout
                <form onSubmit={handleCustomSubmit} className="mt-6 space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label htmlFor="google_email_input" className="text-xs font-semibold text-[#5f6368] block">
                        {t("google_oauth_custom_email_placeholder", lang)}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded border border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white text-sm text-[#202124] focus:outline-none transition-all"
                        id="google_email_input"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label htmlFor="google_name_input" className="text-xs font-semibold text-[#5f6368] block">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Alex Johnson"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded border border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white text-sm text-[#202124] focus:outline-none transition-all"
                        id="google_name_input"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-sm font-medium text-[#1a73e8] hover:text-[#1557b0] py-2 px-3 rounded transition-all"
                    >
                      {t("google_oauth_back", lang)}
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-semibold px-6 py-2 rounded shadow-sm transition-all"
                    >
                      {t("google_oauth_next", lang)}
                    </button>
                  </div>
                </form>
              )}

              {/* Google Disclaimer details */}
              <div className="text-xs text-[#5f6368] mt-8 leading-relaxed">
                Щоб продовжити, Google надасть ваші ім’я, електронну адресу, мовні налаштування та зображення профілю додатку Glucosaur. Перед використанням додатка ознайомтеся з його{" "}
                <span className="text-[#1a73e8] cursor-pointer hover:underline">політикою конфіденційності</span> та{" "}
                <span className="text-[#1a73e8] cursor-pointer hover:underline">умовами використання</span>.
              </div>
            </motion.div>

            {/* Google OAuth footer containing standard links & language selector */}
            <div className="w-full flex justify-between items-center mt-3 px-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === "uk" ? "Українська" : "English"}</span>
              </div>
              <div className="flex gap-4">
                <span className="hover:underline cursor-pointer">Довідка</span>
                <span className="hover:underline cursor-pointer">Конфіденційність</span>
                <span className="hover:underline cursor-pointer">Умови</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
