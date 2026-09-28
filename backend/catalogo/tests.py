from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import Servicio, TipoPrenda, Tarifa

User = get_user_model()


class TarifaTests(TestCase):
    def setUp(self):
        self.camisa = TipoPrenda.objects.create(nombre="Camisa")
        self.lavado = Servicio.objects.create(nombre="Lavado")

    def crear_tarifa(self, valor="8000", desde=date(2026, 1, 1), hasta=None, **extra):
        return Tarifa.objects.create(
            tipo_prenda=extra.get("tipo_prenda", self.camisa),
            servicio=extra.get("servicio", self.lavado),
            valor=Decimal(valor),
            plazo_entrega_dias=2,
            vigente_desde=desde,
            vigente_hasta=hasta,
        )

    def test_solo_admite_una_tarifa_vigente_por_tipo_de_prenda_y_servicio(self):
        self.crear_tarifa()
        with self.assertRaises(IntegrityError):
            self.crear_tarifa(valor="9000")

    def test_al_cerrar_la_vigencia_se_puede_registrar_la_nueva_tarifa(self):
        anterior = self.crear_tarifa(valor="8000")
        anterior.vigente_hasta = date(2026, 6, 1)
        anterior.save()

        self.crear_tarifa(valor="9000", desde=date(2026, 6, 1))

        self.assertEqual(Tarifa.objects.count(), 2)
        self.assertEqual(Tarifa.objects.filter(vigente_hasta__isnull=True).count(), 1)

    def test_rechaza_una_tarifa_negativa(self):
        with self.assertRaises(IntegrityError):
            self.crear_tarifa(valor="-1000")

    def test_rechaza_una_vigencia_que_termina_antes_de_empezar(self):
        with self.assertRaises(IntegrityError):
            self.crear_tarifa(desde=date(2026, 6, 1), hasta=date(2026, 1, 1))

    def test_el_valor_se_guarda_como_decimal_exacto(self):
        tarifa = self.crear_tarifa(valor="8500.55")
        tarifa.refresh_from_db()
        self.assertEqual(tarifa.valor, Decimal("8500.55"))


class CatalogoApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="smartwash123", rol=User.Rol.ADMINISTRADOR
        )
        self.client.login(username="admin", password="smartwash123")
        self.camisa = TipoPrenda.objects.create(nombre="Camisa")
        self.lavado = Servicio.objects.create(nombre="Lavado")

    def datos_tarifa(self, **extra):
        datos = {
            "tipo_prenda": self.camisa.pk,
            "servicio": self.lavado.pk,
            "valor": "8000.00",
            "plazo_entrega_dias": 2,
            "vigente_desde": "2026-01-01",
        }
        datos.update(extra)
        return datos

    def test_crea_un_servicio_y_registra_quien_lo_creo(self):
        response = self.client.post(
            "/api/catalogo/servicios", {"nombre": "Planchado", "descripcion": "A vapor"}
        )
        self.assertEqual(response.status_code, 201)
        servicio = Servicio.objects.get(nombre="Planchado")
        self.assertEqual(servicio.creado_por, self.admin)

    def test_edita_un_servicio_existente(self):
        response = self.client.patch(
            f"/api/catalogo/servicios/{self.lavado.pk}",
            {"descripcion": "Lavado en agua"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.lavado.refresh_from_db()
        self.assertEqual(self.lavado.descripcion, "Lavado en agua")
        self.assertEqual(self.lavado.actualizado_por, self.admin)

    def test_rechaza_un_servicio_duplicado_sin_importar_mayusculas(self):
        response = self.client.post("/api/catalogo/servicios", {"nombre": " lavado "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("nombre", response.json())
        self.assertEqual(Servicio.objects.count(), 1)

    def test_crea_un_tipo_de_prenda(self):
        response = self.client.post(
            "/api/catalogo/tipos-prenda", {"nombre": "Cobija", "material": "Lana"}
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(TipoPrenda.objects.filter(nombre="Cobija").exists())

    def test_crea_una_tarifa_para_un_par_prenda_servicio(self):
        response = self.client.post("/api/catalogo/tarifas", self.datos_tarifa())
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["servicio_nombre"], "Lavado")
        tarifa = Tarifa.objects.get()
        self.assertEqual(tarifa.valor, Decimal("8000.00"))
        self.assertEqual(tarifa.creado_por, self.admin)

    def test_rechaza_una_tarifa_negativa(self):
        response = self.client.post("/api/catalogo/tarifas", self.datos_tarifa(valor="-1"))
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Tarifa.objects.exists())

    def test_rechaza_una_tarifa_vacia(self):
        response = self.client.post("/api/catalogo/tarifas", self.datos_tarifa(valor=""))
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Tarifa.objects.exists())

    def test_una_tarifa_nueva_cierra_la_vigente_y_conserva_el_historico(self):
        self.client.post("/api/catalogo/tarifas", self.datos_tarifa())
        response = self.client.post(
            "/api/catalogo/tarifas",
            self.datos_tarifa(valor="9000.00", vigente_desde="2026-06-01"),
        )
        self.assertEqual(response.status_code, 201)
        anterior = Tarifa.objects.get(valor=Decimal("8000.00"))
        self.assertEqual(anterior.vigente_hasta, date(2026, 6, 1))
        vigentes = self.client.get("/api/catalogo/tarifas?vigentes=1").json()
        self.assertEqual([t["valor"] for t in vigentes], ["9000.00"])

    def test_una_tarifa_nueva_no_puede_empezar_antes_que_la_vigente(self):
        self.client.post("/api/catalogo/tarifas", self.datos_tarifa(vigente_desde="2026-06-01"))
        response = self.client.post(
            "/api/catalogo/tarifas", self.datos_tarifa(vigente_desde="2026-01-01")
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Tarifa.objects.count(), 1)
        self.assertIsNone(Tarifa.objects.get().vigente_hasta)

    def test_no_permite_mover_una_tarifa_a_otro_servicio(self):
        tarifa_id = self.client.post("/api/catalogo/tarifas", self.datos_tarifa()).json()["id"]
        planchado = Servicio.objects.create(nombre="Planchado")
        response = self.client.patch(
            f"/api/catalogo/tarifas/{tarifa_id}",
            {"servicio": planchado.pk},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_no_permite_reabrir_una_tarifa_si_ya_hay_otra_vigente(self):
        primera = self.client.post("/api/catalogo/tarifas", self.datos_tarifa()).json()["id"]
        self.client.post(
            "/api/catalogo/tarifas", self.datos_tarifa(vigente_desde="2026-06-01")
        )
        response = self.client.patch(
            f"/api/catalogo/tarifas/{primera}",
            {"vigente_hasta": None},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_una_edicion_rechazada_no_cambia_nada(self):
        tarifa_id = self.client.post("/api/catalogo/tarifas", self.datos_tarifa()).json()["id"]
        response = self.client.patch(
            f"/api/catalogo/tarifas/{tarifa_id}",
            {"valor": "9500.00", "plazo_entrega_dias": 0},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        tarifa = Tarifa.objects.get(pk=tarifa_id)
        self.assertEqual(tarifa.valor, Decimal("8000.00"))
        self.assertEqual(tarifa.plazo_entrega_dias, 2)

    def test_requiere_sesion_activa(self):
        self.client.logout()
        response = self.client.post("/api/catalogo/servicios", {"nombre": "Planchado"})
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Servicio.objects.filter(nombre="Planchado").exists())
