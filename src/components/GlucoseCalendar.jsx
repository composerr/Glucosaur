import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { getDateLocale } from "@/lib/dateLocale";
import { t, getMeasurementTimeLabel } from "@/lib/i18n";
import GlucoseStatusBadge from "@/components/GlucoseStatusBadge";

export default function GlucoseCalendar({ readings, settings, lang }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const locale = getDateLocale(lang);

  // Group readings by date
  const readingsByDay = {};
  readings.forEach(r => {
    const dayKey = format(new Date(r.date), "yyyy-MM-dd");
    if (!readingsByDay[dayKey]) readingsByDay[dayKey] = [];
    readingsByDay[dayKey].push(r);
  });

  function getDayAvg(date) {
    const key = format(date, "yyyy-MM-dd");
    const dayReadings = readingsByDay[key];
    if (!dayReadings || dayReadings.length === 0) return null;
    return dayReadings.reduce((s, r) => s + r.value, 0) / dayReadings.length;
  }

  function getDayColor(date) {
    const avg = getDayAvg(date);
    if (avg === null) return "";
    if (avg < settings.target_glucose_min) return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    if (avg > settings.target_glucose_max) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
  }

  const selectedDayReadings = readingsByDay[format(selectedDate, "yyyy-MM-dd")] || [];
  const weekDays = lang === "uk"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
    : lang === "de"
    ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    : lang === "fr"
    ? ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]
    : lang === "es"
    ? ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale })}
        </span>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Calendar grid */}
      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const inMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const colorClass = getDayColor(day);
            const avg = getDayAvg(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square rounded-lg text-xs font-medium transition-all relative ${
                  isSelected ? "ring-2 ring-primary" : ""
                } ${colorClass || (inMonth ? "hover:bg-muted text-foreground" : "text-muted-foreground/30")} ${
                  isToday && !isSelected ? "border border-primary/50" : ""
                }`}
              >
                {format(day, "d")}
                {avg !== null && (
                  <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-current opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-900/40" />{t("dash_in_range", lang)}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100 dark:bg-amber-900/40" />{t("dash_below", lang)}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-100 dark:bg-red-900/40" />{t("dash_above", lang)}</span>
      </div>

      {/* Selected day readings */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <p className="text-sm font-semibold text-foreground mb-3 capitalize">
          {format(selectedDate, "EEEE, d MMMM", { locale })}
        </p>
        {selectedDayReadings.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("glucose_no_readings_day", lang)}</p>
        ) : (
          <div className="space-y-2">
            {selectedDayReadings.map(r => (
              <div key={r.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{r.value} {settings.glucose_unit}</span>
                  <GlucoseStatusBadge value={r.value} min={settings.target_glucose_min} max={settings.target_glucose_max} lang={lang} />
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">{getMeasurementTimeLabel(r.measurement_time, lang)}</span>
                  <span className="text-xs text-muted-foreground block">{format(new Date(r.date), "HH:mm")}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground">
              {t("glucose_avg_day", lang)}: <span className="font-semibold text-foreground">
                {(selectedDayReadings.reduce((s, r) => s + r.value, 0) / selectedDayReadings.length).toFixed(1)} {settings.glucose_unit}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}