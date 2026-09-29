import Link from "next/link";

import { ClayBadge, ClayCard, clayBtnClass } from "./ui/clay";

const SERVICIOS = [
  {
    titulo: "Lavado",
    texto: "Lavado por tipo de prenda, con el detergente y el programa adecuados para cada tela.",
    color: "blue" as const,
  },
  {
    titulo: "Planchado",
    texto: "Prendas listas para usar, dobladas o en gancho segun lo que pidas.",
    color: "mint" as const,
  },
  {
    titulo: "Lavado en seco",
    texto: "Para las prendas delicadas que no van a la lavadora: trajes, abrigos, vestidos.",
    color: "lavender" as const,
  },
];

const PASOS = [
  { numero: "1", titulo: "Entregas tus prendas", texto: "En el punto o donde acordemos la recogida." },
  { numero: "2", titulo: "Te damos un codigo", texto: "Sirve para rastrear tu pedido sin necesidad de una cuenta." },
  { numero: "3", titulo: "Lavamos y revisamos", texto: "Cada prenda pasa por control de calidad antes de salir." },
  { numero: "4", titulo: "Recibes tus prendas", texto: "Listas, en el plazo que te confirmamos al recibir la orden." },
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

export function Landing() {
  return (
    <main>
      <section className="relative overflow-hidden px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <ClayBadge>Gestion y fidelizacion de lavanderia</ClayBadge>
          <h1 className="mt-6 font-sans text-4xl leading-tight font-extrabold tracking-tight text-(--sw-ink) sm:text-5xl">
            Tus prendas, con seguimiento claro de principio a fin.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-(--sw-ink-soft)">
            Entrega tus prendas, recibe un codigo de rastreo y sigue el estado de tu pedido
            cuando quieras, sin filas ni llamadas.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/rastrear-pedido" className={clayBtnClass("primario") + " h-12 px-6"}>
              Rastrear mi pedido
            </Link>
            <Link href="#servicios" className={clayBtnClass("secundario") + " h-12 px-6"}>
              Ver nuestros servicios
            </Link>
          </div>
        </div>
      </section>

      <section id="servicios" className="scroll-mt-20 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-extrabold tracking-[0.1em] text-(--sw-ink-soft) uppercase">
              Nuestros servicios
            </p>
            <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-(--sw-ink)">
              Un servicio para cada prenda
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SERVICIOS.map((servicio) => (
              <ClayCard key={servicio.titulo}>
                <ClayBadge color={servicio.color}>{servicio.titulo}</ClayBadge>
                <p className="mt-3 text-sm leading-relaxed text-(--sw-ink-soft)">{servicio.texto}</p>
              </ClayCard>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-extrabold tracking-[0.1em] text-(--sw-ink-soft) uppercase">
              Como funciona
            </p>
            <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-(--sw-ink)">
              Cuatro pasos, sin complicaciones
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((paso) => (
              <ClayCard key={paso.numero} className="text-center">
                <span className="clay-press mx-auto flex size-9 items-center justify-center rounded-full text-sm font-extrabold text-(--sw-ink)">
                  {paso.numero}
                </span>
                <h3 className="mt-4 text-sm font-extrabold text-(--sw-ink)">{paso.titulo}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-(--sw-ink-soft)">{paso.texto}</p>
              </ClayCard>
            ))}
          </div>
        </div>
      </section>

      <section id="preguntas" className="scroll-mt-20 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-extrabold tracking-[0.1em] text-(--sw-ink-soft) uppercase">
              Preguntas frecuentes
            </p>
            <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-(--sw-ink)">
              Resolvemos tus dudas
            </h2>
          </div>

          <div className="grid gap-3">
            {PREGUNTAS.map((item) => (
              <details key={item.pregunta} className="clay-sm group px-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-bold text-(--sw-ink)">
                  {item.pregunta}
                  <span className="text-(--sw-ink-soft) transition-transform group-open:rotate-180" aria-hidden="true">
                    ⌄
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-(--sw-ink-soft)">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:py-20">
        <ClayCard className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <ClayBadge color="peach">PQRS</ClayBadge>
          <h2 className="font-sans text-2xl font-extrabold tracking-tight text-(--sw-ink)">
            Tienes una peticion, queja, reclamo o sugerencia?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-(--sw-ink-soft)">
            Cuentanos que paso, con o sin el codigo de tu pedido. Te respondemos por el medio
            de contacto que nos dejes.
          </p>
          <Link href="/pqrs" className={clayBtnClass("primario") + " h-11 px-6"}>
            Ir a PQRS
          </Link>
        </ClayCard>
      </section>

      <footer className="border-t border-(--sw-bg-deep) px-5 py-8 text-center">
        <p className="text-lg font-extrabold tracking-tight text-(--sw-ink)">
          Smart<span className="text-[#5b8fb0]">Wash</span>
        </p>
        <p className="mt-1 text-xs text-(--sw-ink-soft)">Gestion operativa y fidelizacion de lavanderia.</p>
        <Link
          href="/login"
          className="mt-3 inline-block text-xs font-semibold text-(--sw-ink-soft) hover:text-(--sw-ink) hover:underline"
        >
          Acceso para personal
        </Link>
      </footer>
    </main>
  );
}
