const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Droplets, Plus, X, Trash2, Calendar, List, Search, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t, getMeasurementTimeLabel } from "@/lib/i18n";
import { getDateLocale } from "@/lib/dateLocale";
import EmptyState from "@/components/EmptyState";
import MascotHint from "@/components/MascotHint";
import GlucoseStatusBadge from "@/components/GlucoseStatusBadge";
import GlucoseCalendar from "@/components/GlucoseCalendar";
import PullToRefresh from "@/components/PullToRefresh";
import MobileSelect from "@/components/MobileSelect";
import { toast } from "sonner";
import { format } from "date-fns";

const GLUCOSE_TEMPLATES_KEY = "glucosaur_glucose_templates";

function loadGlucoseTemplates() {
  try { return JSON.parse(localStorage.getItem(GLUCOSE_TEMPLATES_KEY)) || []; } catch { return []; }
}
function saveGlucoseTemplates(list) {
  localStorage.setItem(GLUCOSE_TEMPLATES_KEY, JSON.stringify(list));
}

const MEASUREMENT_TIMES = ["before_breakfast", "after_breakfast", "before_lunch", "after_lunch", "before_dinner", "after_dinner", "bedtime", "fasting", "other"];

export default function Glucose({ settings }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("list");
  const [form, setForm] = useState({ value: "", measurement_time: "before_breakfast", notes: "" });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [showSaveTpl, setShowSaveTpl] = useState(false);
  const lang = settings.language;
  const dateLocale = getDateLocale(lang);

  useEffect(() => { loadReadings(); }, []);

  useEffect(() => {
    setCustomTemplates(loadGlucoseTemplates());
  }, []);

  const isMmol = settings.glucose_unit === "mmol/L";
  const defaultTemplates = [
    { id: "def_fasting", name: lang === "uk" ? "Натщесерце" : "Fasting", value: isMmol ? "5.2" : "94", measurement_time: "fasting" },
    { id: "def_before", name: lang === "uk" ? "Перед сніданком" : "Before breakfast", value: isMmol ? "5.4" : "97", measurement_time: "before_breakfast" },
    { id: "def_after", name: lang === "uk" ? "Після обіду" : "After lunch", value: isMmol ? "7.2" : "130", measurement_time: "after_lunch" },
    { id: "def_bedtime", name: lang === "uk" ? "Перед сном" : "Bedtime", value: isMmol ? "6.0" : "108", measurement_time: "bedtime" }
  ];

  async function handleQuickAddTemplate(tpl) {
    const tempId = "temp_" + Date.now();
    const newReading = {
      id: tempId,
      value: parseFloat(tpl.value),
      unit: settings.glucose_unit,
      measurement_time: tpl.measurement_time,
      date: new Date().toISOString(),
      notes: lang === "uk" ? "Швидкий запис за шаблоном" : "Quick logged from template",
    };
    setReadings(prev => [newReading, ...prev]);
    toast.success(
      lang === "uk"
        ? `Швидко додано: ${tpl.name} (${tpl.value} ${settings.glucose_unit})`
        : `Quick added: ${tpl.name} (${tpl.value} ${settings.glucose_unit})`
    );
    try {
      await db.entities.GlucoseReading.create({
        value: newReading.value,
        unit: newReading.unit,
        measurement_time: newReading.measurement_time,
        date: newReading.date,
        notes: newReading.notes,
      });
      loadReadings();
    } catch {
      setReadings(prev => prev.filter(r => r.id !== tempId));
      toast.error(lang === "uk" ? "Не вдалося зберегти" : "Failed to save");
    }
  }

  function handleSaveTemplate() {
    if (!templateName.trim() || !form.value) return;
    const newTpl = {
      id: "tpl_" + Date.now(),
      name: templateName.trim(),
      value: form.value,
      measurement_time: form.measurement_time
    };
    const updated = [newTpl, ...customTemplates];
    setCustomTemplates(updated);
    saveGlucoseTemplates(updated);
    setTemplateName("");
    setShowSaveTpl(false);
    toast.success(lang === "uk" ? "Шаблон збережено" : "Template saved");
  }

  function handleDeleteTemplate(id, e) {
    e.stopPropagation();
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    saveGlucoseTemplates(updated);
    toast.success(lang === "uk" ? "Шаблон видалено" : "Template deleted");
  }

  async function loadReadings() {
    const data = await db.entities.GlucoseReading.list("-date", 100);
    setReadings(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.value) return;
    setSaving(true);
    const tempId = "temp_" + Date.now();
    const newReading = {
      id: tempId,
      value: parseFloat(form.value),
      unit: settings.glucose_unit,
      measurement_time: form.measurement_time,
      date: new Date().toISOString(),
      notes: form.notes || undefined,
    };
    setReadings(prev => [newReading, ...prev]);
    setForm({ value: "", measurement_time: "before_breakfast", notes: "" });
    setShowForm(false);
    setSaving(false);
    try {
      const created = await db.entities.GlucoseReading.create({
        value: newReading.value,
        unit: newReading.unit,
        measurement_time: newReading.measurement_time,
        date: newReading.date,
        notes: newReading.notes,
      });
      setReadings(prev => prev.map(r => r.id === tempId ? created : r));
    } catch {
      setReadings(prev => prev.filter(r => r.id !== tempId));
      toast.error(lang === "uk" ? "Не вдалося зберегти" : "Failed to save");
      setShowForm(true);
    }
  }

  async function handleDelete(id) {
    const item = readings.find(r => r.id === id);
    setReadings(prev => prev.filter(r => r.id !== id));
    try {
      await db.entities.GlucoseReading.delete(id);
    } catch {
      setReadings(prev => [item, ...prev.filter(r => r.id !== id)]);
      toast.error(lang === "uk" ? "Не вдалося видалити" : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const measurementOptions = MEASUREMENT_TIMES.map(mt => ({ value: mt, label: getMeasurementTimeLabel(mt, lang) }));

  const filteredReadings = readings.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Notes match
    const notesMatch = r.notes?.toLowerCase().includes(query);
    
    // Date match
    const dateStr = format(new Date(r.date), "d MMM, HH:mm", { locale: dateLocale }).toLowerCase();
    const dateMatch = dateStr.includes(query);
    
    // Measurement time label match
    const labelMatch = getMeasurementTimeLabel(r.measurement_time, lang).toLowerCase().includes(query);

    return notesMatch || dateMatch || labelMatch;
  });

  return (
    <PullToRefresh onRefresh={loadReadings}>
      <div className="space-y-4">
        <MascotHint
          show={settings.show_mascot !== false}
          lang={lang}
          ukText="🦖 Тут ти можеш записувати рівень цукру в крові. Натисни + знизу і введи значення — я збережу всю історію!"
          enText="🦖 Here you can log your blood sugar readings. Tap + and enter your value — I'll keep track of everything!"
        />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{t("glucose_title", lang)}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === "list" ? "calendar" : "list")}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              {view === "list" ? <Calendar className="w-5 h-5 text-foreground" /> : <List className="w-5 h-5 text-foreground" />}
            </button>
            <Button
              onClick={() => setShowForm(!showForm)}
              size="icon"
              className="rounded-xl h-10 w-10"
            >
              {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Quick Templates Section */}
        {view === "list" && (
          <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{lang === "uk" ? "Швидкі шаблони" : "Quick Templates"}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Defaults */}
              {defaultTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleQuickAddTemplate(tpl)}
                  className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-xl text-xs font-medium text-foreground transition-all border border-border/20"
                  title={lang === "uk" ? "Натисніть для швидкого додавання" : "Click to quick add"}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{tpl.name} ({tpl.value})</span>
                </button>
              ))}
              {/* Customs */}
              {customTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleQuickAddTemplate(tpl)}
                  className="group flex items-center gap-1 bg-primary/5 hover:bg-primary/10 pl-3 pr-1 py-1 rounded-xl text-xs font-medium text-primary transition-all border border-primary/10 cursor-pointer"
                  title={lang === "uk" ? "Натисніть для швидкого додавання" : "Click to quick add"}
                >
                  <span>{tpl.name} ({tpl.value})</span>
                  <button
                    onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("glucose_value", lang)} ({settings.glucose_unit})</label>
              <Input
                type="number"
                step="0.1"
                placeholder={settings.glucose_unit === "mmol/L" ? "5.5" : "100"}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("glucose_when", lang)}</label>
              <MobileSelect
                value={form.measurement_time}
                onValueChange={(v) => setForm({ ...form, measurement_time: v })}
                options={measurementOptions}
                placeholder={t("glucose_when", lang)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("glucose_notes", lang)}</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            {/* Save as Template Field */}
            {form.value && (
              <div className="pt-2 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setShowSaveTpl(!showSaveTpl)}
                  className="text-xs text-primary font-medium flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {lang === "uk" ? "Зберегти цей запис як шаблон" : "Save this entry as a template"}
                </button>
                {showSaveTpl && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder={lang === "uk" ? "Назва шаблону (напр. Сніданок)" : "Template name (e.g. Breakfast)"}
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="rounded-xl flex-1 text-xs h-8"
                    />
                    <Button
                      onClick={handleSaveTemplate}
                      size="sm"
                      disabled={!templateName.trim()}
                      className="rounded-xl text-xs h-8 px-3 bg-primary text-primary-foreground"
                    >
                      {lang === "uk" ? "Зберегти" : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button onClick={handleSave} disabled={!form.value || saving} className="w-full rounded-xl">
              {saving ? t("general_loading", lang) : t("glucose_save", lang)}
            </Button>
          </div>
        )}

        {/* Search Bar */}
        {view === "list" && readings.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={lang === "uk" ? "Пошук за нотатками, періодом чи часом..." : "Search by notes, period or time..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                {lang === "uk" ? "Скинути" : "Clear"}
              </button>
            )}
          </div>
        )}

        {/* Calendar View */}
        {view === "calendar" && readings.length > 0 && (
          <GlucoseCalendar readings={readings} settings={settings} lang={lang} />
        )}

        {/* Readings List */}
        {view === "list" && readings.length === 0 ? (
          <EmptyState icon={Droplets} message={t("glucose_empty", lang)} />
        ) : view === "list" ? (
          filteredReadings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {lang === "uk" ? "Нічого не знайдено за запитом" : "No readings match your search query"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReadings.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-card rounded-xl border border-border/50 px-4 py-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-foreground">{r.value}</span>
                      <span className="text-xs text-muted-foreground">{settings.glucose_unit}</span>
                      <GlucoseStatusBadge value={r.value} min={settings.target_glucose_min} max={settings.target_glucose_max} lang={lang} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{getMeasurementTimeLabel(r.measurement_time, lang)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(r.date), "d MMM, HH:mm", { locale: dateLocale })}</span>
                    </div>
                    {r.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{r.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </PullToRefresh>
  );
}