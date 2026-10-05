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
  return <div className={cx("clay p-5 sm:p-6", className)}>{children}</div>;
}

export type VarianteBoton = "primario" | "secundario" | "coral";

const FONDO_BOTON: Record<VarianteBoton, string> = {
  primario: "bg-(--sw-accent) text-(--sw-on-accent)",
  secundario: "bg-(--sw-surface) text-(--sw-ink)",
  coral: "bg-(--sw-coral) text-(--sw-on-accent)",
};

/** Clases del boton, reutilizables tambien en <Link> (next/link no acepta className via componente). */
export function clayBtnClass(variant: VarianteBoton = "primario") {
  return cx(
    "clay-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-5 text-sm font-extrabold sm:min-h-10",
    FONDO_BOTON[variant],
  );
}

export function ClayButton({
  className,
  variant = "primario",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: VarianteBoton;
}) {
  return <button className={cx(clayBtnClass(variant), className)} {...props} />;
}

export function ClayInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "clay-input h-11 w-full px-3 text-base text-(--sw-ink) outline-none sm:h-10 sm:text-sm",
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
        "clay-input min-h-28 w-full px-3 py-2 text-base text-(--sw-ink) outline-none sm:text-sm",
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
        "clay-input h-11 w-full px-3 text-base text-(--sw-ink) outline-none sm:h-10 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function ClayField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-extrabold tracking-[0.08em] text-(--sw-ink-soft) uppercase">
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
        "clay-press inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-(--sw-ink)",
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
    <div className="clay-sm border-l-8 border-l-(--sw-coral) p-4 text-sm">
      <p className="font-extrabold text-(--sw-ink)">Backend pendiente</p>
      <p className="mt-1 text-(--sw-ink-soft)">{children}</p>
    </div>
  );
}

export function Encabezado({
  eyebrow,
  titulo,
  children,
  acciones,
}: {
  eyebrow: string;
  titulo: string;
  children?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b-2 border-(--sw-line) pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="sw-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-sans text-4xl leading-[0.98] font-black tracking-[-0.045em] text-(--sw-ink) sm:text-5xl">
          {titulo}
        </h1>
        {children && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-(--sw-ink-soft)">{children}</p>
        )}
      </div>
      {acciones}
    </header>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("font-sans font-black tracking-[-0.04em] text-(--sw-ink)", className)}>
      SmartWash<span className="text-(--sw-coral)">.</span>
    </span>
  );
}
