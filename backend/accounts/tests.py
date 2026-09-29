from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from django.test import override_settings

User = get_user_model()


class AuthTests(APITestCase):
    """Cubre el contrato de autenticacion por sesion que consume el frontend."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="recepcion",
            email="recepcion@smartwash.test",
            password="smartwash123",
            rol=User.Rol.RECEPCIONISTA,
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
        response = self.client.post("/api/auth/actuar-como", {"username": "operario1"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self.client.get("/api/auth/me").json()["username"], "operario1"
        )

    @override_settings(DEBUG=True)
    def test_rejects_a_username_outside_the_seeded_list(self):
        User.objects.create_user(username="intruso", password="x")
        response = self.client.post("/api/auth/actuar-como", {"username": "intruso"})
        self.assertEqual(response.status_code, 400)

    @override_settings(DEBUG=False)
    def test_is_not_available_outside_debug(self):
        self.assertEqual(
            self.client.post(
                "/api/auth/actuar-como", {"username": "operario1"}
            ).status_code,
            404,
        )


class UsuarioInternoTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="smartwash123", rol=User.Rol.ADMINISTRADOR
        )
        self.client.login(username="admin", password="smartwash123")

    def test_requiere_sesion_activa(self):
        self.client.logout()
        response = self.client.get("/api/usuarios")
        self.assertEqual(response.status_code, 403)

    def test_crea_un_usuario_interno_con_un_rol(self):
        response = self.client.post(
            "/api/usuarios",
            {
                "username": "recepcion1",
                "email": "recepcion1@smartwash.test",
                "first_name": "Ana",
                "last_name": "Gomez",
                "rol": "recepcionista",
                "password": "smartwash123",
            },
        )
        self.assertEqual(response.status_code, 201)
        usuario = User.objects.get(username="recepcion1")
        self.assertEqual(usuario.rol, User.Rol.RECEPCIONISTA)
        self.assertTrue(usuario.check_password("smartwash123"))
        self.assertTrue(usuario.is_active)

    def test_crear_sin_password_se_rechaza_y_no_crea_nada(self):
        response = self.client.post(
            "/api/usuarios",
            {"username": "sinclave", "email": "x@smartwash.test", "rol": "operario"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username="sinclave").exists())

    def test_la_lista_incluye_el_estado_activo_de_cada_usuario(self):
        response = self.client.get("/api/usuarios")
        self.assertEqual(response.status_code, 200)
        admin_listado = next(u for u in response.json() if u["username"] == "admin")
        self.assertIn("is_active", admin_listado)
        self.assertTrue(admin_listado["is_active"])

    def test_edita_el_rol_de_un_usuario_existente(self):
        usuario = User.objects.create_user(
            username="operario1", password="x", rol=User.Rol.OPERARIO
        )
        response = self.client.patch(
            f"/api/usuarios/{usuario.id}",
            {"rol": "recepcionista"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        usuario.refresh_from_db()
        self.assertEqual(usuario.rol, User.Rol.RECEPCIONISTA)

    def test_un_usuario_solo_tiene_un_rol_a_la_vez(self):
        # El campo rol es un CharField unico (no una relacion multiple), asi
        # que asignar uno nuevo reemplaza al anterior: nunca conviven dos.
        usuario = User.objects.create_user(
            username="operario1", password="x", rol=User.Rol.OPERARIO
        )
        usuario.rol = User.Rol.RECEPCIONISTA
        usuario.save()
        usuario.refresh_from_db()
        self.assertEqual(usuario.rol, User.Rol.RECEPCIONISTA)

    def test_desactivar_marca_is_active_en_false_sin_borrar_el_usuario(self):
        usuario = User.objects.create_user(
            username="operario1", password="x", rol=User.Rol.OPERARIO
        )
        response = self.client.post(f"/api/usuarios/{usuario.id}/desactivar")
        self.assertEqual(response.status_code, 200)
        usuario.refresh_from_db()
        self.assertFalse(usuario.is_active)
        self.assertTrue(User.objects.filter(pk=usuario.id).exists())
