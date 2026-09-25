"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toggleField, type ActionResult } from "./row-actions";

export function ToggleSwitch({
  table,
  id,
  field,
  value,
  label,
  tone = "green",
}: {
  table: "stores" | "coupons";
  id: string;
  field: string;
  value: boolean;
  label: string;
  tone?: "green" | "amber";
}) {
  const [on, setOn] = useState(value);
  const [pending, startTransition] = useTransition();

  function flip() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const r = await toggleField(table, id, field, next);
      if (!r.ok) {
        setOn(!next);
        alert(r.error ?? "Échec de la mise à jour");
      }
    });
  }

  const onColor = tone === "green" ? "bg-emerald-500" : "bg-amber-400";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={flip}
      disabled={pending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-60 ${
        on ? onColor : "bg-neutral-600/50"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/** Icon button that runs a server action, shows a spinner while it works, then refreshes the list. */
export function ActionButton({
  action,
  title,
  confirmMessage,
  children,
  danger = false,
}: {
  action: () => Promise<ActionResult>;
  title: string;
  confirmMessage?: string;
  children: ReactNode;
  danger?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    if (confirmMessage && !confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        const r = await action();
        if (!r.ok) alert(r.error ?? "Échec de l'action");
      } catch (err) {
        alert((err as Error).message);
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={run}
      disabled={pending}
      className={`inline-flex h-7 w-7 items-center justify-center rounded transition-colors disabled:opacity-60 ${
        danger ? "text-neutral-500 hover:text-red-400" : "text-neutral-500 hover:text-amber-300"
      }`}
    >
      {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : children}
    </button>
  );
}

export function SelectAll({ formId }: { formId: string }) {
  return (
    <input
      type="checkbox"
      aria-label="Tout sélectionner"
      onChange={(e) => {
        const form = document.getElementById(formId);
        form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((box) => {
          box.checked = e.currentTarget.checked;
        });
      }}
    />
  );
}
