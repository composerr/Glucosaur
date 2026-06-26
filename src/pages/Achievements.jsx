const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Trophy } from "lucide-react";
import AchievementBadges, { computeAchievements } from "@/components/AchievementBadges";
import MascotHint from "@/components/MascotHint";

const ALL_POSSIBLE = [
  { id: "first_glucose", emoji: "🩸", title_uk: "Перший запис", title_en: "First Reading" },
  { id: "streak_7", emoji: "🔥", title_uk: "7 днів поспіль", title_en: "7-Day Streak" },
  { id: "streak_14", emoji: "⚡", title_uk: "2 тижні поспіль", title_en: "2-Week Streak" },
  { id: "streak_30", emoji: "💎", title_uk: "Місяць поспіль", title_en: "30-Day Streak" },
  { id: "readings_30", emoji: "📊", title_uk: "30 вимірів", title_en: "30 Readings" },
  { id: "readings_100", emoji: "🏆", title_uk: "100 вимірів!", title_en: "100 Readings!" },
  { id: "readings_500", emoji: "👑", title_uk: "500 вимірів!!", title_en: "500 Readings!!" },
  { id: "first_meal", emoji: "🥗", title_uk: "Перша їжа", title_en: "First Meal" },
  { id: "meals_10", emoji: "🍽", title_uk: "10 записів їжі", title_en: "10 Meal Logs" },
  { id: "meals_50", emoji: "🍳", title_uk: "50 записів їжі", title_en: "50 Meal Logs" },
  { id: "first_med", emoji: "💊", title_uk: "Перші ліки", title_en: "First Meds" },
  { id: "meds_10", emoji: "💉", title_uk: "10 прийомів ліків", title_en: "10 Meds Taken" },
  { id: "meds_30", emoji: "🩺", title_uk: "30 днів прийому", title_en: "30 Days of Meds" },
  { id: "water_7", emoji: "💧", title_uk: "Водний тиждень", title_en: "Water Week" },
  { id: "recipes_viewed", emoji: "📖", title_uk: "5 рецептів переглянуто", title_en: "5 Recipes Viewed" },
  { id: "reminders_set", emoji: "🔔", title_uk: "Нагадування налаштовано", title_en: "Reminders Set" },
  { id: "perfect_day", emoji: "🌟", title_uk: "Ідеальний день", title_en: "Perfect Day" },
  { id: "report_downloaded", emoji: "📄", title_uk: "Звіт збережено", title_en: "Report Saved" },
  { id: "week_in_range", emoji: "🎯", title_uk: "Тиждень у нормі", title_en: "Week In Range" },
];

export default function Achievements({ settings }) {
  const lang = settings.language;
  const uk = lang === "uk";
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [readings, meals, medLogs] = await Promise.all([
        db.entities.GlucoseReading.list("-date", 500),
        db.entities.MealLog.list("-date", 500),
        db.entities.MedicationLog.list("-date", 500),
      ]);
      setBadges(computeAchievements({ readings, meals, medLogs, lang }));
      setLoading(false);
    }
    load();
  }, [lang]);

  const earnedIds = new Set(badges.map(b => b.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <MascotHint show={settings.show_mascot !== false} lang={lang} ukText="🦖 Збирай бейджі за регулярне ведення щоденника! Чим більше записів — тим більше досягнень!" enText="🦖 Collect badges for keeping your health diary! The more you log, the more you earn!" />
      <h1 className="text-xl font-bold text-foreground">{uk ? "🏆 Досягнення" : "🏆 Achievements"}</h1>

      {/* Earned */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{uk ? `Отримані (${badges.length})` : `Earned (${badges.length})`}</p>
        {badges.length === 0 ? (
          <div className="text-center py-10"><Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" /><p className="text-sm text-muted-foreground">{uk ? "Поки що досягнень немає — почни вести щоденник!" : "No achievements yet — start logging!"}</p></div>
        ) : (
          <AchievementBadges badges={badges} />
        )}
      </div>

      {/* Locked */}
      {ALL_POSSIBLE.filter(a => !earnedIds.has(a.id)).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{uk ? "Ще не отримані" : "Not yet earned"}</p>
          <div className="grid grid-cols-2 gap-3">
            {ALL_POSSIBLE.filter(a => !earnedIds.has(a.id)).map(a => (
              <div key={a.id} className="flex flex-col gap-1 p-3 rounded-2xl border border-border/40 bg-muted/30 opacity-50">
                <span className="text-2xl grayscale">{a.emoji}</span>
                <p className="text-sm font-bold text-muted-foreground">{uk ? a.title_uk : a.title_en}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}