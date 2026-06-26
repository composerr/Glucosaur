const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileSelect from "@/components/MobileSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { LogOut, Trash2, AlertTriangle, Shield, Droplets, UtensilsCrossed, Pill, BarChart3, ChefHat, Search, Lightbulb, ShoppingBag, Bell, Trophy } from "lucide-react";

const TAB_CONFIG = [
  { key: "tab_glucose", labelKey: "nav_glucose", icon: Droplets },
  { key: "tab_meals", labelKey: "nav_meals", icon: UtensilsCrossed },
  { key: "tab_medications", labelKey: "nav_medications", icon: Pill },
  { key: "tab_reports", labelKey: "nav_reports", icon: BarChart3 },
  { key: "tab_recipes", labelKey: "nav_recipes", icon: ChefHat },
  { key: "tab_glycemic", labelKey: "nav_glycemic", icon: Search },
  { key: "tab_tips", labelKey: "nav_tips", icon: Lightbulb },
  { key: "tab_stores", labelKey: "nav_stores", icon: ShoppingBag },
  { key: "tab_reminders", labelKey: "nav_reminders", icon: Bell },
  { key: "tab_achievements", labelKey: "nav_achievements", icon: Trophy },
];

export default function SettingsPage({ settings, updateSettings }) {
  const { logout } = useAuth();
  const [form, setForm] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const lang = form.language;

  async function handleSave() {
    setSaving(true);
    await updateSettings({
      language: form.language,
      theme: form.theme,
      glucose_unit: form.glucose_unit,
      target_glucose_min: parseFloat(form.target_glucose_min),
      target_glucose_max: parseFloat(form.target_glucose_max),
      tab_glucose: form.tab_glucose !== false,
      tab_meals: form.tab_meals !== false,
      tab_medications: form.tab_medications !== false,
      tab_reports: form.tab_reports !== false,
      tab_recipes: !!form.tab_recipes,
      tab_glycemic: !!form.tab_glycemic,
      tab_tips: !!form.tab_tips,
      tab_stores: form.tab_stores !== false,
      tab_reminders: form.tab_reminders !== false,
      tab_achievements: form.tab_achievements !== false,
      sidebar_tab_recipes: !!form.sidebar_tab_recipes,
      sidebar_tab_glycemic: !!form.sidebar_tab_glycemic,
      sidebar_tab_tips: !!form.sidebar_tab_tips,
      sidebar_tab_stores: form.sidebar_tab_stores !== false,
      sidebar_tab_reminders: form.sidebar_tab_reminders !== false,
      sidebar_tab_achievements: form.sidebar_tab_achievements !== false,
      sidebar_tab_glucose: form.sidebar_tab_glucose !== false,
      sidebar_tab_meals: form.sidebar_tab_meals !== false,
      sidebar_tab_medications: form.sidebar_tab_medications !== false,
      sidebar_tab_reports: form.sidebar_tab_reports !== false,
      show_mascot: form.show_mascot !== false,
      nav_style: form.nav_style || "bottom",
    });
    setSaving(false);
    toast.success(t("settings_saved", lang));
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await db.entities.UserSettings.deleteMany({});
      await db.entities.GlucoseReading.deleteMany({});
      await db.entities.MealLog.deleteMany({});
      await db.entities.Medication.deleteMany({});
      await db.entities.MedicationLog.deleteMany({});
      await db.entities.Reminder.deleteMany({});
      toast.success(t("settings_delete_success", lang));
      logout(true);
    } catch {
      toast.error(t("settings_delete_error", lang));
    }
    setDeleting(false);
  }

  const navOptions = [
    { value: "bottom", labelKey: "settings_nav_bottom" },
    { value: "sidebar", labelKey: "settings_nav_sidebar" },
    { value: "both", labelKey: "settings_nav_both" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">{t("settings_title", lang)}</h1>

      {/* General */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("settings_general", lang)}</p>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings_language", lang)}</label>
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="uk">Українська</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings_theme", lang)}</label>
          <div className="flex gap-2">
            {["light", "dark"].map((th) => (
              <button
                key={th}
                onClick={() => setForm({ ...form, theme: th })}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${form.theme === th ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {th === "light" ? t("settings_light", lang) : t("settings_dark", lang)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings_glucose_unit", lang)}</label>
          <MobileSelect
            value={form.glucose_unit}
            onValueChange={(v) => setForm({ ...form, glucose_unit: v })}
            options={[
              { value: "mmol/L", label: "mmol/L" },
              { value: "mg/dL", label: "mg/dL" },
            ]}
            placeholder={t("settings_glucose_unit", lang)}
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings_target_range", lang)} ({form.glucose_unit})</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">{t("settings_min", lang)}</span>
              <Input type="number" step="0.1" value={form.target_glucose_min} onChange={(e) => setForm({ ...form, target_glucose_min: e.target.value })} className="rounded-xl mt-1" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">{t("settings_max", lang)}</span>
              <Input type="number" step="0.1" value={form.target_glucose_max} onChange={(e) => setForm({ ...form, target_glucose_max: e.target.value })} className="rounded-xl mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Style */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("settings_nav_style", lang)}
        </p>
        <div className="flex gap-2">
          {navOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setForm({ ...form, nav_style: opt.value })}
              className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                (form.nav_style || "bottom") === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t(opt.labelKey, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Nav Tabs */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("settings_bottom_tabs", lang)}
        </p>
        {TAB_CONFIG.map(({ key, labelKey, icon: Icon }) => (
          <div key={`bottom-${key}`} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
            <span className="text-sm text-foreground flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              {t(labelKey, lang)}
            </span>
            <Switch
              checked={form[key] !== false}
              onCheckedChange={(v) => setForm({ ...form, [key]: v })}
            />
          </div>
        ))}
      </div>

      {/* Sidebar Tabs */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("settings_sidebar_tabs", lang)}
        </p>
        {TAB_CONFIG.map(({ key, labelKey, icon: Icon }) => (
          <div key={`sidebar-${key}`} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
            <span className="text-sm text-foreground flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              {t(labelKey, lang)}
            </span>
            <Switch
              checked={form[`sidebar_${key}`] !== false}
              onCheckedChange={(v) => setForm({ ...form, [`sidebar_${key}`]: v })}
            />
          </div>
        ))}
      </div>

      {/* Mascot */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("settings_mascot_section", lang)}
        </p>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-foreground">🦖 {t("settings_show_mascot", lang)}</span>
          <Switch
            checked={form.show_mascot !== false}
            onCheckedChange={(v) => setForm({ ...form, show_mascot: v })}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
        {saving ? t("general_loading", lang) : t("settings_save", lang)}
      </Button>

      {/* Privacy Policy */}
      <button
        onClick={() => setPrivacyOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Shield className="w-4 h-4" />
        {t("settings_privacy_policy", lang)}
      </button>

      <button
        onClick={() => logout(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t("settings_logout", lang)}
      </button>

      {/* Delete Account */}
      <div className="bg-card rounded-2xl border border-destructive/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {t("settings_danger_zone", lang)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings_delete_warning", lang)}
        </p>
        <Button
          variant="destructive"
          className="w-full rounded-xl"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t("settings_delete_account", lang)}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings_delete_confirm_title", lang)}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("settings_delete_confirm_desc", lang)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="destructive"
              className="w-full rounded-xl"
              disabled={deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? t("general_loading", lang) : t("settings_delete_yes", lang)}
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setDeleteOpen(false)}>
              {t("general_cancel", lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{t("privacy_title", lang)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>{t("privacy_intro", lang)}</p>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">{t("privacy_sec1_title", lang)}</p>
              <p>• {t("privacy_sec1_health", lang)}</p>
              <p>• {t("privacy_sec1_account", lang)}</p>
              <p>• {t("privacy_sec1_prefs", lang)}</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">{t("privacy_sec2_title", lang)}</p>
              <p>{t("privacy_sec2_body", lang)}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">{t("privacy_sec2_never", lang)}</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">{t("privacy_sec3_title", lang)}</p>
              <p>{t("privacy_sec3_body", lang)}</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">{t("privacy_sec4_title", lang)}</p>
              <p>{t("privacy_sec4_body", lang)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setPrivacyOpen(false)}>
              {t("general_close", lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        {t("settings_version", lang)}
      </p>
    </div>
  );
}