import Link from "next/link";

import { clayBtnClass } from "../components/ui/clay";

export default function FiltroVigencia({ soloVigentes }: { soloVigentes: boolean }) {
  return (
    <nav aria-label="Filtrar tarifas" className="flex gap-2">
      <Link
        href="/catalogo"
        aria-current={soloVigentes ? undefined : "page"}
        className={clayBtnClass(soloVigentes ? "secundario" : "primario")}
      >
        Todas
      </Link>
      <Link
        href="/catalogo?vigentes=1"
        aria-current={soloVigentes ? "page" : undefined}
        className={clayBtnClass(soloVigentes ? "primario" : "secundario")}
      >
        Solo vigentes
      </Link>
    </nav>
  );
}
