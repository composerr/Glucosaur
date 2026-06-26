const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Pill, Plus, X, Trash2, Check, Clock, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t, getFrequencyLabel, getTimeOfDayLabel } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import MascotHint from "@/components/MascotHint";
import MobileSelect from "@/components/MobileSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, startOfDay } from "date-fns";

const FREQUENCIES = ["once_daily", "twice_daily", "three_times_daily", "as_needed"];
const TIMES_OF_DAY = ["morning", "afternoon", "evening", "bedtime"];

const COMMON_MEDS = [
  "Метформін / Metformin",
  "Глюкофаж / Glucophage",
  "Сіофор / Siofor",
  "Januvia (Sitagliptin)",
  "Jardiance (Empagliflozin)",
  "Forxiga (Dapagliflozin)",
  "Galvus (Vildagliptin)",
  "Glibenclamide",
  "Gliclazide (Діабетон)",
  "Інсулін / Insulin",
];

const COMMON_DOSAGES = ["500 мг", "850 мг", "1000 мг", "2 мг", "5 мг", "10 мг", "25 мг", "50 мг", "100 мг"];

const LAST_MED_KEY = "glucovita_last_med";
const LAST_DOSE_KEY = "glucovita_last_dose";

function getLastUsed(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function setLastUsed(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export default function Medications({ settings }) {
  const [medications, setMedications] = useState([]);
  const [medLogs, setMedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [customMed, setCustomMed] = useState("");
  const [customDosage, setCustomDosage] = useState("");

  const lastMed = getLastUsed(LAST_MED_KEY);
  const lastDose = getLastUsed(LAST_DOSE_KEY);

  const [form, setForm] = useState({
    name: lastMed.value || COMMON_MEDS[0],
    isCustomName: lastMed.isCustom || false,
    dosage: lastDose.value || COMMON_DOSAGES[0],
    isCustomDosage: lastDose.isCustom || false,
    frequency: "once_daily",
    time_of_day: "morning",
  });
  const [saving, setSaving] = useState(false);
  const lang = settings.language;

  // Editing States
  const [editingMed, setEditingMed] = useState(null);
  const [editMedForm, setEditMedForm] = useState({
    name: "",
    dosage: "",
    frequency: "once_daily",
    time_of_day: "morning"
  });

  // Edit Handlers
  function handleStartEditMed(med) {
    setEditingMed(med);
    setEditMedForm({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      time_of_day: med.time_of_day
    });
  }

  async function handleSaveEditedMed() {
    if (!editMedForm.name.trim() || !editMedForm.dosage.trim()) return;
    const updatedMed = {
      ...editingMed,
      name: editMedForm.name.trim(),
      dosage: editMedForm.dosage.trim(),
      frequency: editMedForm.frequency,
      time_of_day: editMedForm.time_of_day
    };

    setMedications(prev => prev.map(m => m.id === editingMed.id ? updatedMed : m));
    setEditingMed(null);

    try {
      await db.entities.Medication.update(editingMed.id, {
        name: updatedMed.name,
        dosage: updatedMed.dosage,
        frequency: updatedMed.frequency,
        time_of_day: updatedMed.time_of_day,
      });
      loadData();
      toast.success(lang === "uk" ? "Ліки оновлено" : "Medication updated");
    } catch {
      toast.error(lang === "uk" ? "Не вдалося оновити запис" : "Failed to update medication");
      loadData();
    }
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [meds, logs] = await Promise.all([
      db.entities.Medication.list("-created_date", 50),
      db.entities.MedicationLog.list("-date", 100),
    ]);
    setMedications(meds.filter(m => m.active !== false));
    setMedLogs(logs);
    setLoading(false);
  }

  async function handleSave() {
    const finalName = form.isCustomName ? customMed : form.name;
    const finalDosage = form.isCustomDosage ? customDosage : form.dosage;
    if (!finalName || !finalDosage) return;
    setSaving(true);

    setLastUsed(LAST_MED_KEY, { value: finalName, isCustom: form.isCustomName });
    setLastUsed(LAST_DOSE_KEY, { value: finalDosage, isCustom: form.isCustomDosage });

    const tempId = "temp_" + Date.now();
    const newMed = {
      id: tempId,
      name: finalName,
      dosage: finalDosage,
      frequency: form.frequency,
      time_of_day: form.time_of_day,
      active: true,
    };
    // Optimistic: add immediately
    setMedications(prev => [newMed, ...prev]);
    setShowForm(false);
    setSaving(false);
    try {
      const created = await db.entities.Medication.create({
        name: finalName,
        dosage: finalDosage,
        frequency: form.frequency,
        time_of_day: form.time_of_day,
        active: true,
      });
      setMedications(prev => prev.map(m => m.id === tempId ? created : m));
    } catch {
      setMedications(prev => prev.filter(m => m.id !== tempId));
      toast.error(lang === "uk" ? "Не вдалося зберегти" : "Failed to save");
      setShowForm(true);
    }
  }

  async function handleDelete(id) {
    const item = medications.find(m => m.id === id);
    setMedications(prev => prev.filter(m => m.id !== id));
    try {
      await db.entities.Medication.delete(id);
    } catch {
      setMedications(prev => [item, ...prev.filter(m => m.id !== id)]);
      toast.error(lang === "uk" ? "Не вдалося видалити" : "Failed to delete");
    }
  }

  async function toggleTaken(med) {
    const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
    const todayLog = medLogs.find(l => l.medication_id === med.id && l.date && l.date.startsWith(todayStr));
    if (todayLog) {
      // Optimistic toggle
      setMedLogs(prev => prev.map(l => l.id === todayLog.id ? { ...l, taken: !l.taken } : l));
      try {
        await db.entities.MedicationLog.update(todayLog.id, { taken: !todayLog.taken });
      } catch {
        setMedLogs(prev => prev.map(l => l.id === todayLog.id ? { ...l, taken: todayLog.taken } : l));
        toast.error(lang === "uk" ? "Помилка" : "Error");
      }
    } else {
      // Optimistic add
      const tempId = "temp_" + Date.now();
      const newLog = {
        id: tempId,
        medication_id: med.id,
        medication_name: med.name,
        taken: true,
        date: new Date().toISOString(),
      };
      setMedLogs(prev => [newLog, ...prev]);
      try {
        const created = await db.entities.MedicationLog.create({
          medication_id: med.id,
          medication_name: med.name,
          taken: true,
          date: new Date().toISOString(),
        });
        setMedLogs(prev => prev.map(l => l.id === tempId ? created : l));
      } catch {
        setMedLogs(prev => prev.filter(l => l.id !== tempId));
        toast.error(lang === "uk" ? "Помилка" : "Error");
      }
    }
  }

  function isTakenToday(medId) {
    const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
    return medLogs.some(l => l.medication_id === medId && l.date && l.date.startsWith(todayStr) && l.taken);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const medOptions = [
    ...COMMON_MEDS.map(m => ({ value: m, label: m })),
    { value: "__custom__", label: `✏️ ${lang === "uk" ? "Свій варіант..." : "Custom..."}` },
  ];
  const dosageOptions = [
    ...COMMON_DOSAGES.map(d => ({ value: d, label: d })),
    { value: "__custom__", label: `✏️ ${lang === "uk" ? "Свій варіант..." : "Custom..."}` },
  ];
  const freqOptions = FREQUENCIES.map(f => ({ value: f, label: getFrequencyLabel(f, lang) }));
  const timeOptions = TIMES_OF_DAY.map(tod => ({ value: tod, label: getTimeOfDayLabel(tod, lang) }));

  return (
    <div className="space-y-4">
      <MascotHint
        show={settings.show_mascot !== false}
        lang={lang}
        ukText="🦖 Тут твої ліки! Додай препарат і щодня відмічай — чи вже прийняв. Я стежу за твоїм розкладом! 💊"
        enText="🦖 This is your medications page! Add your pills and check them off daily. I'll help you stay on track! 💊"
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t("meds_title", lang)}</h1>
        <Button onClick={() => setShowForm(!showForm)} size="icon" className="rounded-xl h-10 w-10">
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Medication Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meds_name", lang)}</label>
            {!form.isCustomName ? (
              <MobileSelect
                value={form.name}
                onValueChange={(v) => {
                  if (v === "__custom__") {
                    setForm({ ...form, isCustomName: true });
                  } else {
                    setForm({ ...form, name: v });
                  }
                }}
                options={medOptions}
                placeholder={t("meds_name", lang)}
                className="rounded-xl"
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder={lang === "uk" ? "Введіть назву ліків" : "Enter medication name"}
                  value={customMed}
                  onChange={(e) => setCustomMed(e.target.value)}
                  className="rounded-xl flex-1"
                />
                <Button variant="ghost" size="icon" className="rounded-xl shrink-0" onClick={() => setForm({ ...form, isCustomName: false })}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Dosage */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meds_dosage", lang)}</label>
            {!form.isCustomDosage ? (
              <MobileSelect
                value={form.dosage}
                onValueChange={(v) => {
                  if (v === "__custom__") {
                    setForm({ ...form, isCustomDosage: true });
                  } else {
                    setForm({ ...form, dosage: v });
                  }
                }}
                options={dosageOptions}
                placeholder={t("meds_dosage", lang)}
                className="rounded-xl"
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="500mg"
                  value={customDosage}
                  onChange={(e) => setCustomDosage(e.target.value)}
                  className="rounded-xl flex-1"
                />
                <Button variant="ghost" size="icon" className="rounded-xl shrink-0" onClick={() => setForm({ ...form, isCustomDosage: false })}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Frequency + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meds_frequency", lang)}</label>
              <MobileSelect
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v })}
                options={freqOptions}
                placeholder={t("meds_frequency", lang)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meds_time", lang)}</label>
              <MobileSelect
                value={form.time_of_day}
                onValueChange={(v) => setForm({ ...form, time_of_day: v })}
                options={timeOptions}
                placeholder={t("meds_time", lang)}
                className="rounded-xl"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || (form.isCustomName && !customMed) || (form.isCustomDosage && !customDosage)}
            className="w-full rounded-xl"
          >
            {saving ? t("general_loading", lang) : t("glucose_save", lang)}
          </Button>
        </div>
      )}

      {medications.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">{t("meds_log_title", lang)}</h2>
          <div className="space-y-2">
            {medications.map((med) => {
              const taken = isTakenToday(med.id);
              return (
                <div key={med.id} className="flex items-center gap-3 bg-card rounded-xl border border-border/50 px-4 py-3 group">
                  <button
                    onClick={() => toggleTaken(med)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${taken ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                  >
                    {taken ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-semibold ${taken ? "text-muted-foreground line-through" : "text-foreground"}`}>{med.name}</span>
                    <p className="text-xs text-muted-foreground">{med.dosage} · {getFrequencyLabel(med.frequency, lang)} · {getTimeOfDayLabel(med.time_of_day, lang)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEditMed(med)}
                      className="p-2 text-muted-foreground hover:text-primary transition-all"
                      title={lang === "uk" ? "Редагувати ліки" : "Edit medication"}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(med.id)} className="p-2 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {medications.length === 0 && !showForm && (
        <EmptyState icon={Pill} message={t("meds_empty", lang)} />
      )}

      {/* Medication Edit Dialog */}
      <Dialog open={!!editingMed} onOpenChange={(open) => !open && setEditingMed(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{lang === "uk" ? "Редагувати ліки" : "Edit Medication"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meds_name", lang)}</label>
              <Input
                value={editMedForm.name}
                onChange={(e) => setEditMedForm({ ...editMedForm, name: e.target.value })}
                className="rounded-xl"
                placeholder={lang === "uk" ? "Введіть назву ліків" : "Enter medication name"}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meds_dosage", lang)}</label>
              <Input
                value={editMedForm.dosage}
                onChange={(e) => setEditMedForm({ ...editMedForm, dosage: e.target.value })}
                className="rounded-xl"
                placeholder="500mg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meds_frequency", lang)}</label>
                <MobileSelect
                  value={editMedForm.frequency}
                  onValueChange={(v) => setEditMedForm({ ...editMedForm, frequency: v })}
                  options={freqOptions}
                  placeholder={t("meds_frequency", lang)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meds_time", lang)}</label>
                <MobileSelect
                  value={editMedForm.time_of_day}
                  onValueChange={(v) => setEditMedForm({ ...editMedForm, time_of_day: v })}
                  options={timeOptions}
                  placeholder={t("meds_time", lang)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:flex-row mt-2">
            <Button variant="outline" className="rounded-xl flex-1" onClick={() => setEditingMed(null)}>
              {t("general_cancel", lang)}
            </Button>
            <Button className="rounded-xl flex-1" onClick={handleSaveEditedMed}>
              {lang === "uk" ? "Зберегти" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}