import { t } from "@/lib/i18n";

export default function GlucoseStatusBadge({ value, min, max, lang }) {
  let status, colorClass;
  if (value < min) {
    status = t("dash_below", lang);
    colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  } else if (value > max) {
    status = t("dash_above", lang);
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  } else {
    status = t("dash_in_range", lang);
    colorClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}