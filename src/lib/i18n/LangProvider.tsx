"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "./types";

const LangContext = createContext<Dictionary | null>(null);

export function LangProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary;
  children: ReactNode;
}) {
  return <LangContext.Provider value={dictionary}>{children}</LangContext.Provider>;
}

/** Client components read chrome strings from here; server components call getDictionary() directly. */
export function useDictionary(): Dictionary {
  const dict = useContext(LangContext);
  if (!dict) {
    throw new Error("useDictionary() called outside <LangProvider> — wrap the root layout with it.");
  }
  return dict;
}
