import { useState, useEffect } from "react";
import { Bookmark, Plus, X, Trash2 } from "lucide-react";
import { t, getMealTypeLabel } from "@/lib/i18n";
import { toast } from "sonner";

const STORAGE_KEY = "glucosaur_meal_templates";

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveTemplates(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function MealTemplates({ onApply, lang }) {
  const [templates, setTemplates] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [name, setName] = useState("");
  const [currentForm, setCurrentForm] = useState(null);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  // Listen for current form data via a custom event
  useEffect(() => {
    const handler = (e) => setCurrentForm(e.detail);
    window.addEventListener("meal-form-change", handler);
    return () => window.removeEventListener("meal-form-change", handler);
  }, []);

  function handleSave() {
    if (!name.trim() || !currentForm) return;
    const template = {
      id: "tpl_" + Date.now(),
      name: name.trim(),
      meal_type: currentForm.meal_type,
      description: currentForm.description,
      carbs_grams: currentForm.carbs_grams,
      calories: currentForm.calories,
    };
    const updated = [template, ...templates];
    setTemplates(updated);
    saveTemplates(updated);
    setName("");
    setShowSaveForm(false);
    toast.success(t("meals_template_saved", lang));
  }

  function handleDelete(id) {
    const updated = templates.filter(tpl => tpl.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    toast.success(t("meals_template_deleted", lang));
  }

  function handleApply(tpl) {
    onApply(tpl);
    toast.success(t("meals_template_added", lang));
  }

  if (templates.length === 0 && !showSaveForm) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{t("meals_templates", lang)}</h2>
        </div>
        <button
          onClick={() => setShowSaveForm(!showSaveForm)}
          className="text-xs text-primary font-medium flex items-center gap-1"
        >
          {showSaveForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {t("meals_save_template", lang)}
        </button>
      </div>

      {showSaveForm && (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("meals_template_name", lang)}
            className="flex h-9 flex-1 rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleSave}
            disabled={!name.trim() || !currentForm?.description}
            className="px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {t("general_save", lang)}
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("meals_no_templates", lang)}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {templates.map(tpl => (
            <div key={tpl.id} className="group flex items-center gap-1.5 bg-muted/50 rounded-xl pl-3 pr-1 py-1.5">
              <button onClick={() => handleApply(tpl)} className="text-left">
                <span className="text-xs font-medium text-foreground">{tpl.name}</span>
                <span className="text-[10px] text-muted-foreground block">{getMealTypeLabel(tpl.meal_type, lang)}</span>
              </button>
              <button
                onClick={() => handleDelete(tpl.id)}
                className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}