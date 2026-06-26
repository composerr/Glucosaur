import { subDays, format } from "date-fns";

export function computeAchievements({ readings = [], meals = [], medLogs = [], lang }) {
  const uk = lang === "uk";
  const badges = [];

  // 1. First glucose reading
  if (readings.length > 0) {
    badges.push({ id: "first_glucose", emoji: "🩸", title: uk ? "Перший запис" : "First Reading", desc: uk ? "Ти зробив перший запис глюкози!" : "You logged your first reading!", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40" });
  }

  // Streak calculation
  const dailyReadings = new Set(readings.map(r => format(new Date(r.date), "yyyy-MM-dd")));
  let streakDays = 0;
  for (let i = 0; i < 90; i++) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (dailyReadings.has(day)) streakDays++;
    else break;
  }

  if (streakDays >= 7) badges.push({ id: "streak_7", emoji: "🔥", title: uk ? "7 днів поспіль" : "7-Day Streak", desc: uk ? "Ти вимірював цукор 7 днів підряд!" : "You tracked glucose 7 days in a row!", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/40" });
  if (streakDays >= 14) badges.push({ id: "streak_14", emoji: "⚡", title: uk ? "2 тижні поспіль" : "2-Week Streak", desc: uk ? "14 днів без пропусків — неймовірно!" : "14 days without missing — incredible!", color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/40" });
  if (streakDays >= 30) badges.push({ id: "streak_30", emoji: "💎", title: uk ? "Місяць поспіль" : "30-Day Streak", desc: uk ? "Цілий місяць вимірювань — ти легенда!" : "A full month of readings — legendary!", color: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/40" });

  if (readings.length >= 30) badges.push({ id: "readings_30", emoji: "📊", title: uk ? "30 вимірів" : "30 Readings", desc: uk ? "Більше 30 записів — ти справжній профі!" : "30+ readings — you're a pro!", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/40" });
  if (readings.length >= 100) badges.push({ id: "readings_100", emoji: "🏆", title: uk ? "100 вимірів!" : "100 Readings!", desc: uk ? "Сотня вимірів — ти чемпіон!" : "A hundred readings — you're a champion!", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40" });
  if (readings.length >= 500) badges.push({ id: "readings_500", emoji: "👑", title: uk ? "500 вимірів!!" : "500 Readings!!", desc: uk ? "Півтисячі вимірів — королівський рівень!" : "500 readings — royal status!", color: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700/40" });

  if (meals.length > 0) badges.push({ id: "first_meal", emoji: "🥗", title: uk ? "Перша їжа" : "First Meal", desc: uk ? "Ти записав свій перший прийом їжі!" : "You logged your first meal!", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/40" });
  if (meals.length >= 10) badges.push({ id: "meals_10", emoji: "🍽", title: uk ? "10 записів їжі" : "10 Meal Logs", desc: uk ? "10 прийомів їжі записано — молодець!" : "10 meals logged — well done!", color: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/40" });
  if (meals.length >= 50) badges.push({ id: "meals_50", emoji: "🍳", title: uk ? "50 записів їжі" : "50 Meal Logs", desc: uk ? "50 прийомів — ти справжній кулінар!" : "50 meals — you're a real foodie!", color: "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700/40" });

  if (medLogs.length > 0) badges.push({ id: "first_med", emoji: "💊", title: uk ? "Перші ліки" : "First Meds", desc: uk ? "Ти відмітив прийом ліків — молодець!" : "You logged your first medication!", color: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700/40" });

  const takenLogs = medLogs.filter(m => m.taken);
  if (takenLogs.length >= 10) badges.push({ id: "meds_10", emoji: "💉", title: uk ? "10 прийомів ліків" : "10 Meds Taken", desc: uk ? "10 разів прийняв ліки — дисципліна!" : "10 doses taken — disciplined!", color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/40" });
  if (takenLogs.length >= 30) badges.push({ id: "meds_30", emoji: "🩺", title: uk ? "30 днів прийому" : "30 Days of Meds", desc: uk ? "Місяць регулярного прийому ліків!" : "A month of regular medication!", color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/40" });

  // In-range percentage
  if (readings.length >= 7) {
    const inRangePct = (readings.filter(r => r.value >= 4.0 && r.value <= 7.8).length / readings.length) * 100;
    if (inRangePct >= 70) badges.push({ id: "week_in_range", emoji: "🎯", title: uk ? "Тиждень у нормі" : "Week In Range", desc: uk ? ">70% вимірів в цільовому діапазоні!" : ">70% of readings in target range!", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40" });
  }

  // Perfect day (glucose + meal + meds in one day)
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const hasReadingToday = readings.some(r => r.date && r.date.startsWith(todayStr));
  const hasMealToday = meals.some(m => m.date && m.date.startsWith(todayStr));
  const hasMedToday = medLogs.some(m => m.date && m.date.startsWith(todayStr) && m.taken);
  if (hasReadingToday && hasMealToday && hasMedToday) {
    badges.push({ id: "perfect_day", emoji: "🌟", title: uk ? "Ідеальний день" : "Perfect Day", desc: uk ? "Глюкоза + їжа + ліки — все записано сьогодні!" : "Glucose + meals + meds — all logged today!", color: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/40" });
  }

  return badges;
}

export default function AchievementBadges({ badges, compact = false }) {
  if (badges.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.map(b => (
          <div key={b.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${b.color}`}>
            <span>{b.emoji}</span><span>{b.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {badges.map(b => (
        <div key={b.id} className={`flex flex-col gap-1 p-3 rounded-2xl border ${b.color}`}>
          <span className="text-2xl">{b.emoji}</span>
          <p className="text-sm font-bold leading-tight">{b.title}</p>
          <p className="text-xs opacity-80 leading-snug">{b.desc}</p>
        </div>
      ))}
    </div>
  );
}