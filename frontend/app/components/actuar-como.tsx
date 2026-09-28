"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";

import { actuarComo, getCuentasDesarrollo, type User } from "@/lib/api";
import { ClaySelect } from "./ui/clay";

// Solo para desarrollo: se elimina en T8 (SCRUM-57) cuando llegue el control
// de acceso real por rol. Se oculta solo si el backend responde 404 (produccion).
export default function ActuarComoSelector() {
  const router = useRouter();
  const [cuentas, setCuentas] = useState<User[] | null>(null);

  useEffect(() => {
    getCuentasDesarrollo().then(setCuentas);
  }, []);

  if (!cuentas) return null;

  async function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const username = event.target.value;
    if (!username) return;
    await actuarComo(username);
    router.refresh();
  }

  return (
    <ClaySelect
      onChange={onChange}
      defaultValue=""
      aria-label="Actuar como"
      className="h-9 w-auto text-xs"
    >
      <option value="" disabled>
        Actuar como...
      </option>
      {cuentas.map((cuenta) => (
        <option key={cuenta.username} value={cuenta.username}>
          {cuenta.username} ({cuenta.rol})
        </option>
      ))}
    </ClaySelect>
  );
}
