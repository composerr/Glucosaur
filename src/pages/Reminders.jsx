const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, BellOff, Pencil, X, Calendar, Loader2 } from "lucide-react";
import MascotHint from "@/components/MascotHint";
import MobileSelect from "@/components/MobileSelect";
import { t } from "@/lib/i18n";
import { toast } from "sonner";
import { appParams } from "@/lib/app-params";

const DAYS_UK = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const DAYS_FR = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];
const DAYS_ES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

const DEFAULT_REMINDERS = [
  { title: "Виміряти цукор перед сніданком", time: "07:00", days: [0, 1, 2, 3, 4, 5, 6], type: "glucose" },
  { title: "Кардіо-прогулянка 30 хвилин", time: "17:00", days: [0, 1, 2, 3, 4, 5, 6], type: "custom" },
  { title: "Виміряти цукор перед сном", time: "21:50", days: [0, 1, 2, 3, 4, 5, 6], type: "glucose" },
  { title: "Випити метформін", time: "22:00", days: [0, 1, 2, 3, 4, 5, 6], type: "medication" },
  { title: "Випити склянку води", time: "08:00", days: [0, 1, 2, 3, 4, 5, 6], type: "custom" },
];

const DAYS_MAP = { en: DAYS_EN, uk: DAYS_UK, de: DAYS_DE, fr: DAYS_FR, es: DAYS_ES };

