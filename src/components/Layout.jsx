import { Link, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { useState } from "react";
import { Menu, X, ArrowLeft, User } from "lucide-react";
import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Glucosaur from "@/components/Glucosaur";
import { LayoutDashboard, Droplets, UtensilsCrossed, Pill, BarChart3, Settings, ChefHat, Search, Lightbulb, ShoppingBag, Bell } from "lucide-react";
import { t } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";

const ALL_NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, labelKey: "nav_dashboard", tabKey: null },
  { path: "/glucose", icon: Droplets, labelKey: "nav_glucose", tabKey: "tab_glucose" },
  { path: "/meals", icon: UtensilsCrossed, labelKey: "nav_meals", tabKey: "tab_meals" },
  { path: "/medications", icon: Pill, labelKey: "nav_medications", tabKey: "tab_medications" },
  { path: "/reports", icon: BarChart3, labelKey: "nav_reports", tabKey: "tab_reports" },
  { path: "/recipes", icon: ChefHat, labelKey: "nav_recipes", tabKey: "tab_recipes" },
  { path: "/glycemic", icon: Search, labelKey: "nav_glycemic", tabKey: "tab_glycemic" },
  { path: "/tips", icon: Lightbulb, labelKey: "nav_tips", tabKey: "tab_tips" },
  { path: "/stores", icon: ShoppingBag, labelKey: "nav_stores", tabKey: "tab_stores" },
  { path: "/reminders", icon: Bell, labelKey: "nav_reminders", tabKey: "tab_reminders" },
  { path: "/achievements", icon: Trophy, labelKey: "nav_achievements", tabKey: "tab_achievements" },
  { path: "/settings", icon: Settings, labelKey: "nav_settings", tabKey: null },
];

export default function Layout({ lang, settings }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navStyle = settings?.nav_style || "bottom";
  const showSidebarToggle = navStyle === "sidebar" || navStyle === "both";
  const showBottomNav = navStyle !== "sidebar";
  const isDashboard = location.pathname === "/";
  const bottomNavItems = ALL_NAV_ITEMS.filter(item => {
    if (item.tabKey === null) return true;
    return settings[item.tabKey] !== false;
  });
  const sidebarNavItems = ALL_NAV_ITEMS.filter(item => {
    if (item.tabKey === null) return true;
    return settings[`sidebar_${item.tabKey}`] !== false;
  });

  const outlet = useOutlet();
  const { pathname } = useLocation();

  // Determine slide direction: child screens slide in from right, back slides from left
  const isChildScreen = !ALL_NAV_ITEMS.some(item => item.path === pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showSidebarToggle ? (
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2.5 -ml-1 rounded-xl hover:bg-muted active:bg-muted transition-colors relative z-10"
              >
                <Menu className="w-6 h-6 text-foreground pointer-events-none" />
              </button>
            ) : !isDashboard ? (
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 -ml-1 rounded-xl hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground pointer-events-none" />
              </button>
            ) : null}
            <Glucosaur size={32} />
            <span className="text-lg font-semibold tracking-tight text-foreground">{t("app_name", lang)}</span>
          </div>
        </div>
      </header>

      {/* Content — animated page transitions */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4" style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom))" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: isChildScreen ? 30 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isChildScreen ? -30 : 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Ad Banner — above bottom nav, respects safe-area */}
      <div
        className="fixed left-0 right-0 z-40 bg-muted/60 backdrop-blur-sm border-t border-border/30 flex items-center justify-center"
        style={{ height: "50px", bottom: "calc(50px + env(safe-area-inset-bottom))" }}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-3449666742824097"
          data-ad-slot="3869858207"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script dangerouslySetInnerHTML={{ __html: "(adsbygoogle = window.adsbygoogle || []).push({});" }} />
      </div>

      {/* Bottom Nav */}
      {showBottomNav && (
        <nav
          className="fixed left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50"
          style={{ bottom: "0px", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="max-w-lg mx-auto px-2 py-1">
            <div className="flex flex-wrap justify-center gap-x-1 gap-y-0.5">
              {bottomNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                    <span className="text-[10px] font-medium whitespace-nowrap">{t(item.labelKey, lang)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Sidebar drawer */}
      {showSidebarToggle && (
        <>
          {drawerOpen && (
            <div
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
          )}

          <div
            className={`fixed top-0 left-0 z-[70] h-full w-72 bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-out ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-border/50">
              <span className="text-base font-semibold text-foreground">{t("app_name", lang)}</span>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>
            {user && (
              <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{user.name || "Glucosaur User"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
            <nav className="py-3 overflow-y-auto">
              {sidebarNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                    <span className="text-sm">{t(item.labelKey, lang)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}