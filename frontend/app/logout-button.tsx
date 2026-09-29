"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { ClayButton } from "./components/ui/clay";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    // Si el backend no responde igual sacamos al usuario de la pantalla privada.
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <ClayButton type="button" variant="secundario" onClick={logout}>
      Cerrar sesion
    </ClayButton>
  );
}
