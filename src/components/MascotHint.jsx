import Glucosaur from "@/components/Glucosaur";

export default function MascotHint({ show, ukText, enText, lang }) {
  if (!show) return null;
  return (
    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 px-4 py-3">
      <Glucosaur size={44} className="shrink-0" />
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
        {lang === "uk" ? ukText : enText}
      </p>
    </div>
  );
}