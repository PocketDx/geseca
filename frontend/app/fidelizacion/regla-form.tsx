"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  actualizarReglaDescuento,
  crearReglaDescuento,
  leerErroresApi,
  type Cliente,
  type ReglaDescuento,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { ClayButton, ClayField, ClayInput, ClaySelect } from "../components/ui/clay";

const CLASIFICACIONES: Cliente["clasificacion"][] = ["Ocasional", "Frecuente", "VIP"];

// Topes del backend: RF07 limita el porcentaje a 100 y DecimalField(10, 2)
// no admite mas de 8 digitos enteros.
const VALOR_MAXIMO: Record<ReglaDescuento["tipo"], string> = {
  porcentaje: "100",
  monto_fijo: "99999999.99",
};

const ETIQUETAS: Record<string, string> = {
  nombre: "Nombre",
  tipo: "Tipo",
  valor: "Valor",
  clasificacion_cliente: "Clasificacion del cliente",
  vigente_desde: "Vigente desde",
  vigente_hasta: "Vigente hasta",
};

export default function ReglaDescuentoForm({
  regla,
  onTerminar,
  className,
}: {
  regla?: ReglaDescuento;
  onTerminar?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState<ReglaDescuento["tipo"]>(regla?.tipo ?? "porcentaje");
  const [errores, setErrores] = useState<string[]>([]);
  const [guardada, setGuardada] = useState(false);
  const [pending, setPending] = useState(false);
  const editando = regla !== undefined;
  const accion = editando ? "actualizar" : "crear";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React deja currentTarget en null al terminar el evento; despues del
    // await ya no se puede leer.
    const formulario = event.currentTarget;
    setPending(true);
    setErrores([]);
    setGuardada(false);

    const form = new FormData(formulario);
    const datos: Omit<ReglaDescuento, "id"> = {
      nombre: String(form.get("nombre") ?? ""),
      tipo,
      valor: String(form.get("valor") ?? "0"),
      clasificacion_cliente: String(form.get("clasificacion_cliente") ?? "") as ReglaDescuento["clasificacion_cliente"],
      activa: form.get("activa") === "on",
      vigente_desde: String(form.get("vigente_desde") ?? ""),
      vigente_hasta: String(form.get("vigente_hasta") ?? "") || null,
    };

    const response = await (regla ? actualizarReglaDescuento(regla.id, datos) : crearReglaDescuento(datos)).catch(
      () => null,
    );
    setPending(false);

    if (response?.ok) {
      if (editando) {
        onTerminar?.();
      } else {
        formulario.reset();
        setTipo("porcentaje");
        setGuardada(true);
      }
      router.refresh();
      return;
    }

    if (!response) {
      setErrores(["No se pudo conectar con el servidor. Intenta de nuevo."]);
      return;
    }
    const mensajes = Object.entries(await leerErroresApi(response)).flatMap(([campo, lista]) =>
      lista.map((mensaje) => (ETIQUETAS[campo] ? `${ETIQUETAS[campo]}: ${mensaje}` : mensaje)),
    );
    setErrores(mensajes.length ? mensajes : [`No se pudo ${accion} la regla (error ${response.status}).`]);
  }

  return (
    <form onSubmit={onSubmit} className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <ClayField label="Nombre de la regla">
        <ClayInput name="nombre" defaultValue={regla?.nombre} placeholder="Descuento clientes VIP" required />
      </ClayField>
      <ClayField label="Tipo">
        <ClaySelect
          name="tipo"
          value={tipo}
          onChange={(event) => setTipo(event.target.value as ReglaDescuento["tipo"])}
          required
        >
          <option value="porcentaje">Porcentaje</option>
          <option value="monto_fijo">Monto fijo</option>
        </ClaySelect>
      </ClayField>
      <ClayField label={tipo === "porcentaje" ? "Valor (%)" : "Valor (COP)"}>
        <ClayInput
          name="valor"
          type="number"
          min="0"
          max={VALOR_MAXIMO[tipo]}
          step="0.01"
          defaultValue={regla?.valor}
          required
        />
      </ClayField>
      <ClayField label="Clasificacion del cliente">
        <ClaySelect name="clasificacion_cliente" defaultValue={regla?.clasificacion_cliente ?? ""}>
          <option value="">Cualquiera</option>
          {CLASIFICACIONES.map((clasificacion) => (
            <option key={clasificacion} value={clasificacion}>
              {clasificacion}
            </option>
          ))}
        </ClaySelect>
      </ClayField>
      <ClayField label="Vigente desde">
        <ClayInput name="vigente_desde" type="date" defaultValue={regla?.vigente_desde} required />
      </ClayField>
      <ClayField label="Vigente hasta (opcional)">
        <ClayInput name="vigente_hasta" type="date" defaultValue={regla?.vigente_hasta ?? ""} />
      </ClayField>
      <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-(--sw-ink-soft) accent-(--sw-accent)">
        <input name="activa" type="checkbox" defaultChecked={regla?.activa ?? true} className="size-4" />
        {editando ? "Activa" : "Activa desde que se crea"}
      </label>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : editando ? "Guardar cambios" : "Crear regla"}
        </ClayButton>
        {editando && (
          <ClayButton type="button" variant="secundario" onClick={onTerminar} disabled={pending}>
            Cancelar
          </ClayButton>
        )}
        {guardada && (
          <p role="status" className="text-sm text-(--sw-ink-soft)">
            Regla creada.
          </p>
        )}
      </div>

      {errores.length > 0 && (
        <div role="alert" className="clay-sm border-l-8 border-l-(--sw-coral) p-4 text-sm sm:col-span-2">
          <p className="font-semibold text-(--sw-ink)">No se pudo {accion} la regla</p>
          <ul className="mt-1 list-inside list-disc text-(--sw-ink-soft)">
            {errores.map((mensaje) => (
              <li key={mensaje}>{mensaje}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
