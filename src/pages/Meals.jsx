const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { UtensilsCrossed, Plus, X, Trash2, Camera, Loader2, Sparkles, ChevronLeft, ChevronRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t, getMealTypeLabel } from "@/lib/i18n";
import { getDateLocale } from "@/lib/dateLocale";
import EmptyState from "@/components/EmptyState";
import MascotHint from "@/components/MascotHint";
import MealTemplates from "@/components/MealTemplates";
import PullToRefresh from "@/components/PullToRefresh";
import MobileSelect from "@/components/MobileSelect";
import { toast } from "sonner";
import { format, addDays, subDays, startOfDay } from "date-fns";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const COMMON_FOOD_ITEMS = [
  { name: "Хліб / Bread", carbs: 48, calories: 250 },
  { name: "Яблуко / Apple", carbs: 14, calories: 52 },
  { name: "Рис / Rice", carbs: 28, calories: 130 },
  { name: "Картопля / Potato", carbs: 17, calories: 77 },
  { name: "Вівсянка / Oatmeal", carbs: 12, calories: 68 },
  { name: "Молоко / Milk", carbs: 4.8, calories: 42 },
  { name: "Банан / Banana", carbs: 23, calories: 89 },
  { name: "Куряча грудка / Chicken Breast", carbs: 0, calories: 165 },
  { name: "Гречка / Buckwheat", carbs: 25, calories: 120 },
  { name: "Макарони / Pasta", carbs: 30, calories: 150 },
];

