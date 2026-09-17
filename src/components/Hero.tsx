import Link from "next/link";
import { LogoMarquee } from "./LogoMarquee";
import { SearchField } from "./SearchField";

export function Hero() {
  return (
    <section className="bg-hero pb-36 pt-14 text-white sm:pt-20">
      <div className="mx-auto max-w-shell px-4 text-center sm:px-6">
        <h1 className="mx-auto max-w-3xl text-[32px] leading-[1.1] sm:text-5xl">
          <span className="font-normal text-white/85">Tous les </span>
          <span className="font-extrabold">codes promo &amp; réductions</span>
          <span className="font-normal text-white/85"> en un coup d&apos;œil</span>
        </h1>

        <div className="mx-auto mt-8 max-w-xl">
          <SearchField tone="dark" placeholder="Rechercher" />
        </div>

        <p className="mt-5 text-[15px] text-white/80">
          ou découvrez toutes les{" "}
          <Link href="/all-stores/a/" className="text-accent-soft underline-offset-2 hover:underline">
            boutiques &amp; marques
          </Link>
          .
        </p>
        <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-white/55">
          Lorsque vous cliquez sur une de nos offres et effectuez un achat, nous pouvons percevoir
          une commission, sans surcoût pour vous.
        </p>
      </div>

      <div className="mt-10">
        <LogoMarquee />
      </div>
    </section>
  );
}
