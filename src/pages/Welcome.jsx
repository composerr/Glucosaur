import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Glucosaur from "@/components/Glucosaur";
import { t } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { Shield, Droplets, UtensilsCrossed, Pill, BarChart3, Loader2, Plus, Trash2, ArrowLeft, Mail, User } from "lucide-react";

const SUPPORTED = ["en", "uk", "de", "fr", "es"];

function detectLang() {
  const bl = (navigator.language || "en").slice(0, 2).toLowerCase();
  return SUPPORTED.includes(bl) ? bl : "en";
}

const pickerTranslations = {
  en: {
    choose_account: "Choose an account",
    to_continue: "to continue to Glucosaur",
    use_another: "Use another account",
    add_account: "Add account",
    email_label: "Gmail address",
    name_label: "Your name",
    next: "Next",
    back: "Back",
    only_gmail: "Only @gmail.com accounts are permitted",
    field_required: "This field is required",
    remove_account: "Remove an account",
    cancel: "Cancel",
    signing_in: "Signing in...",
    remove_confirm_hint: "Remove account from this device's list?",
    active_badge: "Signed in"
  },
  uk: {
    choose_account: "Виберіть акаунт",
    to_continue: "для переходу в Glucosaur",
    use_another: "Інший акаунт",
    add_account: "Додати акаунт",
    email_label: "Адреса Gmail",
    name_label: "Ваше ім'я",
    next: "Далі",
    back: "Назад",
    only_gmail: "Дозволені тільки акаунти @gmail.com",
    field_required: "Це поле обов'язкове",
    remove_account: "Видалити акаунт з пристрою",
    cancel: "Скасувати",
    signing_in: "Вхід...",
    remove_confirm_hint: "Видалити акаунт зі списку на цьому пристрої?",
    active_badge: "Активний"
  }
};

const AVATAR_COLORS = [
  "bg-blue-600 text-white",
  "bg-red-500 text-white",
  "bg-amber-500 text-white",
  "bg-green-600 text-white",
  "bg-purple-600 text-white",
  "bg-pink-500 text-white",
];

