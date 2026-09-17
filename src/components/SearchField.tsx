"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchField({
  size = "lg",
  tone = "light",
  placeholder = "Rechercher une marque ou un magasin",
}: {
  size?: "lg" | "sm";
  tone?: "light" | "dark";
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    // No dedicated search page in the preview yet — the A–Z index stands in.
    router.push(term ? `/all-stores/${term[0].toLowerCase()}/` : "/all-stores/a/");
  }

  const box =
    tone === "dark"
      ? "border-white/15 bg-white/10 text-white placeholder:text-white/55 focus:border-white/40"
      : "border-hair bg-paper text-ink placeholder:text-ink-soft focus:border-primary";
  const icon = tone === "dark" ? "text-white/60" : "text-ink-soft";
  const dims = size === "lg" ? "h-14 pl-12 pr-4 text-[17px]" : "h-11 pl-10 pr-4 text-[15px]";

  return (
    <form onSubmit={onSubmit} role="search" className="w-full">
      <div className="relative flex items-center">
        <Search
          size={size === "lg" ? 20 : 17}
          aria-hidden
          className={`pointer-events-none absolute ${size === "lg" ? "left-4" : "left-3.5"} ${icon}`}
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${dims} ${box} w-full rounded-full border outline-none transition-colors duration-200`}
        />
      </div>
    </form>
  );
}
