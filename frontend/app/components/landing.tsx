import Link from "next/link";

import { ClayCard, Wordmark, clayBtnClass } from "./ui/clay";

const PASOS = [
  { numero: "01", titulo: "Entregas tus prendas", texto: "En el punto o donde acordemos la recogida." },
  { numero: "02", titulo: "Te damos un codigo", texto: "Sirve para rastrear tu pedido sin necesidad de una cuenta." },
  { numero: "03", titulo: "Lavamos y revisamos", texto: "Cada prenda pasa por control de calidad antes de salir." },
  { numero: "04", titulo: "Recibes tus prendas", texto: "Listas, en el plazo que te confirmamos al recibir la orden." },
];

const PREGUNTAS = [
  {
    pregunta: "Como hago seguimiento a mi pedido?",
    respuesta:
      "Con el codigo que te damos al recibir tus prendas, en \"Rastrear mi pedido\". No necesitas crear una cuenta.",
  },
  {
    pregunta: "Cuanto se demora el servicio?",
    respuesta:
      "Depende del tipo de prenda y del servicio. Te confirmamos una fecha estimada de entrega al recibir la orden.",
  },
  {
    pregunta: "Tienen programa de puntos?",
    respuesta:
      "Si, la fidelizacion aplica descuentos segun tu historial con nosotros. Se calcula automaticamente en tus ordenes.",
  },
  {
    pregunta: "Como radico una queja o reclamo?",
    respuesta: "Desde la seccion PQRS de esta pagina, con o sin el codigo de tu pedido.",
  },
];

const ETAPAS_EJEMPLO = ["Recibida", "En proceso", "Control de calidad", "Lista"];

function Titular({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-3 border-b-2 border-(--sw-line) pb-8">
      <p className="sw-eyebrow">{eyebrow}</p>
      <h2 className="font-sans text-4xl leading-[0.98] font-black tracking-[-0.045em] text-(--sw-ink) sm:text-6xl">
        {children}
      </h2>
    </div>
  );
}

