import { useLocale } from "next-intl";
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";

const translations = { en, ru };

export function useTranslation() {
  const locale = useLocale();
  return translations[(locale || "en") as keyof typeof translations];
}