export default function Reminders({ settings }) {
  const lang = settings?.language || "en";
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [permission, setPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "default");
  const [form, setForm] = useState({ title: "", type: "glucose", time: "08:00", days: [1, 2, 3, 4, 5] });
  const [exportingCalendarId, setExportingCalendarId] = useState(null);

  useEffect(() => { loadReminders(); }, []);

  async function handleExportCalendar(reminder) {
    const token = appParams.token;
    if (!token) {
      toast.error(lang === "uk" ? "Будь ласка, авторизуйтесь через Google" : "Please authenticate with Google");
      return;
    }

    setExportingCalendarId(reminder.id);
    try {
      const [hour, minute] = reminder.time.split(":");
      
      // Calculate first occurrence starting from today
      const today = new Date();
      const todayDayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
      
      let daysToAdd = 0;
      if (reminder.days && reminder.days.length > 0) {
        const sortedDays = [...reminder.days].sort((a, b) => a - b);
        const nextDay = sortedDays.find(d => d >= todayDayOfWeek);
        if (nextDay !== undefined) {
          daysToAdd = nextDay - todayDayOfWeek;
        } else {
          daysToAdd = (sortedDays[0] + 7) - todayDayOfWeek;
        }
      }
      
      const startDate = new Date();
      startDate.setDate(today.getDate() + daysToAdd);
      startDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
      const endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // 15 mins

      const RRULE_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const byDayString = reminder.days && reminder.days.length > 0
        ? reminder.days.map(d => RRULE_DAYS[d]).join(",")
        : RRULE_DAYS[new Date().getDay()];

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const pad = (n) => String(n).padStart(2, '0');
      const getLocalISOString = (date) => {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };

      const event = {
        summary: `🦕 ${reminder.title}`,
        description: lang === "uk" ? `Нагадування від Glucosaur (${reminder.type})` : `Reminder from Glucosaur (${reminder.type})`,
        start: {
          dateTime: getLocalISOString(startDate),
          timeZone: timeZone
        },
        end: {
          dateTime: getLocalISOString(endDate),
          timeZone: timeZone
        },
        recurrence: [
          `RRULE:FREQ=WEEKLY;BYDAY=${byDayString}`
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 0 }
          ]
        }
      };

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      toast.success(
        lang === "uk"
          ? "Нагадування успішно додано до вашого Google Календаря!"
          : "Reminder successfully added to your Google Calendar!"
      );
    } catch (err) {
      console.error(err);
      toast.error(lang === "uk" ? `Не вдалося експортувати: ${err.message}` : `Failed to export: ${err.message}`);
    } finally {
      setExportingCalendarId(null);
    }
  }

  async function loadReminders() {
    const list = await db.entities.Reminder.list();
    setReminders(list);
  }

  async function seedDefaults() {
    const existing = await db.entities.Reminder.list();
    const existingTitles = new Set(existing.map(r => r.title));
    const toCreate = DEFAULT_REMINDERS.filter(d => !existingTitles.has(d.title));
    if (toCreate.length === 0) {
      toast.info(t("reminder_already_added", lang));
      return;
    }
    for (const r of toCreate) {
      await db.entities.Reminder.create({ ...r, active: true });
    }
    loadReminders();
    toast.success(t("reminder_added_count", lang).replace("{n}", toCreate.length));
  }

  async function requestPermission() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  function toggleDay(day) {
    setForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }));
  }

  function startEdit(reminder) {
    setEditingId(reminder.id);
    setForm({ title: reminder.title, type: reminder.type, time: reminder.time, days: reminder.days || [] });
    setShowForm(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ title: "", type: "glucose", time: "08:00", days: [1, 2, 3, 4, 5] });
  }

  async function handleCreate() {
    if (!form.title || !form.time || form.days.length === 0) { toast.error(t("reminder_fill_all", lang)); return; }
    const created = await db.entities.Reminder.create({ ...form, active: true });
    setReminders(prev => [...prev, created]);
    setShowForm(false);
    setForm({ title: "", type: "glucose", time: "08:00", days: [1, 2, 3, 4, 5] });
    toast.success(t("reminder_added", lang));
  }

  async function handleUpdate() {
    if (!form.title || !form.time || form.days.length === 0) { toast.error(t("reminder_fill_all", lang)); return; }
    const updated = await db.entities.Reminder.update(editingId, { title: form.title, type: form.type, time: form.time, days: form.days });
    setReminders(prev => prev.map(r => r.id === editingId ? updated : r));
    cancelEdit();
    toast.success(t("reminder_saved", lang));
  }

  async function handleToggle(reminder) {
    const updated = await db.entities.Reminder.update(reminder.id, { active: !reminder.active });
    setReminders(prev => prev.map(r => r.id === reminder.id ? updated : r));
  }

  async function handleDelete(id) {
    await db.entities.Reminder.delete(id);
    setReminders(prev => prev.filter(r => r.id !== id));
    if (editingId === id) cancelEdit();
    toast.success(t("reminder_deleted", lang));
  }

  const days = DAYS_MAP[lang] || DAYS_EN;
  const typeIcon = (type) => type === "glucose" ? "🩸" : type === "medication" ? "💊" : "🔔";

  const formMode = editingId !== null;

  return (
    <div className="space-y-4">
      <MascotHint show={settings.show_mascot !== false} lang={lang} ukText="🦖 Налаштуй нагадування — і я нагадаю тобі виміряти цукор або прийняти ліки! 🔔" enText="🦖 Set up reminders and I'll help you remember to check your sugar or take your meds! 🔔" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🔔 {t("nav_reminders", lang)}</h1>
        <div className="flex gap-2">
          {reminders.length === 0 && (
            <Button size="sm" variant="outline" onClick={seedDefaults} className="rounded-xl text-xs">＋ {t("reminder_defaults", lang)}</Button>
          )}
          <Button size="sm" onClick={() => { setShowForm(!showForm); cancelEdit(); }} className="rounded-xl gap-1"><Plus className="w-4 h-4" />{t("reminder_add", lang)}</Button>
        </div>
      </div>

      {permission !== "granted" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><BellOff className="w-5 h-5 text-amber-600" /><p className="text-sm text-amber-800 dark:text-amber-200">{t("reminder_enable_notif", lang)}</p></div>
          <Button size="sm" variant="outline" onClick={requestPermission} className="rounded-xl shrink-0">{t("reminder_enable", lang)}</Button>
        </div>
      )}

      {(showForm || formMode) && (
        <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{formMode ? t("reminder_edit", lang) : t("reminder_new", lang)}</p>
            {formMode && (
              <button onClick={cancelEdit} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Input placeholder={t("reminder_title_label", lang)} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("reminder_type", lang)}</label>
              <MobileSelect
                value={form.type}
                onValueChange={v => setForm(f => ({ ...f, type: v }))}
                options={[
                  { value: "glucose", label: `🩸 ${t("reminder_glucose", lang)}` },
                  { value: "medication", label: `💊 ${t("reminder_medication", lang)}` },
                  { value: "custom", label: `🔔 ${t("reminder_custom", lang)}` },
                ]}
                placeholder={t("reminder_type", lang)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("reminder_time", lang)}</label>
              <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{t("reminder_days", lang)}</label>
            <div className="flex gap-1.5">{days.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${form.days.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{d}</button>
            ))}</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={formMode ? handleUpdate : handleCreate} className="flex-1 rounded-xl">{t("general_save", lang)}</Button>
            <Button variant="outline" onClick={() => { formMode ? cancelEdit() : setShowForm(false); }} className="rounded-xl">{t("general_cancel", lang)}</Button>
          </div>
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Bell className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">{t("reminder_empty", lang)}</p></div>
      ) : (
        <div className="space-y-2">
          {reminders.map(reminder => (
            <div key={reminder.id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">{typeIcon(reminder.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{reminder.title}</p>
                <p className="text-xs text-muted-foreground">{reminder.time} · {reminder.days?.map(d => days[d]).join(", ")}</p>
              </div>
              <button
                onClick={() => handleExportCalendar(reminder)}
                className="p-2 text-muted-foreground hover:text-emerald-600 transition-colors"
                title={lang === "uk" ? "Експортувати в Google Календар" : "Export to Google Calendar"}
                disabled={exportingCalendarId === reminder.id}
              >
                {exportingCalendarId === reminder.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
              </button>
              <button onClick={() => startEdit(reminder)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <Switch checked={reminder.active} onCheckedChange={() => handleToggle(reminder)} />
              <button onClick={() => handleDelete(reminder.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}