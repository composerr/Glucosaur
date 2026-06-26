const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { Search, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

import { t } from "@/lib/i18n";

const FOOD_EMOJI = {
  "Apple": "🍎", "Orange": "🍊", "Banana": "🍌", "Grapes": "🍇", "Strawberry": "🍓",
  "Blueberry": "🫐", "Watermelon": "🍉", "Mango": "🥭", "Pineapple": "🍍", "Kiwi": "🥝",
  "Pear": "🍐", "Peach": "🍑", "Cherry": "🍒", "Plum": "🫐", "Pomegranate": "🍎",
  "Avocado": "🥑", "Tomato": "🍅", "Cucumber": "🥒", "Carrot": "🥕", "Broccoli": "🥦",
  "Spinach": "🥬", "Cabbage": "🥬", "Pumpkin": "🎃", "Sweet potato": "🍠", "Potato": "🥔",
  "Beet": "🫒", "Corn": "🌽", "Peas": "🫛", "Lentils": "🫘", "Chickpeas": "🫘",
  "Black beans": "🫘", "Soybeans": "🫘", "Peanuts": "🥜", "Almonds": "🥜", "Walnuts": "🥜",
  "Chicken breast": "🍗", "Fish": "🐟", "Egg": "🥚", "Cheese": "🧀", "Milk": "🥛",
  "Yogurt": "🥛", "Bread": "🍞", "Rice": "🍚", "Pasta": "🍝", "Oatmeal": "🥣",
  "Buckwheat": "🫘", "Quinoa": "🍚", "Honey": "🍯", "Sugar": "🍬", "Chocolate": "🍫",
  "Coca-Cola": "🥤", "Orange juice": "🧃", "Beer": "🍺", "Cornflakes": "🥣",
};

const GI_DATABASE = [
  { name: "Glucose / Глюкоза", gi: 100, gl: 10, category: "high", safe: false, emoji: "🍬", foodCat: "sweets" },
  { name: "White bread / Білий хліб", gi: 75, gl: 10, category: "high", safe: false, emoji: "🍞", foodCat: "bread" },
  { name: "White rice / Білий рис", gi: 72, gl: 29, category: "high", safe: false, emoji: "🍚", foodCat: "grains" },
  { name: "Watermelon / Кавун", gi: 72, gl: 4, category: "high", safe: true, emoji: "🍉", foodCat: "fruits" },
  { name: "Cornflakes / Кукурудзяні пластівці", gi: 81, gl: 21, category: "high", safe: false, emoji: "🥣", foodCat: "grains" },
  { name: "Potato (boiled) / Картопля варена", gi: 78, gl: 21, category: "high", safe: false, emoji: "🥔", foodCat: "vegetables" },
  { name: "French fries / Картопля фрі", gi: 63, gl: 22, category: "medium", safe: false, emoji: "🍟", foodCat: "vegetables" },
  { name: "Brown rice / Бурий рис", gi: 50, gl: 16, category: "low", safe: true, emoji: "🍚", foodCat: "grains" },
  { name: "Oatmeal / Вівсянка", gi: 55, gl: 13, category: "low", safe: true, emoji: "🥣", foodCat: "grains" },
  { name: "Apple / Яблуко", gi: 36, gl: 5, category: "low", safe: true, emoji: "🍎", foodCat: "fruits" },
  { name: "Orange / Апельсин", gi: 43, gl: 5, category: "low", safe: true, emoji: "🍊", foodCat: "fruits" },
  { name: "Banana / Банан", gi: 51, gl: 13, category: "low", safe: true, emoji: "🍌", foodCat: "fruits" },
  { name: "Grapes / Виноград", gi: 59, gl: 11, category: "medium", safe: true, emoji: "🍇", foodCat: "fruits" },
  { name: "Strawberry / Полуниця", gi: 40, gl: 1, category: "low", safe: true, emoji: "🍓", foodCat: "fruits" },
  { name: "Blueberry / Чорниця", gi: 53, gl: 5, category: "low", safe: true, emoji: "🫐", foodCat: "fruits" },
  { name: "Carrot (raw) / Морква сира", gi: 16, gl: 1, category: "low", safe: true, emoji: "🥕", foodCat: "vegetables" },
  { name: "Carrot (cooked) / Морква варена", gi: 47, gl: 3, category: "low", safe: true, emoji: "🥕", foodCat: "vegetables" },
  { name: "Pumpkin / Гарбуз", gi: 75, gl: 3, category: "high", safe: true, emoji: "🎃", foodCat: "vegetables" },
  { name: "Broccoli / Броколі", gi: 10, gl: 0, category: "low", safe: true, emoji: "🥦", foodCat: "vegetables" },
  { name: "Tomato / Помідор", gi: 30, gl: 1, category: "low", safe: true, emoji: "🍅", foodCat: "vegetables" },
  { name: "Cucumber / Огірок", gi: 15, gl: 0, category: "low", safe: true, emoji: "🥒", foodCat: "vegetables" },
  { name: "Spinach / Шпинат", gi: 15, gl: 0, category: "low", safe: true, emoji: "🥬", foodCat: "vegetables" },
  { name: "Cabbage / Капуста", gi: 10, gl: 0, category: "low", safe: true, emoji: "🥬", foodCat: "vegetables" },
  { name: "Lentils / Сочевиця", gi: 32, gl: 5, category: "low", safe: true, emoji: "🫘", foodCat: "legumes" },
  { name: "Chickpeas / Нут", gi: 28, gl: 8, category: "low", safe: true, emoji: "🫘", foodCat: "legumes" },
  { name: "Black beans / Чорна квасоля", gi: 30, gl: 7, category: "low", safe: true, emoji: "🫘", foodCat: "legumes" },
  { name: "Soybeans / Соя", gi: 15, gl: 1, category: "low", safe: true, emoji: "🫘", foodCat: "legumes" },
  { name: "Milk (whole) / Молоко", gi: 39, gl: 3, category: "low", safe: true, emoji: "🥛", foodCat: "dairy" },
  { name: "Yogurt (plain) / Йогурт натуральний", gi: 35, gl: 3, category: "low", safe: true, emoji: "🥛", foodCat: "dairy" },
  { name: "Cheese / Сир", gi: 0, gl: 0, category: "low", safe: true, emoji: "🧀", foodCat: "dairy" },
  { name: "Egg / Яйце", gi: 0, gl: 0, category: "low", safe: true, emoji: "🥚", foodCat: "proteins" },
  { name: "Chicken breast / Куряче філе", gi: 0, gl: 0, category: "low", safe: true, emoji: "🍗", foodCat: "meat" },
  { name: "Fish / Риба", gi: 0, gl: 0, category: "low", safe: true, emoji: "🐟", foodCat: "fish" },
  { name: "Pasta (white) / Макарони білі", gi: 49, gl: 24, category: "low", safe: true, emoji: "🍝", foodCat: "grains" },
  { name: "Whole wheat bread / Цільнозерновий хліб", gi: 51, gl: 7, category: "low", safe: true, emoji: "🍞", foodCat: "bread" },
  { name: "Rye bread / Житній хліб", gi: 50, gl: 8, category: "low", safe: true, emoji: "🍞", foodCat: "bread" },
  { name: "Buckwheat / Гречка", gi: 45, gl: 13, category: "low", safe: true, emoji: "🫘", foodCat: "grains" },
  { name: "Quinoa / Кіноа", gi: 53, gl: 13, category: "low", safe: true, emoji: "🍚", foodCat: "grains" },
  { name: "Chocolate (dark) / Шоколад чорний", gi: 23, gl: 6, category: "low", safe: true, emoji: "🍫", foodCat: "sweets" },
  { name: "Honey / Мед", gi: 55, gl: 10, category: "low", safe: false, emoji: "🍯", foodCat: "sweets" },
  { name: "Sugar / Цукор", gi: 65, gl: 7, category: "medium", safe: false, emoji: "🍬", foodCat: "sweets" },
  { name: "Coca-Cola / Кока-Кола", gi: 63, gl: 16, category: "medium", safe: false, emoji: "🥤", foodCat: "drinks" },
  { name: "Orange juice / Апельсиновий сік", gi: 50, gl: 13, category: "low", safe: false, emoji: "🧃", foodCat: "drinks" },
  { name: "Beer / Пиво", gi: 66, gl: 5, category: "medium", safe: false, emoji: "🍺", foodCat: "drinks" },
  { name: "Peanuts / Арахіс", gi: 14, gl: 1, category: "low", safe: true, emoji: "🥜", foodCat: "nuts" },
  { name: "Almonds / Мигдаль", gi: 0, gl: 0, category: "low", safe: true, emoji: "🥜", foodCat: "nuts" },
  { name: "Walnuts / Горіхи волоські", gi: 15, gl: 0, category: "low", safe: true, emoji: "🥜", foodCat: "nuts" },
  { name: "Avocado / Авокадо", gi: 10, gl: 0, category: "low", safe: true, emoji: "🥑", foodCat: "vegetables" },
  { name: "Sweet potato / Батат", gi: 63, gl: 14, category: "medium", safe: true, emoji: "🍠", foodCat: "vegetables" },
  { name: "Corn / Кукурудза", gi: 52, gl: 9, category: "low", safe: true, emoji: "🌽", foodCat: "grains" },
  { name: "Peas / Горох", gi: 54, gl: 4, category: "low", safe: true, emoji: "🫛", foodCat: "legumes" },
  { name: "Mango / Манго", gi: 51, gl: 8, category: "low", safe: true, emoji: "🥭", foodCat: "fruits" },
  { name: "Pineapple / Ананас", gi: 59, gl: 7, category: "medium", safe: true, emoji: "🍍", foodCat: "fruits" },
  { name: "Kiwi / Ківі", gi: 53, gl: 6, category: "low", safe: true, emoji: "🥝", foodCat: "fruits" },
  { name: "Pear / Груша", gi: 38, gl: 4, category: "low", safe: true, emoji: "🍐", foodCat: "fruits" },
  { name: "Peach / Персик", gi: 42, gl: 5, category: "low", safe: true, emoji: "🍑", foodCat: "fruits" },
  { name: "Cherry / Вишня", gi: 22, gl: 3, category: "low", safe: true, emoji: "🍒", foodCat: "fruits" },
  { name: "Plum / Слива", gi: 39, gl: 5, category: "low", safe: true, emoji: "🫐", foodCat: "fruits" },
  { name: "Pomegranate / Гранат", gi: 35, gl: 6, category: "low", safe: true, emoji: "🍎", foodCat: "fruits" },
  { name: "Beet / Буряк", gi: 64, gl: 5, category: "medium", safe: true, emoji: "🫒", foodCat: "vegetables" },
];

const CATEGORY_CONFIG = {
  low: { label_uk: "Низький", label_en: "Low", color: "bg-emerald-100 text-emerald-700" },
  medium: { label_uk: "Середній", label_en: "Medium", color: "bg-amber-100 text-amber-700" },
  high: { label_uk: "Високий", label_en: "High", color: "bg-red-100 text-red-700" },
};

const FOOD_CATEGORIES = [
  { key: "all", icon: "📋" },
  { key: "grains", icon: "🌾" },
  { key: "bread", icon: "🍞" },
  { key: "fruits", icon: "🍎" },
  { key: "vegetables", icon: "🥕" },
  { key: "meat", icon: "🥩" },
  { key: "fish", icon: "🐟" },
  { key: "dairy", icon: "🥛" },
  { key: "legumes", icon: "🫘" },
  { key: "proteins", icon: "🥚" },
  { key: "sweets", icon: "🍫" },
  { key: "drinks", icon: "🥤" },
  { key: "nuts", icon: "🥜" },
];

export default function GIFoodSearch({ lang }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [aiResult, setAiResult] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const byCategory = activeCat === "all" ? GI_DATABASE : GI_DATABASE.filter(f => f.foodCat === activeCat);
  const filtered = query.length >= 2
    ? byCategory.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    : byCategory;

  const showAiSearch = query.length >= 2 && filtered.length === 0;

  async function searchWithAI() {
    setLoadingAi(true);
    setAiResult(null);
    const res = await db.integrations.Core.InvokeLLM({
      prompt: lang === "uk"
        ? `Надай дані глікемічного індексу для продукту: "${query}". Відповідай ТІЛЬКИ JSON без markdown.`
        : `Provide glycemic index data for food: "${query}". Reply ONLY with JSON, no markdown.`,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          gi: { type: "number" },
          gl: { type: "number" },
          gi_category: { type: "string" },
          safe_for_diabetics: { type: "boolean" },
          portion: { type: "string" },
          comment: { type: "string" }
        }
      }
    });
    setAiResult(res);
    setLoadingAi(false);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setAiResult(null); }}
          placeholder={lang === "uk" ? "Пошук продукту (напр. яблуко, рис...)" : "Search food (e.g. apple, rice...)"}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FOOD_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => { setActiveCat(cat.key); setQuery(""); setAiResult(null); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCat === cat.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.icon} {t(`cat_${cat.key}`, lang)}
          </button>
        ))}
      </div>

      {query.length >= 1 && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((food, i) => {
            const cat = CATEGORY_CONFIG[food.category];
            return (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{food.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">{food.name.split(" / ")[lang === "uk" ? 1 : 0] || food.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">ГІ {food.gi}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                    {lang === "uk" ? cat.label_uk : cat.label_en}
                  </span>
                  {food.safe ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show all products when not searching */}
      {query.length < 1 && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((food, i) => {
            const cat = CATEGORY_CONFIG[food.category];
            const name = lang === "uk" ? (food.name.split(" / ")[1] || food.name) : (food.name.split(" / ")[0] || food.name);
            return (
              <div key={i} className="bg-card rounded-xl border border-border/50 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{food.emoji}</span>
                  <span className="text-sm font-medium text-foreground truncate">{name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">ГІ {food.gi}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                    {lang === "uk" ? cat.label_uk : cat.label_en}
                  </span>
                  {food.safe ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAiSearch && !aiResult && (
        <div className="bg-muted/40 rounded-xl p-4 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {lang === "uk" ? "Продукт не знайдено в базі. Знайти через AI?" : "Not found in database. Search with AI?"}
          </p>
          <button onClick={searchWithAI} disabled={loadingAi} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
            {loadingAi && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === "uk" ? "Пошук AI" : "AI Search"}
          </button>
        </div>
      )}

      {aiResult && (
        <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {aiResult.safe_for_diabetics ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
              <span className="font-semibold text-foreground">{aiResult.name}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_CONFIG[aiResult.gi_category]?.color || "bg-muted text-muted-foreground"}`}>
              ГІ {aiResult.gi}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">ГІ</p><p className="font-bold text-foreground">{aiResult.gi}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">ГН</p><p className="font-bold text-foreground">{aiResult.gl}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">{lang === "uk" ? "Порція" : "Portion"}</p>
              <p className="text-xs font-bold text-foreground">{aiResult.portion}</p>
            </div>
          </div>
          {aiResult.comment && <p className="text-sm text-muted-foreground">{aiResult.comment}</p>}
        </div>
      )}
    </div>
  );
}