const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { Droplets, UtensilsCrossed, Pill, TrendingUp, Plus, GlassWater, ChevronDown, ChevronUp } from "lucide-react";
import { t } from "@/lib/i18n";
import StatCard from "@/components/StatCard";
import Glucosaur from "@/components/Glucosaur";
import GlucoseStatusBadge from "@/components/GlucoseStatusBadge";
import { format, startOfDay, subDays } from "date-fns";
import AchievementBadges, { computeAchievements } from "@/components/AchievementBadges";
import { getDateLocale } from "@/lib/dateLocale";

const WATER_STORAGE_KEY = "glucosaur_water_today";
const TIPS_UK = [
  "Ходьба 10 хвилин після їжі знижує рівень цукру на 20–30%.",
  "Пийте воду замість солодких напоїв — це простий крок до стабільного цукру.",
  "Стрес підвищує глюкозу. 5 хвилин глибокого дихання допоможуть.",
  "Їжте повільно — мозку потрібно 20 хвилин, щоб зрозуміти насичення.",
  "Сон 7–8 годин покращує чутливість до інсуліну.",
  "Додайте клітковину (овочі, бобові) — вона уповільнює засвоєння цукру.",
  "Регулярний вимір глюкози — основа успішного контролю діабету.",
  "Уникайте пропускання сніданку — це може призвести до переїдання ввечері.",
  "Цільне зерно замість білого хліба — простий спосіб знизити ГІ раціону.",
  "Ведення щоденника харчування допомагає помітити продукти, що підвищують цукор.",
];
const TIPS_EN = [
  "Walking 10 minutes after meals lowers blood sugar by 20–30%.",
  "Drink water instead of sugary drinks — a simple step to stable blood sugar.",
  "Stress raises glucose. 5 minutes of deep breathing helps.",
  "Eat slowly — your brain needs 20 minutes to recognize fullness.",
  "7–8 hours of sleep improves insulin sensitivity.",
  "Add fiber (vegetables, legumes) — it slows sugar absorption.",
  "Regular glucose monitoring is the foundation of successful diabetes control.",
  "Don't skip breakfast — it can lead to overeating in the evening.",
  "Whole grains instead of white bread — an easy way to lower dietary GI.",
  "Keeping a food diary helps identify foods that spike your sugar.",
];

function getWaterData() {
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const data = JSON.parse(localStorage.getItem(WATER_STORAGE_KEY) || "{}");
    if (data.date !== today) return { date: today, glasses: 0 };
    return data;
  } catch { return { date: format(new Date(), "yyyy-MM-dd"), glasses: 0 }; }
}

function saveWaterData(data) {
  localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(data));
}

