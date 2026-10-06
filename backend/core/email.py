import json
import urllib.error
import urllib.request

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

RESEND_URL = "https://api.resend.com/emails"


class ResendEmailBackend(BaseEmailBackend):
    """Envia por la API HTTP de Resend: Render gratuito bloquea los puertos SMTP."""

    def send_messages(self, email_messages):
        enviados = 0
        for mensaje in email_messages:
            try:
                self._enviar(mensaje)
            except Exception:
                if not self.fail_silently:
                    raise
                continue
            enviados += 1
        return enviados

    def _enviar(self, mensaje):
        peticion = urllib.request.Request(
            RESEND_URL,
            data=json.dumps(
                {
                    "from": mensaje.from_email,
                    "to": mensaje.to,
                    "subject": mensaje.subject,
                    "text": mensaje.body,
                }
            ).encode(),
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
                # Sin User-Agent propio, Cloudflare rechaza el de urllib.
                "User-Agent": "smartwash-backend",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(peticion, timeout=10):
                pass
        except urllib.error.HTTPError as error:
            # Solo el estado y el cuerpo: la excepcion se registra en los logs.
            detalle = error.read().decode(errors="replace")[:200]
            raise RuntimeError(f"Resend respondio {error.code}: {detalle}") from None
