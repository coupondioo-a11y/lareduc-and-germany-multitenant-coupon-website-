"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Preview only — the real handler writes via the admin (service-role) client.
    if (!/.+@.+\..+/.test(email)) {
      setState("error");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <p className="text-[15px] text-white">
        C&apos;est noté. Vous recevrez les meilleurs codes de la semaine, sans plus.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="nl-email" className="sr-only">
        Adresse e-mail
      </label>
      <input
        id="nl-email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "error") setState("idle");
        }}
        placeholder="vous@exemple.fr"
        aria-invalid={state === "error"}
        className="h-12 flex-1 rounded-full border border-white/15 bg-white/10 px-5 text-base text-white outline-none placeholder:text-white/50 focus:border-white/40"
      />
      <button
        type="submit"
        className="h-12 shrink-0 rounded-full bg-accent px-6 font-bold text-hero-deep transition-opacity duration-200 hover:opacity-90"
      >
        S&apos;inscrire
      </button>
      {state === "error" ? (
        <p className="text-sm text-accent-soft sm:sr-only" role="alert">
          Entrez une adresse e-mail valide pour continuer.
        </p>
      ) : null}
    </form>
  );
}
