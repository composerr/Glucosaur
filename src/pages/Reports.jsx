const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { UtensilsCrossed, Mail, Cloud, Table, FileDown, Loader2 } from "lucide-react";

import { t, getMeasurementTimeLabel } from "@/lib/i18n";
import { BarChart3, TrendingUp, Target } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import MascotHint from "@/components/MascotHint";
import StatCard from "@/components/StatCard";
import { appParams } from "@/lib/app-params";

export default function Reports({ settings }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const lang = settings.language;
  const [meds, setMeds] = useState([]);
  const [meals, setMeals] = useState([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [exportingSheets, setExportingSheets] = useState(false);
  const [backingUpDrive, setBackingUpDrive] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function handleExportSheets() {
    const token = appParams.token;
    if (!token) {
      toast.error(lang === "uk" ? "Будь ласка, авторизуйтесь через Google" : "Please authenticate with Google");
      return;
    }

    setExportingSheets(true);
    try {
      const title = `Glucosaur Glucose Report - ${format(new Date(), "yyyy-MM-dd")}`;
      const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            title: title
          }
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const sheetData = await res.json();
      const spreadsheetId = sheetData.spreadsheetId;
      const spreadsheetUrl = sheetData.spreadsheetUrl;

      const headers = ["Date", "Time", "Glucose Value", "Unit", "Measurement Time", "Notes"];
      const rows = [...filtered]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(r => [
          format(new Date(r.date), "yyyy-MM-dd"),
          format(new Date(r.date), "HH:mm"),
          r.value,
          settings.glucose_unit,
          getMeasurementTimeLabel(r.measurement_time, lang),
          r.notes || ""
        ]);

      const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [headers, ...rows]
        })
      });

      if (!appendRes.ok) {
        throw new Error(await appendRes.text());
      }

      toast.success(
        lang === "uk"
          ? "Звіт успішно експортовано у Google Таблиці!"
          : "Report successfully exported to Google Sheets!",
        {
          description: lang === "uk" ? "Таблицю створено у вашому Google Диску" : "Spreadsheet created in your Google Drive",
          action: {
            label: lang === "uk" ? "Відкрити" : "Open",
            onClick: () => window.open(spreadsheetUrl, "_blank")
          }
        }
      );
    } catch (err) {
      console.error(err);
      toast.error(lang === "uk" ? "Помилка при збереженні таблиці" : "Error exporting to Sheets");
    } finally {
      setExportingSheets(false);
    }
  }

  async function handleBackupDrive() {
    const token = appParams.token;
    if (!token) {
      toast.error(lang === "uk" ? "Будь ласка, авторизуйтесь через Google" : "Please authenticate with Google");
      return;
    }

    setBackingUpDrive(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const isUk = lang === "uk";
      let y = 15;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("GlucoVita — " + (isUk ? "Звіт лікарю" : "Doctor Report"), 15, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text((isUk ? "Дата: " : "Date: ") + format(new Date(), "dd.MM.yyyy"), 15, y);
      y += 5;
      doc.text((isUk ? "Період: " : "Period: ") + period + (isUk ? " днів" : " days"), 15, y);
      y += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(isUk ? "Статистика" : "Summary", 15, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${isUk ? "Середнє" : "Average"}: ${avg} ${settings.glucose_unit}`, 15, y); y += 5;
      doc.text(`${isUk ? "Вимірів" : "Readings"}: ${filtered.length}`, 15, y); y += 5;
      doc.text(`${isUk ? "У нормі" : "In range"}: ${inRangePct}%`, 15, y); y += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(isUk ? "Виміри глюкози" : "Glucose Readings", 15, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(isUk ? "Дата" : "Date", 15, y);
      doc.text(isUk ? "Показник" : "Value", 55, y);
      doc.text(isUk ? "Час" : "Time", 85, y);
      doc.text(isUk ? "Нотатки" : "Notes", 110, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      [...filtered].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 40).forEach(r => {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.text(format(new Date(r.date), "dd.MM.yyyy"), 15, y);
        doc.text(`${r.value} ${settings.glucose_unit}`, 55, y);
        doc.text(format(new Date(r.date), "HH:mm"), 85, y);
        if (r.notes) doc.text(r.notes.substring(0, 40), 110, y);
        y += 5;
      });

      const pdfBlob = doc.output('blob');

      const metadata = {
        name: `Glucosaur_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`,
        mimeType: 'application/pdf'
      };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', pdfBlob);

      const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      if (!driveRes.ok) {
        throw new Error(await driveRes.text());
      }

      toast.success(
        lang === "uk"
          ? "Звіт успішно збережено на вашому Google Диску!"
          : "Report successfully saved to your Google Drive!"
      );
    } catch (err) {
      console.error(err);
      toast.error(lang === "uk" ? "Помилка збереження на Google Диск" : "Error saving to Google Drive");
    } finally {
      setBackingUpDrive(false);
    }
  }

  async function loadData() {
    const [data, medLogs, mealData] = await Promise.all([
      db.entities.GlucoseReading.list("-date", 200),
      db.entities.MedicationLog.list("-date", 100),
      db.entities.MealLog.list("-date", 200),
    ]);
    setReadings(data);
    setMeds(medLogs);
    setMeals(mealData);
    setLoading(false);
  }

  function exportCSV() {
    const headers = ["Date", "Time", "Value", "Unit", "Measurement Time", "Notes"];
    const rows = [...filtered]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(r => [
        format(new Date(r.date), "yyyy-MM-dd"),
        format(new Date(r.date), "HH:mm"),
        r.value,
        settings.glucose_unit,
        getMeasurementTimeLabel(r.measurement_time, lang),
        (r.notes || "").replace(/"/g, '""'),
      ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glucosaur-glucose-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(lang === "uk" ? "CSV завантажено" : "CSV downloaded");
  }

  function exportPDF() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const isUk = lang === "uk";
    let y = 15;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("GlucoVita — " + (isUk ? "Звіт лікарю" : "Doctor Report"), 15, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text((isUk ? "Дата: " : "Date: ") + format(new Date(), "dd.MM.yyyy"), 15, y);
    y += 5;
    doc.text((isUk ? "Період: " : "Period: ") + period + (isUk ? " днів" : " days"), 15, y);
    y += 8;

    // Stats
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(isUk ? "Статистика" : "Summary", 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${isUk ? "Середнє" : "Average"}: ${avg} ${settings.glucose_unit}`, 15, y); y += 5;
    doc.text(`${isUk ? "Вимірів" : "Readings"}: ${filtered.length}`, 15, y); y += 5;
    doc.text(`${isUk ? "У нормі" : "In range"}: ${inRangePct}%`, 15, y); y += 8;

    // Glucose readings table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(isUk ? "Виміри глюкози" : "Glucose Readings", 15, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(isUk ? "Дата" : "Date", 15, y);
    doc.text(isUk ? "Показник" : "Value", 55, y);
    doc.text(isUk ? "Час" : "Time", 85, y);
    doc.text(isUk ? "Нотатки" : "Notes", 110, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    [...filtered].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 40).forEach(r => {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.text(format(new Date(r.date), "dd.MM.yyyy"), 15, y);
      doc.text(`${r.value} ${settings.glucose_unit}`, 55, y);
      doc.text(format(new Date(r.date), "HH:mm"), 85, y);
      if (r.notes) doc.text(r.notes.substring(0, 40), 110, y);
      y += 5;
    });

    // Medications
    const recentMeds = meds.filter(m => new Date(m.date) >= subDays(new Date(), period));
    if (recentMeds.length > 0) {
      y += 5;
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(isUk ? "Прийом ліків" : "Medication Logs", 15, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(isUk ? "Дата" : "Date", 15, y);
      doc.text(isUk ? "Назва" : "Name", 55, y);
      doc.text(isUk ? "Статус" : "Status", 130, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      recentMeds.slice(0, 30).forEach(m => {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.text(format(new Date(m.date), "dd.MM.yyyy HH:mm"), 15, y);
        doc.text(m.medication_name.substring(0, 30), 55, y);
        doc.text(m.taken ? (isUk ? "Прийнято" : "Taken") : (isUk ? "Пропущено" : "Missed"), 130, y);
        y += 5;
      });
    }

    doc.save(`glucovita-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }

  function sendEmail() {
    if (!doctorEmail || !doctorEmail.includes("@")) {
      toast.error(t("reports_email_error", lang));
      return;
    }
    const isUk = lang === "uk";
    const subject = isUk ? "Звіт про рівень глюкози — Glucosaur" : "Glucose Report — Glucosaur";
    const lines = [
      isUk ? "Звіт лікарю" : "Doctor Report",
      `${isUk ? "Дата" : "Date"}: ${format(new Date(), "dd.MM.yyyy")}`,
      `${isUk ? "Період" : "Period"}: ${period} ${isUk ? "днів" : "days"}`,
      "",
      `${isUk ? "Середнє" : "Average"}: ${avg} ${settings.glucose_unit}`,
      `${isUk ? "Вимірів" : "Readings"}: ${filtered.length}`,
      `${isUk ? "У нормі" : "In range"}: ${inRangePct}%`,
      "",
      isUk ? "Виміри глюкози:" : "Glucose readings:",
      ...[...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30).map(r =>
        `${format(new Date(r.date), "dd.MM.yyyy HH:mm")} — ${r.value} ${settings.glucose_unit} (${getMeasurementTimeLabel(r.measurement_time, lang)})${r.notes ? " — " + r.notes : ""}`
      ),
    ];
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(doctorEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.open(gmailUrl, "_blank");
    setEmailOpen(false);
    setDoctorEmail("");
    toast.success(t("reports_email_sent", lang));
  }

  const cutoff = subDays(new Date(), period);
  const filtered = readings.filter(r => new Date(r.date) >= cutoff);
  const avg = filtered.length > 0
    ? (filtered.reduce((s, r) => s + r.value, 0) / filtered.length).toFixed(1)
    : "—";
  const inRange = filtered.filter(r => r.value >= settings.target_glucose_min && r.value <= settings.target_glucose_max);
  const inRangePct = filtered.length > 0 ? Math.round((inRange.length / filtered.length) * 100) : 0;

  const chartData = [...filtered]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(r => ({
      date: format(new Date(r.date), "MM/dd"),
      time: format(new Date(r.date), "HH:mm"),
      value: r.value,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const periods = [
    { days: 7, label: t("reports_7day", lang) },
    { days: 14, label: t("reports_14day", lang) },
    { days: 30, label: t("reports_30day", lang) },
  ];

  return (
    <div className="space-y-5">
      <MascotHint
        show={settings.show_mascot !== false}
        lang={lang}
        ukText="🦖 Тут твої звіти з рівня цукру. Можна переглянути графіки та завантажити PDF для лікаря! 📊"
        enText="🦖 Here are your glucose reports! Check the charts and download a PDF for your doctor. 📊"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-foreground">{t("reports_title", lang)}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEmailOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>{t("reports_email", lang)}</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handleExportSheets}
            disabled={exportingSheets}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exportingSheets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
            <span>{lang === "uk" ? "Таблиці" : "Sheets"}</span>
          </button>
          <button
            onClick={handleBackupDrive}
            disabled={backingUpDrive}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {backingUpDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            <span>{lang === "uk" ? "Диск" : "Drive"}</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {periods.map((p) => (
          <button
            key={p.days}
            onClick={() => setPeriod(p.days)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === p.days
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={TrendingUp} label={t("reports_avg", lang)} value={avg} unit={settings.glucose_unit} />
        <StatCard icon={BarChart3} label={t("reports_readings_count", lang)} value={filtered.length} />
        <StatCard icon={Target} label={t("reports_in_range_pct", lang)} value={`${inRangePct}%`} />
      </div>

      {/* Nutrition Analysis */}
      {(() => {
        const filteredMeals = meals.filter(m => new Date(m.date) >= cutoff);
        if (filteredMeals.length === 0) return null;
        const totalCarbs = filteredMeals.reduce((s, m) => s + (m.carbs_grams || 0), 0);
        const totalCals = filteredMeals.reduce((s, m) => s + (m.calories || 0), 0);
        const avgCarbs = (totalCarbs / filteredMeals.length).toFixed(0);
        const avgCals = (totalCals / filteredMeals.length).toFixed(0);
        // Targets: carbs <45g/meal, cals <500/meal for diabetics
        const carbsOk = parseFloat(avgCarbs) <= 45;
        const calsOk = parseFloat(avgCals) <= 500;
        const conclusionUk = carbsOk && calsOk
          ? `В цей період твоє харчування відповідає рекомендаціям для діабетиків. Так тримати!`
          : `${!carbsOk ? `Середнє споживання вуглеводів (${avgCarbs}г) перевищує рекомендоване (до 45г на прийом). ` : ''}${!calsOk ? `Калорійність завищена за рекомендований показник.` : ''}`;
        const conclusionEn = carbsOk && calsOk
          ? `Your nutrition in this period meets diabetic recommendations. Keep it up!`
          : `${!carbsOk ? `Average carbs (${avgCarbs}g) exceed the recommended limit (45g per meal). ` : ''}${!calsOk ? `Calorie intake is above recommended levels.` : ''}`;
        return (
          <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{lang === "uk" ? "Аналіз харчування" : "Nutrition Analysis"}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">{lang === "uk" ? "Прийомів" : "Meals"}</p>
                <p className="text-lg font-bold text-foreground">{filteredMeals.length}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${carbsOk ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <p className="text-xs text-muted-foreground mb-0.5">{lang === "uk" ? "Сер. вугл." : "Avg Carbs"}</p>
                <p className={`text-lg font-bold ${carbsOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{avgCarbs}g</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${calsOk ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                <p className="text-xs text-muted-foreground mb-0.5">{lang === "uk" ? "Сер. ккал" : "Avg kcal"}</p>
                <p className={`text-lg font-bold ${calsOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{avgCals}</p>
              </div>
            </div>
            <div className={`rounded-xl px-3 py-2.5 text-sm ${carbsOk && calsOk ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'}`}>
              {lang === "uk" ? conclusionUk : conclusionEn}
            </div>
          </div>
        );
      })()}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">{t("reports_trend", lang)}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <ReferenceLine y={settings.target_glucose_min} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" />
              <ReferenceLine y={settings.target_glucose_max} stroke="hsl(var(--chart-1))" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState icon={BarChart3} message={t("general_no_data", lang)} />
      )}
      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("reports_email", lang)}</DialogTitle>
          </DialogHeader>
          <Input
            type="email"
            placeholder={t("reports_email_placeholder", lang)}
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
            className="rounded-xl"
          />
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={sendEmail} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
              <Mail className="w-4 h-4 mr-2" />
              {t("reports_email_send", lang)}
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setEmailOpen(false)}>
              {t("general_cancel", lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}