function getAvatarColorClass(email = "") {
  let sum = 0;
  for (let i = 0; i < email.length; i++) {
    sum += email.charCodeAt(i);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function Welcome() {
  const { loginWithGoogleAccount, isLoadingAuth, authError, setAuthError, navigateToLogin } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerStep, setPickerStep] = useState("select"); // "select" or "add"
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [localError, setLocalError] = useState("");
  const [isRemovingMode, setIsRemovingMode] = useState(false);

  const lang = detectLang();
  const pt = pickerTranslations[lang] || pickerTranslations.en;

  const [accounts, setAccounts] = useState(() => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("glucosaur_google_accounts") || "[]");
    } catch (e) {}
    
    // Pre-seed with multiple Google accounts if empty
    if (saved.length === 0) {
      saved = [
        { email: "sba30048@gmail.com", name: "sba30048" },
        { email: "user.health@gmail.com", name: "Health Profile" },
        { email: "glucosaur.tester@gmail.com", name: "Glucosaur Tester" }
      ];
      localStorage.setItem("glucosaur_google_accounts", JSON.stringify(saved));
    }
    return saved;
  });

  const features = [
    { icon: Droplets, key: "welcome_feat_glucose" },
    { icon: UtensilsCrossed, key: "welcome_feat_meals" },
    { icon: Pill, key: "welcome_feat_meds" },
    { icon: BarChart3, key: "welcome_feat_reports" },
  ];

  const handleSignInClick = () => {
    setAuthError(null);
    setLocalError("");
    setPickerStep("select");
    setShowPicker(true);
  };

  const handleSelectAccount = (account) => {
    setIsSigningIn(true);
    setTimeout(() => {
      const success = loginWithGoogleAccount(account.email, account.name);
      setIsSigningIn(false);
      if (success) {
        setShowPicker(false);
      }
    }, 800);
  };

  const handleRemoveAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const updated = accounts.filter(acc => acc.email.toLowerCase() !== emailToRemove.toLowerCase());
    setAccounts(updated);
    localStorage.setItem("glucosaur_google_accounts", JSON.stringify(updated));
    if (updated.length === 0) {
      setIsRemovingMode(false);
    }
  };

  const handleAddAccountSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (!newEmail.trim()) {
      setLocalError(pt.field_required);
      return;
    }
    if (!newEmail.toLowerCase().endsWith("@gmail.com")) {
      setLocalError(pt.only_gmail);
      return;
    }
    if (!newName.trim()) {
      setLocalError(pt.field_required);
      return;
    }

    setIsSigningIn(true);
    setTimeout(() => {
      const success = loginWithGoogleAccount(newEmail, newName);
      setIsSigningIn(false);
      if (success) {
        // Update local accounts state
        const updatedAccounts = [...accounts];
        if (!updatedAccounts.some(acc => acc.email.toLowerCase() === newEmail.toLowerCase().trim())) {
          updatedAccounts.push({ email: newEmail.toLowerCase().trim(), name: newName.trim() });
          setAccounts(updatedAccounts);
        }
        setShowPicker(false);
        setNewEmail("");
        setNewName("");
      } else {
        setLocalError(pt.only_gmail);
      }
    }, 800);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">
          {t("general_loading", lang)}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 relative"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <AnimatePresence mode="wait">
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
            {features.map(({ icon: Icon, key }) => (
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

          {authError && (
            <div className="w-full mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium text-center">
              {typeof authError === 'string' 
                ? (lang === 'uk' && authError.includes('gmail.com') ? "Тільки акаунти @gmail.com дозволені для входу." : authError)
                : (authError.message || JSON.stringify(authError))
              }
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSignInClick}
            className="w-full mt-6 flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-base shadow-lg shadow-primary/20"
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
      </AnimatePresence>

      {/* Google Account Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => !isSigningIn && setShowPicker(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden flex flex-col text-left z-10"
            >
              {/* Google Brand Header */}
              <div className="p-6 pb-4 flex flex-col items-center border-b border-border/30">
                <svg className="w-8 h-8 mb-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <h2 className="text-xl font-medium text-foreground tracking-tight">{pt.choose_account}</h2>
                <p className="text-xs text-muted-foreground mt-1 text-center">{pt.to_continue}</p>
              </div>

              {/* Loading Indicator inside Picker */}
              {isSigningIn && (
                <div className="absolute inset-0 bg-card/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground mt-2 font-medium">{pt.signing_in}</span>
                </div>
              )}

              {/* Step 1: Select Account */}
              {pickerStep === "select" && (
                <div className="flex-1 flex flex-col">
                  <div className="p-2 max-h-[260px] overflow-y-auto space-y-1">
                    {accounts.map((account) => {
                      const firstLetter = (account.name || account.email || "G").charAt(0).toUpperCase();
                      const avatarClass = getAvatarColorClass(account.email);
                      return (
                        <div
                          key={account.email}
                          onClick={() => handleSelectAccount(account)}
                          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-muted/60 active:bg-muted cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm ${avatarClass}`}>
                              {firstLetter}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-semibold text-foreground leading-tight">
                                {account.name}
                              </span>
                              <span className="text-xs text-muted-foreground leading-normal mt-0.5">
                                {account.email}
                              </span>
                            </div>
                          </div>

                          {isRemovingMode ? (
                            <button
                              onClick={(e) => handleRemoveAccount(e, account.email)}
                              className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive/80 hover:text-destructive transition-colors"
                              title={pt.remove_account}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : null}
                        </div>
                      );
                    })}

                    {/* Use Another Account Button */}
                    <button
                      onClick={() => setPickerStep("add")}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 active:bg-muted transition-colors text-primary font-medium text-sm text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span>{pt.use_another}</span>
                    </button>

                  </div>

                  {/* Picker Footer */}
                  <div className="p-4 bg-muted/30 border-t border-border/30 flex justify-between items-center text-xs">
                    {accounts.length > 0 && (
                      <button
                        onClick={() => setIsRemovingMode(!isRemovingMode)}
                        className={`font-semibold transition-colors ${isRemovingMode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {isRemovingMode ? pt.cancel : pt.remove_account}
                      </button>
                    )}
                    <button
                      onClick={() => setShowPicker(false)}
                      className="text-muted-foreground hover:text-foreground font-medium"
                    >
                      {pt.cancel}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Add Account */}
              {pickerStep === "add" && (
                <form onSubmit={handleAddAccountSubmit} className="flex-1 flex flex-col">
                  <div className="p-6 space-y-4">
                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPickerStep("select");
                        setLocalError("");
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{pt.back}</span>
                    </button>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{pt.email_label}</span>
                      </label>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                        required
                      />
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{pt.name_label}</span>
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                        required
                      />
                    </div>

                    {/* Error Alerts */}
                    {localError && (
                      <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold leading-relaxed">
                        {localError}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-muted/30 border-t border-border/30 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setPickerStep("select");
                        setLocalError("");
                      }}
                      className="text-muted-foreground hover:text-foreground font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
                    >
                      {pt.back}
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1a73e8] hover:bg-[#1557b0] active:scale-98 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-all"
                    >
                      {pt.next}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