export default function Meals({ settings }) {
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({ meal_type: "breakfast", description: "", carbs_grams: "", calories: "" });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcIngredients, setCalcIngredients] = useState([
    { id: "1", name: COMMON_FOOD_ITEMS[0].name, carbsPer100g: COMMON_FOOD_ITEMS[0].carbs, caloriesPer100g: COMMON_FOOD_ITEMS[0].calories, weight: "100" }
  ]);

  const lang = settings.language;
  const dateLocale = getDateLocale(lang);

  function handleAddIngredient() {
    setCalcIngredients([...calcIngredients, {
      id: String(Date.now()),
      name: COMMON_FOOD_ITEMS[0].name,
      carbsPer100g: COMMON_FOOD_ITEMS[0].carbs,
      caloriesPer100g: COMMON_FOOD_ITEMS[0].calories,
      weight: "100"
    }]);
  }

  function handleRemoveIngredient(id) {
    if (calcIngredients.length === 1) return;
    setCalcIngredients(calcIngredients.filter(item => item.id !== id));
  }

  function handleUpdateIngredient(id, field, val) {
    setCalcIngredients(calcIngredients.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === "name") {
        if (val === "__custom__") {
          updated.carbsPer100g = 0;
          updated.caloriesPer100g = 0;
        } else {
          const food = COMMON_FOOD_ITEMS.find(f => f.name === val);
          if (food) {
            updated.carbsPer100g = food.carbs;
            updated.caloriesPer100g = food.calories;
          }
        }
      }
      return updated;
    }));
  }

  const totalCarbs = Math.round(calcIngredients.reduce((sum, item) => {
    const wt = parseFloat(item.weight) || 0;
    const carbs = parseFloat(item.carbsPer100g) || 0;
    return sum + (carbs * wt) / 100;
  }, 0));

  const totalCalories = Math.round(calcIngredients.reduce((sum, item) => {
    const wt = parseFloat(item.weight) || 0;
    const cals = parseFloat(item.caloriesPer100g) || 0;
    return sum + (cals * wt) / 100;
  }, 0));

  function handleApplyCalculator() {
    const listNames = calcIngredients
      .map(item => `${item.name === "__custom__" ? (lang === "uk" ? "Своя страва" : "Custom food") : item.name.split(" / ")[0]} (${item.weight}g)`)
      .join(", ");
    
    setForm(prev => ({
      ...prev,
      carbs_grams: String(totalCarbs),
      calories: String(totalCalories),
      description: prev.description ? `${prev.description}, ${listNames}` : listNames
    }));
    setShowCalculator(false);
    toast.success(lang === "uk" ? "Розрахунок успішно застосовано до страви!" : "Calculation successfully applied to the meal!");
  }

  // Notify MealTemplates of form changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("meal-form-change", { detail: form }));
  }, [form]);

  useEffect(() => { loadMeals(); }, []);

  useEffect(() => {
    const todayStr = format(startOfDay(selectedDate), "yyyy-MM-dd");
    setMeals(allMeals.filter(m => m.date && m.date.startsWith(todayStr)));
  }, [selectedDate, allMeals]);

  async function loadMeals() {
    const data = await db.entities.MealLog.list("-date", 300);
    setAllMeals(data);
    const todayStr = format(startOfDay(selectedDate), "yyyy-MM-dd");
    setMeals(data.filter(m => m.date && m.date.startsWith(todayStr)));
    setLoading(false);
  }

  async function handlePhotoAnalyze(file) {
    setAnalyzing(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    const res = await db.integrations.Core.InvokeLLM({
      prompt: lang === "uk"
        ? `Розпізнай страву на фото. Відповідай ЛИШЕ JSON без Markdown. Формат: { "description": "Назва страви", "calories": 350, "carbs_grams": 45 }`
        : `Identify the meal in this photo. Reply ONLY with JSON, no Markdown. Format: { "description": "Meal name", "calories": 350, "carbs_grams": 45 }`,
      file_urls: [file_url],
      response_json_schema: { type: "object", properties: { description: { type: "string" }, calories: { type: "number" }, carbs_grams: { type: "number" } } }
    });
    setForm(prev => ({
      ...prev,
      description: res.description || prev.description,
      calories: res.calories ? String(Math.round(res.calories)) : prev.calories,
      carbs_grams: res.carbs_grams ? String(Math.round(res.carbs_grams)) : prev.carbs_grams,
    }));
    setAnalyzing(false);
  }

  async function handleSave() {
    setSaving(true);
    const tempId = "temp_" + Date.now();
    const newMeal = {
      id: tempId,
      meal_type: form.meal_type,
      description: form.description || undefined,
      carbs_grams: form.carbs_grams ? parseFloat(form.carbs_grams) : undefined,
      calories: form.calories ? parseFloat(form.calories) : undefined,
      photo_url: photoUrl || undefined,
      date: selectedDate.toISOString(),
    };
    // Optimistic: add to both lists immediately
    setAllMeals(prev => [newMeal, ...prev]);
    setMeals(prev => [newMeal, ...prev]);
    setForm({ meal_type: "breakfast", description: "", carbs_grams: "", calories: "" });
    setPhotoUrl(null);
    setShowForm(false);
    setSaving(false);
    try {
      const created = await db.entities.MealLog.create({
        meal_type: newMeal.meal_type,
        description: newMeal.description,
        carbs_grams: newMeal.carbs_grams,
        calories: newMeal.calories,
        photo_url: newMeal.photo_url,
        date: newMeal.date,
      });
      setAllMeals(prev => prev.map(m => m.id === tempId ? created : m));
      setMeals(prev => prev.map(m => m.id === tempId ? created : m));
    } catch {
      setAllMeals(prev => prev.filter(m => m.id !== tempId));
      setMeals(prev => prev.filter(m => m.id !== tempId));
      toast.error(lang === "uk" ? "Не вдалося зберегти" : "Failed to save");
      setShowForm(true);
    }
  }

  async function handleDelete(id) {
    const item = allMeals.find(m => m.id === id);
    setAllMeals(prev => prev.filter(m => m.id !== id));
    setMeals(prev => prev.filter(m => m.id !== id));
    try {
      await db.entities.MealLog.delete(id);
    } catch {
      setAllMeals(prev => [item, ...prev.filter(m => m.id !== id)]);
      const todayStr = format(startOfDay(selectedDate), "yyyy-MM-dd");
      setMeals(prev => [item, ...prev.filter(m => m.id !== id)].filter(m => m.date && m.date.startsWith(todayStr)));
      toast.error(lang === "uk" ? "Не вдалося видалити" : "Failed to delete");
    }
  }

  function applyTemplate(tpl) {
    setForm({
      meal_type: tpl.meal_type,
      description: tpl.description || "",
      carbs_grams: tpl.carbs_grams ? String(tpl.carbs_grams) : "",
      calories: tpl.calories ? String(tpl.calories) : "",
    });
    setPhotoUrl(null);
    setShowForm(true);
  }

  const isToday = format(startOfDay(selectedDate), "yyyy-MM-dd") === format(startOfDay(new Date()), "yyyy-MM-dd");
  const dateLabel = isToday
    ? t("meals_today", lang)
    : format(selectedDate, "d MMMM yyyy", { locale: dateLocale });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mealOptions = MEAL_TYPES.map(mt => ({ value: mt, label: getMealTypeLabel(mt, lang) }));

  return (
    <PullToRefresh onRefresh={loadMeals}>
      <div className="space-y-4">
        <MascotHint
          show={settings.show_mascot !== false}
          lang={lang}
          ukText="🦖 Записуй що ти їв! Можна фотографувати страву — я сам розрахую калорії і вуглеводи. 👀"
          enText="🦖 Log what you eat! You can even snap a photo of your meal — I'll figure out the calories and carbs for you. 👀"
        />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{t("meals_title", lang)}</h1>
          <Button onClick={() => setShowForm(!showForm)} size="icon" className="rounded-xl h-10 w-10">
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">{dateLabel}</span>
          <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors" disabled={isToday}>
            <ChevronRight className={`w-5 h-5 ${isToday ? "text-muted-foreground/30" : "text-foreground"}`} />
          </button>
        </div>

        <MealTemplates onApply={applyTemplate} lang={lang} />

        {showForm && (
          <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meals_type", lang)}</label>
              <MobileSelect
                value={form.meal_type}
                onValueChange={(v) => setForm({ ...form, meal_type: v })}
                options={mealOptions}
                placeholder={t("meals_type", lang)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meals_description", lang)}</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={lang === "uk" ? "Що ви їли..." : "What did you eat..."} className="rounded-xl resize-none flex-1" rows={2} />
                  <label className="cursor-pointer shrink-0">
                    <div className={`w-12 h-full min-h-[72px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${photoUrl ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary"}`}>
                      {analyzing ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : photoUrl ? <Sparkles className="w-5 h-5 text-primary" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
                      <span className="text-[9px] text-muted-foreground text-center leading-tight">{lang === "uk" ? "Фото" : "Photo"}</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handlePhotoAnalyze(e.target.files[0])} />
                  </label>
                </div>
                {analyzing && <p className="text-xs text-primary">{lang === "uk" ? "✨ Розпізнаю страву..." : "✨ Analyzing meal..."}</p>}
                {photoUrl && !analyzing && <p className="text-xs text-emerald-600 dark:text-emerald-400">{lang === "uk" ? "✓ Калорії та вуглеводи розраховано" : "✓ Calories & carbs calculated"}</p>}
              </div>
            </div>
            {/* Carb & Calories Calculator Widget */}
            <div className="pt-2 border-t border-border/30">
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className="text-xs text-primary font-medium flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                {lang === "uk" ? "🧮 Розрахувати вуглеводи та калорії (суматор інгредієнтів)" : "🧮 Carb & Calories Calculator (ingredient adder)"}
              </button>
              
              {showCalculator && (
                <div className="mt-3 bg-muted/40 rounded-xl border border-border/40 p-3 space-y-3">
                  <p className="text-xs font-semibold text-foreground">
                    {lang === "uk" ? "Суматор інгредієнтів" : "Ingredient Sum Calculator"}
                  </p>
                  
                  <div className="space-y-2">
                    {calcIngredients.map((ing, idx) => (
                      <div key={ing.id} className="flex flex-col gap-2 p-2 bg-card rounded-lg border border-border/30">
                        {/* Selector or custom name */}
                        <div className="flex gap-2">
                          <select
                            value={ing.name}
                            onChange={(e) => handleUpdateIngredient(ing.id, "name", e.target.value)}
                            className="flex-1 bg-transparent border border-border rounded-lg text-xs p-1.5 focus:outline-none"
                          >
                            {COMMON_FOOD_ITEMS.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name} (100g: {f.carbs}g C, {f.calories} kcal)
                              </option>
                            ))}
                            <option value="__custom__">
                              ✏️ {lang === "uk" ? "Свій інгредієнт..." : "Custom..."}
                            </option>
                          </select>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(ing.id)}
                            className="text-muted-foreground hover:text-destructive p-1"
                            disabled={calcIngredients.length === 1}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {/* If Custom selected */}
                        {ing.name === "__custom__" && (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Carbs/100g"
                              value={ing.carbsPer100g}
                              onChange={(e) => handleUpdateIngredient(ing.id, "carbsPer100g", e.target.value)}
                              className="text-xs h-7 px-2 rounded-lg"
                            />
                            <Input
                              type="number"
                              placeholder="Kcal/100g"
                              value={ing.caloriesPer100g}
                              onChange={(e) => handleUpdateIngredient(ing.id, "caloriesPer100g", e.target.value)}
                              className="text-xs h-7 px-2 rounded-lg"
                            />
                          </div>
                        )}
                        
                        {/* Weight row */}
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] text-muted-foreground">{lang === "uk" ? "Вага (грам):" : "Weight (grams):"}</span>
                          <Input
                            type="number"
                            value={ing.weight}
                            onChange={(e) => handleUpdateIngredient(ing.id, "weight", e.target.value)}
                            className="text-xs h-7 w-20 px-2 rounded-lg text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between border-t border-border/30 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="text-primary font-medium hover:underline text-[11px]"
                    >
                      ＋ {lang === "uk" ? "Додати інгредієнт" : "Add ingredient"}
                    </button>
                    
                    <div className="text-right">
                      <p className="font-semibold text-foreground text-[11px]">
                        {lang === "uk" ? "Разом:" : "Total:"} {totalCarbs}g {t("meals_carbs_short", lang)} · {totalCalories} kcal
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleApplyCalculator}
                    className="w-full text-xs h-8 rounded-lg bg-primary text-primary-foreground"
                  >
                    {lang === "uk" ? "Застосувати розрахунок" : "Apply to form"}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meals_carbs", lang)}</label>
                <Input type="number" value={form.carbs_grams} onChange={(e) => setForm({ ...form, carbs_grams: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("meals_calories", lang)}</label>
                <Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
              {saving ? t("general_loading", lang) : t("glucose_save", lang)}
            </Button>
          </div>
        )}

        {meals.length === 0 ? (
          <EmptyState icon={UtensilsCrossed} message={t("meals_empty", lang)} />
        ) : (
          <div className="space-y-2">
            {meals.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-card rounded-xl border border-border/50 px-4 py-3 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{getMealTypeLabel(m.meal_type, lang)}</span>
                    {m.carbs_grams && <span className="text-xs text-muted-foreground">{m.carbs_grams}g {t("meals_carbs_short", lang)}</span>}
                    {m.calories && <span className="text-xs text-muted-foreground">{m.calories} kcal</span>}
                  </div>
                  {m.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.description}</p>}
                  <span className="text-xs text-muted-foreground">{format(new Date(m.date), "HH:mm")}</span>
                </div>
                <button onClick={() => handleDelete(m.id)} className="p-2 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}