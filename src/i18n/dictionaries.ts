import "server-only";
import type { Locale } from "./config";
import fr from "../../messages/fr.json";

export type Dictionary = typeof fr;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: async () => fr,
  en: () => import("../../messages/en.json").then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