export default function Dashboard({ settings }) {
  const [readings, setReadings] = useState([]);
  const [mealsToday, setMealsToday] = useState(0);
  const [medsToday, setMedsToday] = useState(0);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waterData, setWaterData] = useState(getWaterData());
  const [tipsExpanded, setTipsExpanded] = useState(false);
  const lang = settings.language;

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const allReadings = await db.entities.GlucoseReading.list("-date", 200);
    setReadings(allReadings);
    const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
    const meals = await db.entities.MealLog.list("-date", 200);
    setMealsToday(meals.filter(m => m.date && m.date.startsWith(todayStr)).length);
    const medLogs = await db.entities.MedicationLog.list("-date", 200);
    setMedsToday(medLogs.filter(m => m.date && m.date.startsWith(todayStr) && m.taken).length);
    setBadges(computeAchievements({ readings: allReadings, meals, medLogs, lang: settings.language }));
    setLoading(false);
  }

  function toggleGlass(index) {
    const newGlasses = waterData.glasses >= index + 1 ? index : index + 1;
    const updated = { ...waterData, glasses: newGlasses };
    setWaterData(updated);
    saveWaterData(updated);
  }

  function resetWater() {
    const updated = { date: format(new Date(), "yyyy-MM-dd"), glasses: 0 };
    setWaterData(updated);
    saveWaterData(updated);
  }

  const latest = readings[0];
  const sevenDaysAgo = subDays(new Date(), 7);
  const recentReadings = readings.filter(r => new Date(r.date) >= sevenDaysAgo);
  const avg7 = recentReadings.length > 0
    ? (recentReadings.reduce((s, r) => s + r.value, 0) / recentReadings.length).toFixed(1)
    : "—";
  const tips = lang === "uk" ? TIPS_UK : TIPS_EN;
  const dateLocale = getDateLocale(lang);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("dash_welcome", lang)}</h1>
          <p className="text-sm text-muted-foreground capitalize">{format(new Date(), "EEEE, d MMMM", { locale: dateLocale })}</p>
        </div>
        <Link to="/glucose" className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Mascot greeting */}
      {settings.show_mascot !== false && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 px-4 py-3">
          <Glucosaur size={52} />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {lang === "uk"
              ? "Привіт! Я Глюкозавр 🦖 Стежу за твоїм рівнем цукру кожен день!"
              : "Hi! I'm Glucosaur 🦖 I help track your sugar every day!"}
          </p>
        </div>
      )}

      {/* Latest Reading Hero */}
      {latest ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 border border-border/50 p-5">
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-medium mb-1">{t("dash_latest_reading", lang)}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground tracking-tight">{latest.value}</span>
              <span className="text-sm text-muted-foreground">{settings.glucose_unit}</span>
            </div>
            <div className="mt-2">
              <GlucoseStatusBadge value={latest.value} min={settings.target_glucose_min} max={settings.target_glucose_max} lang={lang} />
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-primary/5 dark:bg-primary/10" />
        </div>
      ) : (
        <div className="rounded-2xl bg-muted/50 border border-border/50 p-5 text-center">
          <Droplets className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("dash_no_readings", lang)}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label={t("dash_avg_7day", lang)} value={avg7} unit={settings.glucose_unit} />
        <StatCard icon={Droplets} label={t("reports_readings_count", lang)} value={recentReadings.length} />
        <StatCard icon={UtensilsCrossed} label={t("dash_meals_today", lang)} value={mealsToday} />
        <StatCard icon={Pill} label={t("dash_meds_taken", lang)} value={medsToday} />
      </div>

      {/* Water Tracker */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GlassWater className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm font-semibold text-foreground">{t("dash_water_title", lang)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{waterData.glasses}/8 {t("dash_water_goal", lang)}</span>
            {waterData.glasses > 0 && (
              <button onClick={resetWater} className="text-xs text-muted-foreground hover:text-foreground underline">
                {t("general_cancel", lang)}
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              onClick={() => toggleGlass(i)}
              className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all text-lg ${
                i < waterData.glasses
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-700"
                  : "bg-muted text-muted-foreground border-2 border-dashed border-border hover:border-blue-300"
              }`}
            >
              💧
            </button>
          ))}
        </div>
      </div>

      {/* Achievements preview */}
      {badges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">{lang === "uk" ? "🏆 Мої досягнення" : "🏆 My Achievements"}</h2>
            <Link to="/achievements" className="text-xs text-primary font-medium">{lang === "uk" ? "Всі →" : "All →"}</Link>
          </div>
          <AchievementBadges badges={badges} compact />
        </div>
      )}

      {/* Recent Readings */}
      {readings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">{t("glucose_title", lang)}</h2>
          <div className="space-y-2">
            {readings.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-card rounded-xl border border-border/50 px-4 py-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">{r.value} {settings.glucose_unit}</span>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.date), "d MMM, HH:mm", { locale: dateLocale })}</p>
                </div>
                <GlucoseStatusBadge value={r.value} min={settings.target_glucose_min} max={settings.target_glucose_max} lang={lang} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple Steps – collapsible */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <button
          onClick={() => setTipsExpanded(!tipsExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-sm font-semibold text-foreground">{t("dash_tips_title", lang)}</h2>
          {tipsExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {tipsExpanded && (
          <div className="space-y-1.5 mt-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-bold shrink-0 mt-0.5">•</span>
                <p className="text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}