/** LaReduc mark: a percent sign whose slash ends in a downward arrow — prices going down. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="9" fill="#EA580C" />
      <path d="M9 0h14a9 9 0 0 1 9 9v5H0V9a9 9 0 0 1 9-9z" fill="#fff" opacity=".14" />
      <circle cx="11.5" cy="11.5" r="3.2" fill="#fff" />
      <circle cx="20.5" cy="20.5" r="3.2" fill="#fff" />
      <path
        d="M21.5 9.5 10.5 22.5M10.5 18.5v4h4"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SiteLogo({ size = "md" }: { size?: "md" | "sm" }) {
  const md = size === "md";
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={md ? 30 : 26} />
      <span className={`font-extrabold tracking-tight text-white ${md ? "text-xl" : "text-lg"}`}>
        la<span className="text-accent">reduc</span>
        <span className={`align-super font-bold text-white/60 ${md ? "text-[10px]" : "text-[9px]"}`}>.fr</span>
      </span>
    </span>
  );
}
