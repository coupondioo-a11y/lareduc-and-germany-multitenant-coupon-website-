import { ListChecks, PiggyBank, Tag } from "lucide-react";
import { siteStats } from "@/lib/fixtures";

const items = [
  { Icon: Tag, figure: siteStats.codesUsed, note: siteStats.codesUsedNote },
  { Icon: PiggyBank, figure: siteStats.saved, note: siteStats.savedNote },
  { Icon: ListChecks, figure: siteStats.verified, note: siteStats.verifiedNote },
];

export function StatBand() {
  return (
    <section className="border-y border-hair bg-paper py-14">
      <div className="mx-auto grid max-w-shell gap-10 px-4 sm:px-6 md:grid-cols-3">
        {items.map(({ Icon, figure, note }) => (
          <div key={figure} className="text-center">
            <Icon size={40} strokeWidth={1.75} className="mx-auto text-gold" aria-hidden />
            <p className="mt-4 text-[28px] font-extrabold text-gold">{figure}</p>
            <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-ink-soft">{note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