export function Landing() {
  return (
    <main>
      <section className="sw-guias relative overflow-hidden border-b-2 border-(--sw-line) px-4 pt-12 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
        <div className="sw-rayas pointer-events-none absolute inset-x-0 top-0 h-28" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="sw-eyebrow flex items-center gap-2">
              Gestion y fidelizacion de lavanderia
              <span className="sw-cursor inline-block h-3 w-0.5 bg-(--sw-coral)" aria-hidden="true" />
            </p>
            <h1 className="mt-5 font-sans text-[clamp(2.75rem,10vw,6.5rem)] leading-[0.92] font-black tracking-[-0.05em] text-(--sw-ink)">
              Tus prendas,
              <br />
              con{" "}
              <span className="sw-resalta">rastro</span>
              <br />
              de punta a punta<span className="text-(--sw-coral)">.</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-(--sw-ink-soft)">
              Entrega tus prendas, recibe un codigo de rastreo y sigue el estado de tu pedido
              cuando quieras, sin filas ni llamadas.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/rastrear-pedido" className={clayBtnClass("coral") + " h-12 px-7"}>
                Rastrear mi pedido <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="#servicios"
                className="text-sm font-extrabold tracking-[0.04em] text-(--sw-ink) uppercase underline decoration-(--sw-accent) decoration-2 underline-offset-4"
              >
                Ver servicios
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-(--sw-hairline) pt-5 text-[11px] font-extrabold tracking-[0.08em] text-(--sw-ink-soft) uppercase">
              <li>Sin cuenta</li>
              <li className="border-l border-(--sw-hairline) pl-5">Codigo de rastreo</li>
              <li className="border-l border-(--sw-hairline) pl-5">Control de calidad</li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-sm py-8 lg:max-w-none">
            <p className="mb-3 text-right text-[10px] font-extrabold tracking-[0.12em] text-(--sw-ink-soft) uppercase">
              Fig. 01 — Ejemplo de seguimiento
            </p>
            <div className="sw-marcas">
              <div
                className="sw-flota absolute -top-2 right-0 z-10 flex items-center gap-2 rounded-full border-2 border-(--sw-line) bg-(--sw-sun) px-3 py-1.5 text-[11px] font-black text-(--sw-on-accent) sm:-right-3"
                style={{ "--sw-rot": "3deg" } as React.CSSProperties}
                aria-hidden="true"
              >
                <span className="size-2 rounded-full bg-(--sw-on-accent)" />
                Sin filas
              </div>
              <div
                className="sw-flota absolute -bottom-3 left-0 z-10 flex items-center gap-2 rounded-full border-2 border-(--sw-line) bg-(--sw-mint) px-3 py-1.5 text-[11px] font-black text-(--sw-ink) sm:-left-4"
                style={{ "--sw-rot": "-3deg", animationDelay: "-2s" } as React.CSSProperties}
                aria-hidden="true"
              >
                ✓ Lista para entrega
              </div>

              <div
                className="clay-lg relative z-[2] -rotate-2 p-6 transition-transform duration-300 hover:rotate-0"
                aria-hidden="true"
              >
                <p className="sw-eyebrow">Pedido</p>
                <p className="mt-1 font-sans text-3xl font-black tracking-[-0.04em] text-(--sw-ink) tabular-nums sm:text-4xl">
                  SW-2026-00123
                </p>
                <ol className="mt-6 border-t-2 border-(--sw-line)">
                  {ETAPAS_EJEMPLO.map((etapa, indice) => {
                    const hecha = indice < 2;
                    const actual = indice === 2;
                    return (
                      <li
                        key={etapa}
                        className="flex items-center gap-3 border-b border-(--sw-hairline) py-3 text-sm font-bold text-(--sw-ink)"
                      >
                        <span
                          className={
                            hecha
                              ? "grid size-6 place-items-center rounded-full border-2 border-(--sw-line) bg-(--sw-accent) text-[10px] font-black text-(--sw-on-accent)"
                              : actual
                                ? "grid size-6 place-items-center rounded-full border-2 border-(--sw-coral) text-[10px] font-black text-(--sw-coral)"
                                : "grid size-6 place-items-center rounded-full border-2 border-(--sw-hairline) text-[10px] font-black text-(--sw-ink-soft)"
                          }
                        >
                          {indice + 1}
                        </span>
                        <span className={hecha || actual ? "" : "text-(--sw-ink-soft)"}>{etapa}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="scroll-mt-20 px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Titular eyebrow="Nuestros servicios">
            Un servicio
            <br />
            para cada prenda.
          </Titular>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
            <div className="relative overflow-hidden rounded-3xl border-2 border-(--sw-line) bg-(--sw-deep) p-6 text-(--sw-on-deep) sm:col-span-2 sm:p-8 lg:row-span-2">
              <span
                className="pointer-events-none absolute -top-6 -right-2 font-sans text-[10rem] leading-none font-black text-white/[0.06] select-none sm:text-[14rem]"
                aria-hidden="true"
              >
                01
              </span>
              <p className="relative text-[11px] font-extrabold tracking-[0.12em] text-(--sw-accent) uppercase">
                01 / Lavado
              </p>
              <h3 className="relative mt-16 font-sans text-3xl leading-[0.98] font-black tracking-[-0.04em] sm:mt-24 sm:text-5xl">
                Cada tela,
                <br />
                su programa.
              </h3>
              <p className="relative mt-4 max-w-sm text-sm leading-relaxed text-(--sw-on-deep-soft)">
                Lavado por tipo de prenda, con el detergente y el programa adecuados para cada tela.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border-2 border-(--sw-line) bg-(--sw-accent) p-6 text-(--sw-on-accent)">
              <span
                className="pointer-events-none absolute -right-8 -bottom-8 size-28 rounded-full border-4 border-(--sw-on-accent)/15"
                aria-hidden="true"
              />
              <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase">02 / Planchado</p>
              <h3 className="mt-8 font-sans text-2xl leading-[1.02] font-black tracking-[-0.03em]">
                Listas para usar.
              </h3>
              <p className="mt-2 text-sm font-medium">
                Prendas dobladas o en gancho segun lo que pidas.
              </p>
            </div>

            <div className="sw-recorte relative -rotate-1 border-2 border-(--sw-line) bg-(--sw-coral) p-6 text-(--sw-on-accent)">
              <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase">03 / Lavado en seco</p>
              <h3 className="mt-8 font-sans text-2xl leading-[1.02] font-black tracking-[-0.03em]">
                Lo delicado, aparte.
              </h3>
              <p className="mt-2 text-sm font-medium">
                Trajes, abrigos y vestidos que no van a la lavadora.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ClayCard className="rotate-0 sm:rotate-1">
              <p className="text-[11px] font-extrabold tracking-[0.12em] text-(--sw-coral) uppercase">
                04 / Rastreo
              </p>
              <h3 className="mt-3 font-sans text-xl font-black tracking-[-0.03em] text-(--sw-ink)">
                Sabes donde esta tu pedido.
              </h3>
              <p className="mt-1.5 text-sm text-(--sw-ink-soft)">
                Con tu codigo, sin crear una cuenta.
              </p>
            </ClayCard>
            <ClayCard className="bg-(--sw-sun) text-(--sw-on-accent) sm:-rotate-1">
              <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase">05 / Fidelizacion</p>
              <h3 className="mt-3 font-sans text-xl font-black tracking-[-0.03em]">
                Mas ordenes, mejor precio.
              </h3>
              <p className="mt-1.5 text-sm font-medium">
                Descuentos segun tu historial, calculados solos.
              </p>
            </ClayCard>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 border-t-2 border-(--sw-line) bg-(--sw-surface) px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Titular eyebrow="Como funciona">
            Cuatro pasos,
            <br />
            sin complicaciones.
          </Titular>

          <ol className="border-t-2 border-(--sw-line)">
            {PASOS.map((paso) => (
              <li
                key={paso.numero}
                className="group grid grid-cols-[3rem_1fr] items-baseline gap-x-4 gap-y-1 border-b-2 border-(--sw-line) py-6 transition-colors hover:bg-(--sw-bg-deep) sm:grid-cols-[5rem_18rem_1fr] sm:px-3"
              >
                <span className="font-sans text-sm font-black text-(--sw-coral) tabular-nums">{paso.numero}</span>
                <h3 className="font-sans text-xl font-black tracking-[-0.03em] text-(--sw-ink)">{paso.titulo}</h3>
                <p className="col-start-2 text-sm text-(--sw-ink-soft) sm:col-start-3">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="preguntas" className="scroll-mt-20 px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Titular eyebrow="Preguntas frecuentes">
            Resolvemos
            <br />
            tus dudas.
          </Titular>

          <div className="grid gap-3">
            {PREGUNTAS.map((item) => (
              <details
                key={item.pregunta}
                className="group rounded-2xl border-2 border-(--sw-line) bg-(--sw-surface) px-5 open:shadow-[5px_5px_0_0_var(--sw-hard-color)]"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-extrabold text-(--sw-ink)">
                  {item.pregunta}
                  <span className="shrink-0 text-(--sw-coral) transition-transform group-open:rotate-180" aria-hidden="true">
                    ⌄
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-(--sw-ink-soft)">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="sw-puntos relative overflow-hidden border-t-2 border-(--sw-line) bg-(--sw-deep) px-4 py-20 text-center text-(--sw-on-deep) sm:px-8 sm:py-24">
        <span
          className="sw-gira pointer-events-none absolute top-1/2 left-1/2 size-[26rem] rounded-full border-2 border-dashed border-white/10"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-xl">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-(--sw-accent) uppercase">PQRS</p>
          <h2 className="mt-4 font-sans text-4xl leading-[0.98] font-black tracking-[-0.045em] sm:text-6xl">
            Tienes una queja
            <br />o <span className="text-(--sw-sun)">sugerencia?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-(--sw-on-deep-soft)">
            Cuentanos que paso, con o sin el codigo de tu pedido. Te respondemos por el medio
            de contacto que nos dejes.
          </p>
          <Link
            href="/pqrs"
            className="clay-btn mt-8 inline-flex h-12 items-center gap-2 rounded-full border-2 bg-(--sw-sun) px-7 text-sm font-extrabold text-(--sw-on-accent)"
          >
            Ir a PQRS <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <footer className="border-t-2 border-(--sw-line) bg-(--sw-surface) px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Wordmark className="text-xl" />
            <p className="mt-1 text-xs text-(--sw-ink-soft)">Gestion operativa y fidelizacion de lavanderia.</p>
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-xs font-extrabold tracking-[0.08em] text-(--sw-ink) uppercase underline decoration-(--sw-accent) decoration-2 underline-offset-4"
          >
            Acceso para personal
          </Link>
        </div>
      </footer>
    </main>
  );
}
