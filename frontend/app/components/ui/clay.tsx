import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cx } from "@/lib/cx";

type Color = "blue" | "mint" | "lavender" | "peach";

const FONDO: Record<Color, string> = {
  blue: "bg-(--sw-blue-pastel)",
  mint: "bg-(--sw-mint)",
  lavender: "bg-(--sw-lavender)",
  peach: "bg-(--sw-peach)",
};

export function ClayCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx("clay p-6", className)}>{children}</div>;
}

/** Clases del boton clay, reutilizables tambien en <Link> (next/link no acepta className via componente). */
export function clayBtnClass(variant: "primario" | "secundario" = "primario") {
  return cx(
    "clay-sm clay-btn inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-(--sw-ink)",
    variant === "primario" ? "bg-(--sw-blue-pastel)" : "bg-(--sw-surface)",
  );
}

export function ClayButton({
  className,
  variant = "primario",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primario" | "secundario";
}) {
  return <button className={cx(clayBtnClass(variant), className)} {...props} />;
}

export function ClayInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "clay-input h-10 w-full px-3 text-sm text-(--sw-ink) outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function ClayTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        "clay-input min-h-28 w-full px-3 py-2 text-sm text-(--sw-ink) outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function ClaySelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "clay-input h-10 w-full px-3 text-sm text-(--sw-ink) outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function ClayField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-(--sw-ink-soft)">
      {label}
      {children}
    </label>
  );
}

export function ClayBadge({
  children,
  color = "blue",
}: {
  children: ReactNode;
  color?: Color;
}) {
  return (
    <span
      className={cx(
        "clay-press inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-(--sw-ink)",
        FONDO[color],
      )}
    >
      {children}
    </span>
  );
}

/** Aviso consistente para secciones cuyo endpoint DRF todavia no existe. */
export function AvisoPendiente({ children }: { children: ReactNode }) {
  return (
    <div className="clay-sm border-l-4 border-(--sw-peach) p-4 text-sm">
      <p className="font-semibold text-(--sw-ink)">Backend pendiente</p>
      <p className="mt-1 text-(--sw-ink-soft)">{children}</p>
    </div>
  );
}
