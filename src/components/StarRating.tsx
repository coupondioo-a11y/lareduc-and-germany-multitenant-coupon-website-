import { Star } from "lucide-react";

export function StarRating({
  value,
  count,
  showCount = true,
}: {
  value: number;
  count?: number;
  showCount?: boolean;
}) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={15}
            className={i <= rounded ? "fill-gold text-gold" : "text-hair"}
          />
        ))}
      </span>
      <span>
        <span className="font-medium text-ink">{value.toLocaleString("fr-FR")}</span>
        {showCount && count != null ? ` · ${count} avis` : ""}
      </span>
    </span>
  );
}
