from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from django.test import override_settings

from .models import RegistroAuditoria

User = get_user_model()


class AuthTests(APITestCase):
    """Cubre el contrato de autenticacion por sesion que consume el frontend."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="recepcion", password="smartwash123", rol=User.Rol.RECEPCIONISTA
        )

    def test_me_requires_authentication(self):
        self.assertEqual(self.client.get("/api/auth/me").status_code, 403)

    def test_me_sets_the_csrf_cookie_even_when_anonymous(self):
        # El frontend necesita el token antes de poder hacer login.
        response = self.client.get("/api/auth/me")
        self.assertIn("csrftoken", response.cookies)

    def test_login_with_valid_credentials_creates_a_session(self):
        response = self.client.post(
            "/api/auth/login",
            {"username": "recepcion", "password": "smartwash123"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["rol"], "recepcionista")
        self.assertIn("sessionid", response.cookies)

        me = self.client.get("/api/auth/me")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["username"], "recepcion")

    def test_login_with_invalid_credentials_is_rejected(self):
        response = self.client.post(
            "/api/auth/login", {"username": "recepcion", "password": "incorrecta"}
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 403)

    def test_login_without_csrf_token_is_rejected(self):
        client = APIClient(enforce_csrf_checks=True)
        client.get("/api/auth/me")  # siembra la cookie csrftoken
        response = client.post(
            "/api/auth/login",
            {"username": "recepcion", "password": "smartwash123"},
        )
        self.assertEqual(response.status_code, 403)

    def test_logout_ends_the_session(self):
        self.client.login(username="recepcion", password="smartwash123")
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 204)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 403)

class ActuarComoTests(APITestCase):
    def setUp(self):
        User.objects.create_user(
            username="recepcion", password="smartwash123", rol=User.Rol.RECEPCIONISTA
        )
        User.objects.create_user(
            username="operario1", password="smartwash123", rol=User.Rol.OPERARIO
        )
        self.client.login(username="recepcion", password="smartwash123")

    @override_settings(DEBUG=True)
    def test_switches_the_session_to_another_seeded_account(self):
        response = self.client.post(
            "/api/auth/actuar-como", {"username": "operario1"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me").json()["username"], "operario1")

    @override_settings(DEBUG=True)
    def test_rejects_a_username_outside_the_seeded_list(self):
        User.objects.create_user(username="intruso", password="x")
        response = self.client.post("/api/auth/actuar-como", {"username": "intruso"})
        self.assertEqual(response.status_code, 400)

    @override_settings(DEBUG=False)
    def test_is_not_available_outside_debug(self):
        self.assertEqual(
            self.client.post("/api/auth/actuar-como", {"username": "operario1"}).status_code,
            404,
        )


class AuditoriaTests(APITestCase):
    """HU04: consultar el historial de acciones de cada usuario."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="smartwash123", rol=User.Rol.ADMINISTRADOR
        )
        self.client.login(username="admin", password="smartwash123")

    def test_crear_un_usuario_registra_una_accion_de_tipo_creado(self):
        usuario = User.objects.create_user(username="operario1", password="x", rol=User.Rol.OPERARIO)
        registro = RegistroAuditoria.objects.get(usuario=usuario)
        self.assertEqual(registro.accion, RegistroAuditoria.Accion.CREADO)
        self.assertEqual(registro.tipo_usuario, User.Rol.OPERARIO)

    def test_desactivar_un_usuario_registra_una_accion_de_tipo_desactivado(self):
        usuario = User.objects.create_user(username="operario1", password="x", rol=User.Rol.OPERARIO)
        usuario.is_active = False
        usuario.save()
        ultimo = RegistroAuditoria.objects.filter(usuario=usuario).latest("fecha")
        self.assertEqual(ultimo.accion, RegistroAuditoria.Accion.DESACTIVADO)

    def test_reactivar_un_usuario_registra_una_accion_de_tipo_activado(self):
        usuario = User.objects.create_user(
            username="operario1", password="x", rol=User.Rol.OPERARIO, is_active=False
        )
        usuario.is_active = True
        usuario.save()
        ultimo = RegistroAuditoria.objects.filter(usuario=usuario).latest("fecha")
        self.assertEqual(ultimo.accion, RegistroAuditoria.Accion.ACTIVADO)

    def test_editar_un_campo_sin_tocar_is_active_registra_una_accion_de_tipo_editado(self):
        usuario = User.objects.create_user(username="operario1", password="x", rol=User.Rol.OPERARIO)
        usuario.rol = User.Rol.RECEPCIONISTA
        usuario.save()
        ultimo = RegistroAuditoria.objects.filter(usuario=usuario).latest("fecha")
        self.assertEqual(ultimo.accion, RegistroAuditoria.Accion.EDITADO)

    def test_el_historial_de_un_usuario_devuelve_solo_sus_propias_acciones(self):
        usuario = User.objects.create_user(username="operario1", password="x", rol=User.Rol.OPERARIO)
        response = self.client.get(f"/api/usuarios/{usuario.id}/historial")
        self.assertEqual(response.status_code, 200)
        datos = response.json()
        self.assertEqual(len(datos), 1)
        self.assertEqual(datos[0]["accion"], "creado")

    def test_el_historial_de_un_usuario_sin_acciones_informa_una_lista_vacia(self):
        response = self.client.get("/api/usuarios/999999/historial")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_la_trazabilidad_incluye_acciones_de_todos_los_usuarios(self):
        User.objects.create_user(username="operario1", password="x", rol=User.Rol.OPERARIO)
        User.objects.create_user(username="recepcion1", password="x", rol=User.Rol.RECEPCIONISTA)
        response = self.client.get("/api/usuarios/trazabilidad")
        self.assertEqual(response.status_code, 200)
        # admin (setUp) + operario1 + recepcion1: al menos 3 altas registradas.
        self.assertGreaterEqual(len(response.json()), 3)

    def test_la_trazabilidad_se_filtra_por_tipo_de_usuario(self):
        User.objects.create_user(username="recepcion1", password="x", rol=User.Rol.RECEPCIONISTA)
        response = self.client.get("/api/usuarios/trazabilidad?rol=recepcionista")
        self.assertEqual(response.status_code, 200)
        datos = response.json()
        self.assertTrue(datos)
        self.assertTrue(all(item["tipo_usuario"] == "recepcionista" for item in datos))

    def test_la_trazabilidad_sin_coincidencias_informa_una_lista_vacia(self):
        response = self.client.get("/api/usuarios/trazabilidad?rol=cliente")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_los_registros_de_auditoria_no_se_pueden_editar_ni_eliminar_desde_el_admin(self):
        from django.contrib import admin as django_admin

        from .admin import RegistroAuditoriaAdmin

        admin_site = RegistroAuditoriaAdmin(RegistroAuditoria, django_admin.site)
        self.assertFalse(admin_site.has_add_permission(None))
        self.assertFalse(admin_site.has_change_permission(None))
        self.assertFalse(admin_site.has_delete_permission(None))