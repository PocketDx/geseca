"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { crearReglaDescuento, leerErroresApi, type Cliente, type ReglaDescuento } from "@/lib/api";
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

export default function ReglaDescuentoForm({ className }: { className?: string }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<ReglaDescuento["tipo"]>("porcentaje");
  const [errores, setErrores] = useState<string[]>([]);
  const [creada, setCreada] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React deja currentTarget en null al terminar el evento; despues del
    // await ya no se puede leer.
    const formulario = event.currentTarget;
    setPending(true);
    setErrores([]);
    setCreada(false);

    const form = new FormData(formulario);
    const datos: Omit<ReglaDescuento, "id"> = {
      nombre: String(form.get("nombre") ?? ""),
      tipo,
      valor: String(form.get("valor") ?? "0"),
      clasificacion_cliente: String(form.get("clasificacion_cliente") ?? "") as ReglaDescuento["clasificacion_cliente"],
      activa: form.get("activa") === "on",
      vigente_desde: String(form.get("vigente_desde") ?? ""),
      vigente_hasta: null,
    };

    const response = await crearReglaDescuento(datos).catch(() => null);
    setPending(false);

    if (response?.ok) {
      formulario.reset();
      setTipo("porcentaje");
      setCreada(true);
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
    setErrores(mensajes.length ? mensajes : [`No se pudo crear la regla (error ${response.status}).`]);
  }

  return (
    <form onSubmit={onSubmit} className={cx("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <ClayField label="Nombre de la regla">
        <ClayInput name="nombre" placeholder="Descuento clientes VIP" required />
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
        <ClayInput name="valor" type="number" min="0" max={VALOR_MAXIMO[tipo]} step="0.01" required />
      </ClayField>
      <ClayField label="Clasificacion del cliente">
        <ClaySelect name="clasificacion_cliente" defaultValue="">
          <option value="">Cualquiera</option>
          {CLASIFICACIONES.map((clasificacion) => (
            <option key={clasificacion} value={clasificacion}>
              {clasificacion}
            </option>
          ))}
        </ClaySelect>
      </ClayField>
      <ClayField label="Vigente desde">
        <ClayInput name="vigente_desde" type="date" required />
      </ClayField>
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-(--sw-ink-soft)">
        <input name="activa" type="checkbox" defaultChecked className="size-4" />
        Activa desde que se crea
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <ClayButton type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Crear regla"}
        </ClayButton>
        {creada && (
          <p role="status" className="text-sm text-(--sw-ink-soft)">
            Regla creada.
          </p>
        )}
      </div>

      {errores.length > 0 && (
        <div role="alert" className="clay-sm border-l-4 border-(--sw-peach) p-4 text-sm sm:col-span-2">
          <p className="font-semibold text-(--sw-ink)">No se pudo crear la regla</p>
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
