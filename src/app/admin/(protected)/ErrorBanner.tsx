const MESSAGES: Record<string, string> = {
  duplicate: "Ce nom existe déjà pour ce site.",
  duplicate_ip: "Cette adresse IP est déjà dans la liste.",
  duplicate_domain: "Ce pays ou ce domaine existe déjà.",
  confirm_mismatch: "Le code tapé ne correspond pas. Réessayez.",
  self_deactivate: "Vous ne pouvez pas désactiver votre propre compte.",
  name_required: "Le nom est requis.",
  no_table: "La table events n'existe pas encore (migration 0004).",
  duplicate_user: "Un utilisateur avec cet email existe déjà.",
};

export function ErrorBanner({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {MESSAGES[code] ?? "Une erreur est survenue."}
    </p>
  );
}
