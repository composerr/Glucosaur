import { uk } from "date-fns/locale";
import { de } from "date-fns/locale";
import { fr } from "date-fns/locale";
import { es } from "date-fns/locale";

const LOCALES = { uk, de, fr, es };

export function getDateLocale(lang) {
  return LOCALES[lang] || undefined;
}