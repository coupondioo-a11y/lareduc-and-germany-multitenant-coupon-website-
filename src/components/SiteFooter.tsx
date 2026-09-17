import Link from "next/link";
import { SiteLogo } from "./SiteLogo";

const columns = [
  {
    title: "Découvrir",
    links: [
      { label: "Tous les magasins", href: "/all-stores/a/" },
      { label: "Top codes", href: "/#top-codes" },
      { label: "Nouveautés", href: "/#nouveautes" },
      { label: "Catégories", href: "/#categories" },
    ],
  },
  {
    title: "À propos",
    links: [
      { label: "Notre méthode", href: "/a-propos/" },
      { label: "Contact", href: "/contact/" },
      { label: "Mentions légales", href: "/mentions-legales/" },
      { label: "Confidentialité", href: "/confidentialite/" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-hero-deep text-white">
      <div className="mx-auto max-w-shell px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <SiteLogo size="sm" />
            <p className="mt-3 text-[15px] leading-relaxed text-white/60">
              31 377 codes promo actifs sur 7 210 boutiques, testés automatiquement puis confirmés à
              la main.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-14 gap-y-8">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/45">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2 text-[15px]">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-white/80 transition-colors duration-200 hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-[13px] leading-relaxed text-white/45">
          Certains liens de ce site sont des liens d&apos;affiliation : un achat effectué après un
          clic peut nous rémunérer, sans surcoût pour vous. Cela n&apos;influence pas la vérification
          des codes.
          <br />© {new Date().getFullYear()} LaReduc.fr
        </p>
      </div>
    </footer>
  );
}
