const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { Camera, Loader2, Search, AlertTriangle, CheckCircle } from "lucide-react";
import MascotHint from "@/components/MascotHint";
import { Button } from "@/components/ui/button";
import GIFoodSearch from "@/components/GIFoodSearch";

export default function GlycemicIndex({ settings }) {
  const lang = settings.language;
  const [tab, setTab] = useState("photo");
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
    setResult(null);
  }

  async function analyze() {
    if (!image) return;
    setLoading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file: image });
    const res = await db.integrations.Core.InvokeLLM({
      prompt: lang === "uk"
        ? `Визнач продукт(и) харчування на фото. Для кожного продукту надай дані у форматі JSON. Відповідай ЛИШЕ JSON, без Markdown. Формат: { "products": [ { "name": "Назва продукту", "gi": 55, "gl": 10, "gi_category": "low|medium|high", "safe_for_diabetics": true, "portion": "100г", "comment": "Короткий коментар українською" } ], "summary": "Загальний висновок 1-2 речення" }`
        : `Identify food product(s) in this photo. For each product provide data in JSON format. Reply ONLY with JSON, no Markdown. Format: { "products": [ { "name": "Product name", "gi": 55, "gl": 10, "gi_category": "low|medium|high", "safe_for_diabetics": true, "portion": "100g", "comment": "Short comment" } ], "summary": "1-2 sentence overall conclusion" }`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
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
          },
          summary: { type: "string" }
        }
      }
    });
    setResult(res);
    setLoading(false);
  }

  function GIBadge({ category, gi }) {
    const config = {
      low: { label: lang === "uk" ? "Низький" : "Low", color: "bg-emerald-100 text-emerald-700" },
      medium: { label: lang === "uk" ? "Середній" : "Medium", color: "bg-amber-100 text-amber-700" },
      high: { label: lang === "uk" ? "Високий" : "High", color: "bg-red-100 text-red-700" },
    };
    const c = config[category] || config.medium;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.color}`}>
        ГІ {gi} · {c.label}
      </span>
    );
  }

  function SafetyIcon({ safe }) {
    if (safe) return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
    return <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />;
  }

  return (
    <div className="space-y-5">
      <MascotHint
        show={settings.show_mascot !== false}
        lang={lang}
        ukText="🦖 Дізнайся глікемічний індекс будь-якого продукту! Сфотографуй або пошукай в базі. Низький ГІ — краще для цукру! 🍎"
        enText="🦖 Check the glycemic index of any food! Take a photo or search the database. Low GI = better for blood sugar! 🍎"
      />
      <h1 className="text-xl font-bold text-foreground">
        {lang === "uk" ? "Глікемічний індекс" : "Glycemic Index"}
      </h1>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("photo")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "photo" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {lang === "uk" ? "📷 Фото" : "📷 Photo"}
        </button>
        <button
          onClick={() => setTab("search")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            tab === "search" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {lang === "uk" ? "🔍 База продуктів" : "🔍 Food Database"}
        </button>
      </div>

      {/* Search tab */}
      {tab === "search" && (
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <GIFoodSearch lang={lang} />
        </div>
      )}

      {/* Photo tab */}
      {tab === "photo" && (
        <>
          <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {lang === "uk"
                ? "Сфотографуй продукт — дізнайся його ГІ та чи він підходить для твоєї дієти."
                : "Take a photo of a food product to instantly learn its glycemic index."}
            </p>

            <label className="block cursor-pointer">
              <div className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-8 transition-colors hover:border-primary ${imageUrl ? "border-primary/50" : "border-border"}`}>
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="max-h-48 rounded-lg object-cover" />
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {lang === "uk" ? "Натисни щоб вибрати фото" : "Tap to select a photo"}
                    </span>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            <Button onClick={analyze} disabled={!image || loading} className="w-full rounded-xl">
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{lang === "uk" ? "Аналізую..." : "Analyzing..."}</>
                : <><Search className="w-4 h-4 mr-2" />{lang === "uk" ? "Визначити ГІ" : "Check GI"}</>
              }
            </Button>
          </div>

          {result && result.products && (
            <div className="space-y-3">
              {result.products.map((p, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <SafetyIcon safe={p.safe_for_diabetics} />
                      <span className="text-base font-semibold text-foreground truncate">{p.name}</span>
                    </div>
                    <GIBadge category={p.gi_category} gi={p.gi} />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">{lang === "uk" ? "ГІ" : "GI"}</p>
                      <p className="text-lg font-bold text-foreground">{p.gi}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">{lang === "uk" ? "ГН" : "GL"}</p>
                      <p className="text-lg font-bold text-foreground">{p.gl}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">{lang === "uk" ? "Порція" : "Portion"}</p>
                      <p className="text-sm font-bold text-foreground">{p.portion}</p>
                    </div>
                  </div>

                  <div className={`rounded-xl px-3 py-2 text-xs font-medium ${p.safe_for_diabetics ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {p.safe_for_diabetics
                      ? (lang === "uk" ? "✓ Підходить для діабетиків" : "✓ Safe for diabetics")
                      : (lang === "uk" ? "✗ Не рекомендується при діабеті" : "✗ Not recommended for diabetics")}
                  </div>

                  {p.comment && <p className="text-sm text-muted-foreground">{p.comment}</p>}
                </div>
              ))}

              {result.summary && (
                <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4">
                  <p className="text-sm font-medium text-foreground">{result.summary}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}