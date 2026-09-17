import Link from "next/link";
import { BrandTile } from "./BrandMark";
import { stores } from "@/lib/fixtures";

/**
 * Full-bleed running logo bar. The track holds the list twice so the
 * -50% keyframe loops seamlessly; the duplicate is hidden from a11y.
 * Reduced motion turns it into a manually scrollable row (globals.css).
 */
export function LogoMarquee() {
  const lane = [...stores, ...stores];

  return (
    <div className="marquee w-full py-2">
      <ul className="marquee-track gap-4 px-4">
        {lane.map((s, i) => (
          <li key={`${s.slug}-${i}`} aria-hidden={i >= stores.length ? true : undefined}>
            <Link
              href={`/store/${s.slug}/`}
              aria-label={i >= stores.length ? undefined : `Codes promo ${s.name}`}
              tabIndex={i >= stores.length ? -1 : undefined}
              className="block"
            >
              <BrandTile
                store={s}
                width={132}
                height={72}
                className="shadow-lift transition-transform duration-200 hover:-translate-y-1"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
