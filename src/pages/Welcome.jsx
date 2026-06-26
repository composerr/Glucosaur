import { motion } from "framer-motion";
import Glucosaur from "@/components/Glucosaur";
import { t } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { Shield, Droplets, UtensilsCrossed, Pill, BarChart3 } from "lucide-react";

const SUPPORTED = ["en", "uk", "de", "fr", "es"];

function detectLang() {
  const bl = (navigator.language || "en").slice(0, 2).toLowerCase();
  return SUPPORTED.includes(bl) ? bl : "en";
}

export default function Welcome() {
  const { navigateToLogin } = useAuth();
  const lang = detectLang();

  const features = [
    { icon: Droplets, key: "welcome_feat_glucose" },
    { icon: UtensilsCrossed, key: "welcome_feat_meals" },
    { icon: Pill, key: "welcome_feat_meds" },
    { icon: BarChart3, key: "welcome_feat_reports" },
  ];

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-sm w-full"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Glucosaur size={120} />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mt-6">{t("welcome_title", lang)}</h1>
        <p className="text-base text-primary font-medium mt-1">{t("welcome_subtitle", lang)}</p>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{t("welcome_description", lang)}</p>

        <div className="grid grid-cols-4 gap-3 mt-6 w-full">
          {features.map(({ icon: Icon, key }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{t(key, lang)}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigateToLogin()}
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
    </div>
  );
}