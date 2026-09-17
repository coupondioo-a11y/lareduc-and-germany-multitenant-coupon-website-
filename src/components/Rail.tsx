"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Rail({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  }

  const arrow =
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-hair bg-paper text-ink shadow-lift transition-colors duration-200 hover:bg-surface lg:inline-flex";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${label} : précédent`}
        onClick={() => scroll(-1)}
        className={`${arrow} -left-5`}
      >
        <ChevronLeft size={20} aria-hidden />
      </button>

      <div ref={ref} className="rail -mx-4 gap-4 px-4 pb-1 sm:mx-0 sm:px-0" aria-label={label} role="group">
        {children}
      </div>

      <button
        type="button"
        aria-label={`${label} : suivant`}
        onClick={() => scroll(1)}
        className={`${arrow} -right-5`}
      >
        <ChevronRight size={20} aria-hidden />
      </button>
    </div>
  );
}
