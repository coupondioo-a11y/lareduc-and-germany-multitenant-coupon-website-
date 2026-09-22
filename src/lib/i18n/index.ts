import type { Dictionary } from "./types";
import fr from "./dictionaries/fr";
import de from "./dictionaries/de";

const dictionaries: Record<string, Dictionary> = { fr, de };

export function getDictionary(language: string): Dictionary {
  return dictionaries[language] ?? fr;
}

export type { Dictionary };
