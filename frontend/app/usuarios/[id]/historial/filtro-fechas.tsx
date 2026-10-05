import Link from "next/link";

import { ClayButton, ClayField, ClayInput, clayBtnClass } from "../../../components/ui/clay";

export default function FiltroFechas({
  usuarioId,
  desde,
  hasta,
}: {
  usuarioId: number;
  desde?: string;
  hasta?: string;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      <ClayField label="Desde">
        <ClayInput type="date" name="desde" defaultValue={desde} max={hasta} className="w-auto" />
      </ClayField>
      <ClayField label="Hasta">
        <ClayInput type="date" name="hasta" defaultValue={hasta} min={desde} className="w-auto" />
      </ClayField>
      <ClayButton type="submit">Filtrar</ClayButton>
      {(desde || hasta) && (
        <Link href={`/usuarios/${usuarioId}/historial`} className={clayBtnClass("secundario")}>
          Limpiar
        </Link>
      )}
    </form>
  );
}
