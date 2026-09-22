import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SearchField } from "./SearchField";
import { SiteLogo } from "./SiteLogo";

export function SiteHeader({ brandName }: { brandName: string }) {
  return (
    <header className="bg-hero-deep text-white">
      <div className="mx-auto flex max-w-shell items-center gap-6 px-4 py-4 sm:px-6">
        <Link href="/" aria-label={`${brandName} — accueil`} className="shrink-0 rounded-card">
          <SiteLogo />
        </Link>

        <nav aria-label="Navigation principale" className="ml-auto hidden items-center gap-7 text-[15px] font-medium md:flex">
          <Link href="/all-stores/a/" className="inline-flex items-center gap-1 text-white/85 transition-colors duration-200 hover:text-white">
            Tous les magasins
            <ChevronDown size={15} aria-hidden />
          </Link>
          <Link href="/#top-codes" className="text-white/85 transition-colors duration-200 hover:text-white">
            Top codes
          </Link>
          <Link href="/#nouveautes" className="text-white/85 transition-colors duration-200 hover:text-white">
            Nouveautés
          </Link>
        </nav>

        <div className="ml-auto w-full max-w-xs md:ml-0 md:hidden lg:block lg:w-72">
          <SearchField tone="dark" size="sm" placeholder="Rechercher un magasin" />
        </div>
      </div>

      {/* Mobile: the desktop nav collapses, so surface the same links as a rail */}
      <nav aria-label="Navigation principale (mobile)" className="border-t border-white/10 md:hidden">
        <ul className="rail gap-5 px-4 py-2.5 text-[14px] font-medium">
          <li><Link href="/all-stores/a/" className="whitespace-nowrap text-white/85">Tous les magasins</Link></li>
          <li><Link href="/#top-codes" className="whitespace-nowrap text-white/85">Top codes</Link></li>
          <li><Link href="/#nouveautes" className="whitespace-nowrap text-white/85">Nouveautés</Link></li>
          <li><Link href="/#categories" className="whitespace-nowrap text-white/85">Catégories</Link></li>
        </ul>
      </nav>
    </header>
  );
}
