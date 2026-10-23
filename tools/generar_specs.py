"""Genera los contratos OpenAPI 3.0.3 de los 6 microservicios SAHS.

Uso (desde swagger/): python3 tools/generar_specs.py specs
"""
import json
import sys
from pathlib import Path

OUT = Path(sys.argv[1])

# ---------------------------------------------------------------- helpers de schema

def ref(name):
    return {"$ref": f"#/components/schemas/{name}"}

def nullable_ref(name, desc=None):
    s = {"type": "object", "allOf": [ref(name)], "nullable": True}
    if desc:
        s["description"] = desc
    return s

def arr(item):
    return {"type": "array", "items": item}

def i(desc=None, ex=1, ro=False):
    s = {"type": "integer", "format": "int64", "example": ex}
    if desc: s["description"] = desc
    if ro: s["readOnly"] = True
    return s

def s_(desc=None, ex=None, fmt=None, nullable=False, wo=False, ro=False, pattern=None):
    s = {"type": "string"}
    if fmt: s["format"] = fmt
    if pattern: s["pattern"] = pattern
    if desc: s["description"] = desc
    if ex is not None: s["example"] = ex
    if nullable: s["nullable"] = True
    if wo: s["writeOnly"] = True
    if ro: s["readOnly"] = True
    return s

def b(desc=None, ex=False):
    s = {"type": "boolean", "example": ex}
    if desc: s["description"] = desc
    return s

def n(desc=None, ex=1.0):
    s = {"type": "number", "format": "double", "example": ex}
    if desc: s["description"] = desc
    return s

def obj(props, required=None, desc=None):
    s = {"type": "object", "properties": props}
    if required: s["required"] = required
    if desc: s["description"] = desc
    return s

def ro(schema):
    """Marca un schema anidado como solo lectura (dato que devuelve el servicio)."""
    if "$ref" in schema:
        return {"allOf": [schema], "readOnly": True}
    schema = dict(schema)
    schema["readOnly"] = True
    return schema

HORA = dict(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")

def filtros(*items):
    """Filtros opcionales de un listado: (nombre, schema, descripcion). Se combinan con AND;
    sin filtros, el listado devuelve todo."""
    return [(nombre, schema, desc + " (filtro opcional)", False) for nombre, schema, desc in items]

def id_q(ex=1):
    return {"type": "integer", "format": "int64", "example": ex}

# ---------------------------------------------------------------- verbos HTTP de los commands
# crear_* -> POST 201 y eliminar (helper eliminar) -> DELETE 204 se resuelven solos.
# Lo que no figura acá queda en POST 200: acciones de negocio (login, validar_pago,
# firmar_recibo_de_sueldo) y asignar_* que AGREGAN un elemento a una colección.
_PUT = ("put", "200")      # asignar_* que reemplaza un valor o una lista completa, y editar_*
_PATCH = ("patch", "200")  # cambiar_* / modificar_*
_DEL = ("delete", "200")   # quitar_* / eliminar_X_de_Y: devuelven la entidad modificada
_GET = ("get", "200")      # acciones sin efectos
VERBOS = {
    # USUARIO
    "asignar_rol": _PUT, "editar_usuario": _PUT,
    "cambiar_contrasenia": _PATCH, "cambiar_nombre_rol": _PATCH, "quitar_privilegio": _DEL,
    # PAGO
    "bajar_recibo_sueldo": _GET, "calcular_monto_a_liquidar": _GET,
    # HORARIOS
    "eliminar_franja_horaria_turno": _DEL,
    # PLANIFICACIÓN
    "asignar_estado_a_propuesta": _PUT, "asignar_curso_a_clase": _PUT,
    "cambiar_horas_materia_curso": _PATCH, "quitar_materia_curso": _DEL,
    # ORIENTACIÓN
    "asignar_anio_academico_a_materia": _PUT,
    "quitar_materia_area": _DEL, "asignar_materia_orientacion": _PUT,
    # PROFESOR Y SUPLENCIAS
    "editar_profesor": _PUT, "asignar_usuario_profesor": _PUT,
    "asignar_materias_habilitadas": _PUT, "asignar_disponibilidad": _PUT,
}

# ---------------------------------------------------------------- servicio

class Servicio:
    def __init__(self, archivo, titulo, prefijo, puerto, descripcion, modelos):
        self.archivo = archivo
        self.prefijo = prefijo
        self.deps = []           # [{servicio, endpoint, usado_por}]
        self.tags = []
        self.doc = {
            "openapi": "3.0.3",
            "info": {
                "title": f"{titulo} Service",
                "version": "1.0.0",
                "description": (
                    f"{descripcion}\n\n"
                    f"**Modelos del dominio:** {modelos}.\n\n"
                    "Convenciones: una ruta por función; `POST` para commands y `GET` para queries; "
                    "el id de la entidad principal va en la ruta y el resto de los datos en el body. "
                    "Los datos relacionados de un solo elemento vienen anidados en la entidad.\n\n"
                    "> No hay backend detrás de este contrato: el servidor es ilustrativo y "
                    "\"Try it out\" no va a obtener respuesta."
                ),
            },
            "servers": [{"url": f"http://localhost:{puerto}", "description": "Servidor ilustrativo (sin backend)"}],
            "tags": [],
            "paths": {
                "/actuator/health": {
                    "get": {
                        "tags": ["Health"],
                        "operationId": "health",
                        "summary": "Health check del servicio",
                        "responses": {"200": {"description": "Servicio disponible",
                                               "content": {"application/json": {"schema": ref("Health")}}}},
                    }
                }
            },
            "components": {
                "schemas": {
                    "Error": obj({"codigo": s_(ex="NO_ENCONTRADO"),
                                  "mensaje": s_(ex="No existe el recurso pedido")},
                                 ["codigo", "mensaje"]),
                    "Health": obj({"status": s_(ex="UP")}, ["status"]),
                },
                "responses": {
                    "BadRequest": {"description": "Datos inválidos",
                                   "content": {"application/json": {"schema": ref("Error")}}},
                    "NotFound": {"description": "No existe el recurso",
                                 "content": {"application/json": {"schema": ref("Error")}}},
                },
            },
        }
        self.tag("Health", "Estado del servicio")

    def tag(self, nombre, desc):
        self.doc["tags"].append({"name": nombre, "description": desc})

    def schema(self, nombre, schema):
        self.doc["components"]["schemas"][nombre] = schema

    def dep(self, servicio, endpoint, usado_por):
        self.deps.append({"servicio": servicio, "endpoint": endpoint, "usado_por": usado_por})

    def _invoca(self, op_id):
        return [f"{d['servicio']}.{d['endpoint']}" for d in self.deps if op_id in d["usado_por"]]

    def _add(self, metodo, nombre, tag, summary, id_de=None, body=None, resp=None,
             status="200", resp_desc="OK", content_type="application/json", desc=None,
             id2=None, query_params=None):
        """id2: (nombre_param, descripcion) para un segundo id en la ruta.
        query_params: lista de (nombre, schema, descripcion[, required]). Por defecto son
        obligatorios; los filtros de los listados se pasan con required=False (ver filtros())."""
        assert not (body and metodo in ("get", "delete")), f"{nombre}: {metodo.upper()} no lleva body"
        path = f"/{self.prefijo}/{nombre}" + ("/{id}" if id_de else "") + (f"/{{{id2[0]}}}" if id2 else "")
        op = {"tags": [tag], "operationId": nombre, "summary": summary}
        if desc:
            op["description"] = desc
        params = []
        if id_de:
            params.append({"name": "id", "in": "path", "required": True,
                           "description": f"Id {id_de}", "schema": {"type": "integer", "format": "int64"}})
        if id2:
            params.append({"name": id2[0], "in": "path", "required": True,
                           "description": f"Id {id2[1]}", "schema": {"type": "integer", "format": "int64"}})
        for qp in (query_params or []):
            qn, qs, qd = qp[:3]
            req = qp[3] if len(qp) > 3 else True
            params.append({"name": qn, "in": "query", "required": req, "description": qd, "schema": qs})
        if params:
            op["parameters"] = params
        body_like = bool(query_params)  # un query inválido también responde 400
        if body:
            op["requestBody"] = {"required": True, "content": {"application/json": {"schema": body}}}
        if resp is None:
            responses = {status: {"description": resp_desc}}
        else:
            responses = {status: {"description": resp_desc, "content": {content_type: {"schema": resp}}}}
        if body or body_like:
            responses["400"] = {"$ref": "#/components/responses/BadRequest"}
        if id_de:
            responses["404"] = {"$ref": "#/components/responses/NotFound"}
        op["responses"] = responses
        self.doc["paths"][path] = {metodo: op}

    def command(self, nombre, tag, summary, **kw):
        """El verbo sale de VERBOS; crear_* es POST 201 y el resto, por defecto, POST 200."""
        if nombre.startswith("crear_"):
            metodo, status = "post", "201"
        else:
            metodo, status = VERBOS.get(nombre, ("post", "200"))
        kw.setdefault("status", status)
        if status == "201":
            kw.setdefault("resp_desc", "Creado")
        self._add(metodo, nombre, tag, summary, **kw)

    def query(self, nombre, tag, summary, **kw):
        self._add("get", nombre, tag, summary, **kw)

    def eliminar(self, nombre, tag, summary, id_de):
        self._add("delete", nombre, tag, summary, id_de=id_de, status="204", resp_desc="Eliminado")

    def guardar(self):
        # "Invoca:" en la descripción de cada operación que consume a otro servicio
        for path_item in self.doc["paths"].values():
            for op in path_item.values():
                inv = self._invoca(op["operationId"])
                if inv:
                    linea = "Invoca: " + ", ".join(inv)
                    op["description"] = (op.get("description", "") + "\n\n" + linea).strip()
        self.doc["info"]["x-dependencias"] = self.deps
        if self.deps:
            lineas = "\n".join(f"- `{d['servicio']}.{d['endpoint']}` → usado por: "
                               + ", ".join(f"`{u}`" for u in d["usado_por"]) for d in self.deps)
            self.doc["info"]["description"] += f"\n\n**Dependencias (Invokes):**\n{lineas}"
        else:
            self.doc["info"]["description"] += "\n\n**Dependencias (Invokes):** ninguna."
        # validación interna: cada operationId usado por una dependencia existe
        ops = {op["operationId"] for p in self.doc["paths"].values() for op in p.values()}
        for d in self.deps:
            for u in d["usado_por"]:
                assert u in ops, f"{self.archivo}: dependencia usada por operación inexistente {u}"
        (OUT / self.archivo).write_text(json.dumps(self.doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ---------------------------------------------------------------- resúmenes de otros servicios

def profesor_resumen():
    return obj({"id_profesor": i(ex=12), "nombre": s_(ex="Juan"), "apellido": s_(ex="Ramírez"),
                "legajo": s_(ex="L-0042")},
               desc="Resumen de PROFESOR (servicio Profesor y Suplencias).")

def materia_resumen():
    return obj({"id_materia": i(ex=3), "nombre_materia": s_(ex="Matemática"), "horas_semanales": i(ex=5)},
               desc="Resumen de MATERIA (servicio Orientación).")

def franja_resumen():
    return obj({"id_franja_horaria": i(ex=7), "hora_inicio": s_(ex="07:30", **HORA),
                "hora_fin": s_(ex="08:10", **HORA), "es_recreo": b(), "nombre_dia_lectivo": s_(ex="Lunes")},
               desc="Resumen de FRANJA_HORARIA (servicio Horarios).")

def clase_resumen():
    return obj({"id_clase": i(ex=40), "codigo": s_(ex="CL-1A-MAT"), "descripcion": s_(ex="Matemática 1° A"),
                "id_curso": i(ex=1)},
               desc="Resumen de CLASE (servicio Planificación).")


# ================================================================= USUARIO
def usuario():
    sv = Servicio("usuario.json", "Usuario", "usuario", 8081,
                  "Provee una API para gestionar usuarios y roles. Cada usuario tiene un solo rol.",
                  "Usuario, Rol, Privilegio")
    sv.tag("Acceso", "Ingreso al sistema")
    sv.tag("Usuario", "Cuentas de usuario")
    sv.tag("Rol", "Roles")
    sv.tag("Privilegio", "Privilegios de los roles")

    sv.schema("Rol", obj({"id_rol": i(ex=2, ro=True), "nombre_rol": s_(ex="Profesor")}, ["id_rol", "nombre_rol"]))
    sv.schema("Privilegio", obj({"id_privilegio": i(ex=5, ro=True),
                                 "descripcion_privilegio": s_(ex="Firmar recibos de sueldo")},
                                ["id_privilegio", "descripcion_privilegio"]))
    sv.schema("Usuario", obj({
        "id_usuario": i(ex=10, ro=True),
        "nombre_user": s_(ex="jramirez"),
        "email": s_(fmt="email", ex="jramirez@donbosco.edu.ar"),
        "id_rol": i(ex=2),
        "rol": ro(ref("Rol")),
    }, ["id_usuario", "nombre_user", "email", "id_rol"]))
    sv.schema("LoginRespuesta", obj({"token": s_(ex="eyJhbGciOiJIUzI1NiJ9..."), "usuario": ref("Usuario")},
                                    ["token", "usuario"]))

    pwd = s_(fmt="password", wo=True, ex="secreta123")
    sv.command("login", "Acceso", "Ingresar al sistema",
               body=obj({"email": s_(fmt="email", ex="jramirez@donbosco.edu.ar"), "contrasenia": pwd},
                        ["email", "contrasenia"]),
               resp=ref("LoginRespuesta"),
               desc="Sin esquema de seguridad por ahora: el token se devuelve como texto simple.")
    sv.command("crear_usuario", "Usuario", "Crear usuario",
               body=obj({"nombre_user": s_(ex="jramirez"), "email": s_(fmt="email", ex="jramirez@donbosco.edu.ar"),
                         "contrasenia": pwd, "id_rol": i(ex=2, desc="Opcional: se puede asignar después con asignar_rol")},
                        ["nombre_user", "email", "contrasenia"]),
               resp=ref("Usuario"))
    sv.command("asignar_rol", "Usuario", "Asignar el rol del usuario (reemplaza el anterior)", id_de="del usuario",
               body=obj({"id_rol": i(ex=2)}, ["id_rol"]), resp=ref("Usuario"))
    sv.command("editar_usuario", "Usuario", "Editar usuario (nombre de usuario y email)", id_de="del usuario",
               body=obj({"nombre_user": s_(ex="jramirez"),
                         "email": s_(fmt="email", ex="juan.ramirez@donbosco.edu.ar")}, ["nombre_user", "email"]),
               resp=ref("Usuario"),
               desc="Reemplaza el nombre de usuario y el email. No cambia la contraseña (`cambiar_contrasenia`) "
                    "ni el rol (`asignar_rol`).")
    sv.command("cambiar_contrasenia", "Usuario", "Cambiar contraseña", id_de="del usuario",
               body=obj({"contrasenia": pwd}, ["contrasenia"]), resp=ref("Usuario"))
    sv.eliminar("eliminar_usuario", "Usuario", "Eliminar usuario", "del usuario")

    sv.command("crear_rol", "Rol", "Crear rol", body=obj({"nombre_rol": s_(ex="Administrativo")}, ["nombre_rol"]),
               resp=ref("Rol"))
    sv.command("asignar_privilegio", "Rol", "Asignar un privilegio al rol", id_de="del rol",
               body=obj({"id_privilegio": i(ex=5)}, ["id_privilegio"]), resp=ref("Rol"))
    sv.command("quitar_privilegio", "Rol", "Quitar un privilegio del rol", id_de="del rol",
               id2=("id_privilegio", "del privilegio a quitar"), resp=ref("Rol"))
    sv.eliminar("eliminar_rol", "Rol", "Eliminar rol", "del rol")
    sv.command("cambiar_nombre_rol", "Rol", "Cambiar nombre del rol", id_de="del rol",
               body=obj({"nombre_rol": s_(ex="Docente")}, ["nombre_rol"]), resp=ref("Rol"))

    # Los privilegios se cargan por configuración: no hay commands para crearlos, modificarlos ni borrarlos.
    sv.query("get_usuario", "Usuario", "Obtener usuario (con su rol anidado)", id_de="del usuario", resp=ref("Usuario"))
    sv.query("get_usuarios", "Usuario", "Listar usuarios", resp=arr(ref("Usuario")))
    sv.query("get_privilegios", "Privilegio", "Listar privilegios", resp=arr(ref("Privilegio")))
    sv.query("get_roles", "Rol", "Listar roles", resp=arr(ref("Rol")))
    sv.query("get_rol_privilegios", "Rol", "Privilegios del rol", id_de="del rol", resp=arr(ref("Privilegio")))
    sv.guardar()


# ================================================================= PAGO
def pago():
    sv = Servicio("pago.json", "Pago", "pago", 8082,
                  "Provee una API para gestionar los recibos de sueldo y cálculos de pagos a liquidar.",
                  "Pago, Recibo de Sueldo")
    sv.tag("Pago", "Pagos a liquidar por profesor y período")
    sv.tag("Recibo de sueldo", "Recibos de sueldo, firma y descarga")

    periodo = s_(ex="2026-03", pattern=r"^\d{4}-(0[1-9]|1[0-2])$", desc="Período liquidado (AAAA-MM)")
    sv.schema("Firma", obj({"id_usuario": i(ex=10, desc="Usuario que firmó"),
                            "fecha": s_(fmt="date-time", ex="2026-04-05T10:15:00-03:00")},
                           ["id_usuario", "fecha"]))
    sv.schema("Emisor", obj({"razon_social": s_(ex="Colegio Don Bosco"), "cuit": s_(ex="30-12345678-9")},
                            ["razon_social", "cuit"], desc="Institución que emite el recibo."))
    sv.schema("ConceptoRecibo", obj({
        "descripcion": s_(ex="Horas cátedra · Matemática"),
        "cantidad": {"type": "number", "format": "double", "nullable": True, "example": 10,
                     "description": "Cantidad del concepto (horas, años de antigüedad…); null si no aplica"},
        "importe": n(ex=520000.0, desc="Importe positivo; el tipo indica si suma o resta"),
        "tipo": {"type": "string", "enum": ["haber", "descuento"], "example": "haber"},
    }, ["descripcion", "importe", "tipo"], desc="Línea del recibo: un haber o un descuento."))
    sv.schema("ReciboSueldo", obj({
        "id_recibo_sueldo": i(ex=300, ro=True),
        "id_pago": i(ex=90),
        "id_profesor": i(ex=12, desc="Copiado del pago, para filtrar los recibos"),
        "periodo": periodo,
        "fecha_pago": s_(fmt="date", ex="2026-04-01"),
        "emisor": ref("Emisor"),
        "conceptos": arr(ref("ConceptoRecibo")),
        "total_bruto": n(ex=1050000.0, desc="Suma de los haberes"),
        "total_descuentos": n(ex=205000.0, desc="Suma de los descuentos"),
        "neto": n(ex=845000.0, desc="total_bruto - total_descuentos"),
        "firma_emisor": nullable_ref("Firma", "Firma del administrativo (se completa en validar_pago)"),
        "firma_receptor": nullable_ref("Firma", "Firma del profesor (se completa en firmar_recibo_de_sueldo)"),
    }, ["id_recibo_sueldo", "id_pago", "id_profesor", "periodo", "fecha_pago", "emisor", "conceptos",
        "total_bruto", "total_descuentos", "neto"]))
    sv.schema("Pago", obj({"id_pago": i(ex=90, ro=True), "id_profesor": i(ex=12), "periodo": periodo,
                           "validado": b(ex=False),
                           "recibo_sueldo": ro(ref("ReciboSueldo"))},
                          ["id_pago", "id_profesor", "periodo", "validado"],
                          desc="Cada pago tiene un único recibo de sueldo, que viene anidado."))
    sv.schema("MontoLiquidar", obj({"id_profesor": i(ex=12), "periodo": periodo, "monto": n(ex=845000.0)},
                                   ["id_profesor", "periodo", "monto"]))

    sv.dep("profesor_suplencias", "get_profesor", ["crear_pago", "calcular_monto_a_liquidar"])

    sv.command("crear_pago", "Pago", "Crear pago del profesor para un período",
               body=obj({"id_profesor": i(ex=12), "periodo": periodo}, ["id_profesor", "periodo"]),
               resp=ref("Pago"),
               desc="Genera también el único recibo de sueldo del pago, con sus conceptos y el neto "
                    "de calcular_monto_a_liquidar.")
    sv.command("validar_pago", "Pago", "Validar pago (administrativo)", id_de="del pago",
               body=obj({"id_usuario": i(ex=1, desc="Administrativo que valida")}, ["id_usuario"]),
               resp=ref("Pago"),
               desc="Deja `validado` en true y completa `firma_emisor` en el recibo del pago.")
    sv.command("bajar_recibo_sueldo", "Recibo de sueldo", "Descargar el recibo en PDF", id_de="del recibo de sueldo",
               resp={"type": "string", "format": "binary"}, content_type="application/pdf",
               resp_desc="PDF del recibo",
               desc="Es GET porque solo descarga el PDF (en el documento figura como command).")
    sv.command("calcular_monto_a_liquidar", "Pago", "Calcular monto a liquidar", id_de="del profesor",
               query_params=[("periodo", periodo, "Período a liquidar (AAAA-MM)")], resp=ref("MontoLiquidar"),
               desc="El cálculo es interno del servicio; solo recibe el profesor y el período. "
                    "Es GET porque no guarda nada (en el documento figura como command).")
    sv.command("firmar_recibo_de_sueldo", "Recibo de sueldo", "Firmar recibo (profesor)", id_de="del recibo de sueldo",
               body=obj({"id_usuario": i(ex=10, desc="Usuario del profesor que firma")}, ["id_usuario"]),
               resp=ref("ReciboSueldo"),
               desc="Completa `firma_receptor` con el usuario y la fecha. La firma es definitiva: "
                    "no hay operación para revertirla.")

    filtros_pago = filtros(("id_profesor", id_q(12), "Profesor liquidado"),
                           ("periodo", periodo, "Período liquidado (AAAA-MM)"))
    sv.query("get_pagos", "Pago", "Listar pagos (con su recibo anidado)", resp=arr(ref("Pago")),
             query_params=filtros_pago)
    sv.query("get_recibos_de_sueldo", "Recibo de sueldo", "Listar recibos de sueldo", resp=arr(ref("ReciboSueldo")),
             query_params=filtros_pago)
    sv.guardar()


# ================================================================= HORARIOS
def horarios():
    sv = Servicio("horarios.json", "Horarios", "horarios", 8083,
                  "Provee una API que define estructuralmente los bloques de franja horaria y turnos.",
                  "Día_lectivo, Franja_horaria, Turno")
    sv.tag("Día lectivo", "Días de la semana con clase")
    sv.tag("Franja horaria", "Bloques horarios (incluye recreos)")
    sv.tag("Turno", "Turnos y sus franjas")

    sv.schema("DiaLectivo", obj({"id_dia_lectivo": i(ex=1, ro=True),
                                 "nombre_dia_lectivo": s_(ex="Lunes", desc="Día de la semana")},
                                ["id_dia_lectivo", "nombre_dia_lectivo"]))
    sv.schema("FranjaHoraria", obj({
        "id_franja_horaria": i(ex=7, ro=True),
        "hora_inicio": s_(ex="07:30", desc="HH:mm", **HORA),
        "hora_fin": s_(ex="08:10", desc="HH:mm", **HORA),
        "descripcion": s_(ex="1° módulo"),
        "es_recreo": b(ex=False),
        "id_dia_lectivo": i(ex=1),
        "dia_lectivo": ro(ref("DiaLectivo")),
    }, ["id_franja_horaria", "hora_inicio", "hora_fin", "es_recreo", "id_dia_lectivo"]))
    sv.schema("Turno", obj({
        "id_turno": i(ex=1, ro=True),
        "nombre": s_(ex="Mañana"),
        "cantidad_franjas_total": i(ex=8),
        "franjas_horarias": ro(arr(ref("FranjaHoraria"))),
    }, ["id_turno", "nombre", "cantidad_franjas_total"]))

    sv.command("crear_dia_lectivo", "Día lectivo", "Crear día lectivo",
               body=obj({"nombre_dia_lectivo": s_(ex="Lunes")}, ["nombre_dia_lectivo"]), resp=ref("DiaLectivo"))
    sv.eliminar("eliminar_dia_lectivo", "Día lectivo", "Eliminar día lectivo", "del día lectivo")
    sv.command("crear_franja_horaria", "Franja horaria", "Crear franja horaria",
               body=obj({"hora_inicio": s_(ex="07:30", **HORA), "hora_fin": s_(ex="08:10", **HORA),
                         "descripcion": s_(ex="1° módulo"), "es_recreo": b(ex=False), "id_dia_lectivo": i(ex=1)},
                        ["hora_inicio", "hora_fin", "es_recreo", "id_dia_lectivo"]),
               resp=ref("FranjaHoraria"))
    sv.command("crear_turno", "Turno", "Crear turno",
               body=obj({"nombre": s_(ex="Mañana"), "cantidad_franjas_total": i(ex=8)},
                        ["nombre", "cantidad_franjas_total"]),
               resp=ref("Turno"))
    sv.eliminar("eliminar_turno", "Turno", "Eliminar turno", "del turno")
    sv.command("asignar_franja_a_turno", "Turno", "Asignar franja horaria al turno", id_de="del turno",
               body=obj({"id_franja_horaria": i(ex=7)}, ["id_franja_horaria"]), resp=ref("Turno"))
    sv.command("eliminar_franja_horaria_turno", "Turno", "Quitar franja horaria del turno", id_de="del turno",
               id2=("id_franja_horaria", "de la franja horaria a quitar"), resp=ref("Turno"))

    sv.query("get_dia_lectivo", "Día lectivo", "Obtener día lectivo", id_de="del día lectivo", resp=ref("DiaLectivo"))
    sv.query("get_dias_lectivos", "Día lectivo", "Listar días lectivos", resp=arr(ref("DiaLectivo")))
    sv.query("get_franja_horaria_dia_lectivo", "Día lectivo", "Franjas horarias del día lectivo",
             id_de="del día lectivo", resp=arr(ref("FranjaHoraria")))
    sv.query("get_turno", "Turno", "Obtener turno (con sus franjas)", id_de="del turno", resp=ref("Turno"))
    sv.query("get_turnos", "Turno", "Listar turnos", resp=arr(ref("Turno")))
    sv.query("get_franja_horaria", "Franja horaria", "Obtener franja horaria", id_de="de la franja horaria",
             resp=ref("FranjaHoraria"))
    sv.query("get_franjas_horarias", "Franja horaria", "Listar franjas horarias", resp=arr(ref("FranjaHoraria")))
    sv.guardar()


# ================================================================= PLANIFICACIÓN
def planificacion():
    sv = Servicio("planificacion.json", "Planificación", "planificacion", 8084,
                  "Provee una API para gestionar las planificaciones de las clases de los cursos.",
                  "Clase, Año_académico, Curso, Propuesta, Estado_Propuesta, Ciclo_Lectivo")
    sv.tag("Propuesta", "Propuestas de planificación (grilla de la escuela)")
    sv.tag("Estado de propuesta", "Estados posibles de una propuesta (Borrador, En revisión, Validada, Cerrada)")
    sv.tag("Ciclo lectivo", "Ciclos lectivos")
    sv.tag("Año académico", "Años curriculares")
    sv.tag("Curso", "Cursos")
    sv.tag("Clase", "Clases de cada curso")

    sv.schema("MateriaResumen", materia_resumen())
    sv.schema("FranjaHorariaResumen", franja_resumen())
    sv.schema("ProfesorResumen", profesor_resumen())
    sv.schema("TurnoResumen", obj({"id_turno": i(ex=1), "nombre": s_(ex="Mañana")},
                                  desc="Resumen de TURNO (servicio Horarios)."))
    sv.schema("OrientacionResumen", obj({"id_orientacion": i(ex=2), "nombre_orientacion": s_(ex="Economía"),
                                         "codigo": s_(ex="ECO")},
                                        desc="Resumen de ORIENTACIÓN (servicio Orientación)."))
    sv.schema("SuplenciaResumen", obj({"id_suplencia": i(ex=15), "fecha_inicio": s_(fmt="date", ex="2026-05-04"),
                                       "fecha_fin": s_(fmt="date", ex="2026-05-08"), "motivo": s_(ex="Licencia médica"),
                                       "profesor": ref("ProfesorResumen")},
                                      desc="Resumen de SUPLENCIA (servicio Profesor y Suplencias)."))

    sv.schema("MateriaCurso", obj({
        "id_materia": i(ex=3), "nombre_materia": s_(ex="Matemática"),
        "horas_semanales": i(ex=4, desc="Horas de la materia en este curso. Si no se definen, "
                                        "se toman las de la materia."),
    }, ["id_materia", "nombre_materia", "horas_semanales"], desc="Materia que se dicta en el curso, con sus horas."))
    sv.schema("EstadoPropuesta", obj({"id_estado": i(ex=1, ro=True), "nombre": s_(ex="Borrador"),
                                      "codigo": s_(ex="BOR")}, ["id_estado", "nombre", "codigo"],
                                     desc="Catálogo gestionado con crear_estado_propuesta. Carga inicial: "
                                          "Borrador (BOR), En revisión (REV), Validada (VAL) y Cerrada (CER). "
                                          "El estado es de toda la propuesta, no de cada curso."))
    sv.schema("CicloLectivo", obj({"id_ciclo_lectivo": i(ex=2026, ro=True), "anio_calendario": i(ex=2026)},
                                  ["id_ciclo_lectivo", "anio_calendario"]))
    sv.schema("AnioAcademico", obj({"id_anio_academico": i(ex=1, ro=True), "anio_curricular": s_(ex="1° año"),
                                    "codigo": s_(ex="1ER")}, ["id_anio_academico", "anio_curricular", "codigo"]))
    sv.schema("Propuesta", obj({
        "id_propuesta": i(ex=5, ro=True),
        "nombre": s_(ex="Propuesta 2026 v1"),
        "descripcion_propuesta": s_(ex="Primera versión de la grilla 2026"),
        "fecha_creacion": s_(fmt="date-time", ex="2026-02-10T09:00:00-03:00", ro=True),
        "fecha_modificacion": s_(fmt="date-time", ex="2026-02-12T18:30:00-03:00", ro=True),
        "codigo": s_(ex="P-2026-01"),
        "id_ciclo_lectivo": i(ex=2026),
        "estado": ro(ref("EstadoPropuesta")),
        "ids_clases": arr(i(ex=40)),
    }, ["id_propuesta", "nombre", "codigo", "id_ciclo_lectivo"]))
    sv.schema("Curso", obj({
        "id_curso": i(ex=1, ro=True),
        "division": s_(ex="A"),
        "id_anio_academico": i(ex=1),
        "id_ciclo_lectivo": i(ex=2026),
        "id_turno": i(ex=1),
        "turno": ro(ref("TurnoResumen")),
        "id_orientacion": i(ex=2),
        "orientacion": ro(ref("OrientacionResumen")),
        "materias": ro(arr(ref("MateriaCurso"))),
        "franjas_horarias": ro(arr(ref("FranjaHorariaResumen"))),
    }, ["id_curso", "division", "id_ciclo_lectivo", "id_turno", "id_orientacion"],
        desc="Muestra las materias del curso con sus horas, pero no sus clases (para eso está get_curso_clases)."))
    sv.schema("Clase", obj({
        "id_clase": i(ex=40, ro=True),
        "descripcion": s_(ex="Matemática 1° A"),
        "codigo": s_(ex="CL-1A-MAT"),
        "id_curso": i(ex=1),
        "id_materia": i(ex=3),
        "materia": ro(ref("MateriaResumen")),
        "ids_franjas_horarias": arr(i(ex=7)),
        "franjas_horarias": ro(arr(ref("FranjaHorariaResumen"))),
        "ids_profesores": arr(i(ex=12)),
        "profesores": ro(arr(ref("ProfesorResumen"))),
        "suplencia": ro(nullable_ref("SuplenciaResumen", "Suplencia vigente de la clase, si la hay")),
    }, ["id_clase", "codigo", "id_curso", "id_materia"]))

    sv.dep("orientacion", "get_materia", ["get_clase", "get_clases", "get_curso", "get_curso_clases",
                                          "asignar_materia_a_curso"])
    sv.dep("orientacion", "get_orientacion", ["get_curso", "crear_curso"])
    sv.dep("horarios", "get_franja_horaria", ["get_clase", "get_curso"])
    sv.dep("horarios", "get_turno", ["get_curso"])
    sv.dep("profesor_suplencias", "get_profesor", ["get_clase"])
    sv.dep("profesor_suplencias", "get_suplencias", ["get_clase"])
    sv.dep("profesor_suplencias", "get_disponibilidad_profesor", ["crear_clase"])

    sv.command("crear_propuesta", "Propuesta", "Crear propuesta (queda en estado Borrador)",
               body=obj({"nombre": s_(ex="Propuesta 2026 v1"), "descripcion_propuesta": s_(ex="Primera versión"),
                         "codigo": s_(ex="P-2026-01"), "id_ciclo_lectivo": i(ex=2026)},
                        ["nombre", "codigo", "id_ciclo_lectivo"]),
               resp=ref("Propuesta"),
               desc="La propuesta nace en Borrador (BOR) y se valida completa, no curso por curso.")
    sv.command("crear_estado_propuesta", "Estado de propuesta", "Crear estado de propuesta",
               body=obj({"nombre": s_(ex="Validada"), "codigo": s_(ex="VAL")}, ["nombre", "codigo"]),
               resp=ref("EstadoPropuesta"))
    sv.command("asignar_estado_a_propuesta", "Propuesta", "Asignar estado a la propuesta", id_de="de la propuesta",
               body=obj({"id_estado": i(ex=2)}, ["id_estado"]), resp=ref("Propuesta"))
    sv.command("crear_ciclo_lectivo", "Ciclo lectivo", "Crear ciclo lectivo",
               body=obj({"anio_calendario": i(ex=2026)}, ["anio_calendario"]), resp=ref("CicloLectivo"))
    sv.command("crear_curso", "Curso", "Crear curso",
               body=obj({"division": s_(ex="A"), "id_ciclo_lectivo": i(ex=2026), "id_turno": i(ex=1),
                         "id_orientacion": i(ex=2, desc="Obligatoria; el ciclo básico usa su propia orientación")},
                        ["division", "id_ciclo_lectivo", "id_turno", "id_orientacion"]),
               resp=ref("Curso"),
               desc="El año académico se asigna con asignar_curso_a_anio_academico. La orientación se "
                    "cambia después desde el servicio Orientación (asignar_curso_a_orientacion).")
    sv.command("crear_clase", "Clase", "Crear clase",
               body=obj({"descripcion": s_(ex="Matemática 1° A"), "codigo": s_(ex="CL-1A-MAT"),
                         "id_curso": i(ex=1), "id_materia": i(ex=3),
                         "ids_franjas_horarias": arr(i(ex=7)), "ids_profesores": arr(i(ex=12))},
                        ["codigo", "id_curso", "id_materia", "ids_franjas_horarias", "ids_profesores"]),
               resp=ref("Clase"),
               desc="Verifica que los profesores estén disponibles en las franjas indicadas.")
    horas_curso = i(ex=4, desc="Horas semanales de la materia en el curso")
    sv.command("asignar_materia_a_curso", "Curso", "Agregar una materia al plan del curso", id_de="del curso",
               body=obj({"id_materia": i(ex=3), "horas_semanales": horas_curso}, ["id_materia"]),
               resp=ref("Curso"),
               desc="Si no se indican las horas, se toman las de la materia.")
    sv.command("cambiar_horas_materia_curso", "Curso", "Cambiar las horas de una materia en el curso",
               id_de="del curso", body=obj({"id_materia": i(ex=3), "horas_semanales": horas_curso},
                                           ["id_materia", "horas_semanales"]),
               resp=ref("Curso"), desc="Solo cambia las horas en este curso; la materia no se modifica.")
    sv.command("quitar_materia_curso", "Curso", "Quitar una materia del plan del curso", id_de="del curso",
               id2=("id_materia", "de la materia a quitar"), resp=ref("Curso"))
    sv.command("asignar_curso_a_clase", "Clase", "Asignar curso a la clase", id_de="de la clase",
               body=obj({"id_curso": i(ex=1)}, ["id_curso"]), resp=ref("Clase"))
    sv.command("crear_anio_academico", "Año académico", "Crear año académico",
               body=obj({"anio_curricular": s_(ex="1° año"), "codigo": s_(ex="1ER")}, ["anio_curricular", "codigo"]),
               resp=ref("AnioAcademico"))
    sv.command("asignar_clase_a_propuesta", "Propuesta", "Agregar una clase a la propuesta", id_de="de la propuesta",
               body=obj({"id_clase": i(ex=40)}, ["id_clase"]), resp=ref("Propuesta"))
    sv.command("asignar_curso_a_anio_academico", "Año académico", "Asignar un curso al año académico",
               id_de="del año académico", body=obj({"id_curso": i(ex=1)}, ["id_curso"]), resp=ref("Curso"))

    sv.query("get_posibles_estados_de_propuestas", "Estado de propuesta", "Listar estados posibles",
             resp=arr(ref("EstadoPropuesta")))
    sv.query("get_estado_actual_de_propuesta", "Propuesta", "Estado actual de la propuesta", id_de="de la propuesta",
             resp=ref("EstadoPropuesta"))
    sv.query("get_propuestas", "Propuesta", "Listar propuestas", resp=arr(ref("Propuesta")),
             query_params=filtros(("id_ciclo_lectivo", id_q(2026), "Ciclo lectivo de la propuesta"),
                                  ("id_estado", id_q(1), "Estado actual de la propuesta")))
    sv.query("get_propuesta", "Propuesta", "Obtener propuesta", id_de="de la propuesta", resp=ref("Propuesta"))
    sv.query("get_ciclo_lectivo", "Ciclo lectivo", "Obtener ciclo lectivo", id_de="del ciclo lectivo",
             resp=ref("CicloLectivo"))
    sv.query("get_ciclos_lectivos", "Ciclo lectivo", "Listar ciclos lectivos", resp=arr(ref("CicloLectivo")))
    sv.query("get_curso_clases", "Curso", "Clases del curso", id_de="del curso", resp=arr(ref("Clase")))
    sv.query("get_curso", "Curso", "Obtener curso (turno, orientación, materias y franjas anidados)",
             id_de="del curso", resp=ref("Curso"))
    sv.query("get_cursos", "Curso", "Listar cursos", resp=arr(ref("Curso")),
             query_params=filtros(("id_ciclo_lectivo", id_q(2026), "Ciclo lectivo del curso")))
    sv.query("get_clase", "Clase", "Obtener clase (materia, franjas, profesores y suplencia anidados)",
             id_de="de la clase", resp=ref("Clase"),
             desc="La suplencia vigente se obtiene con `get_suplencias?id_clase=<id>` y la fecha del día: "
                  "la referencia entre suplencia y clase la guarda la suplencia.")
    sv.query("get_clases", "Clase", "Listar clases", resp=arr(ref("Clase")),
             query_params=filtros(("id_profesor", id_q(12), "Profesor que figura en `ids_profesores`"),
                                  ("id_curso", id_q(1), "Curso de la clase"),
                                  ("id_propuesta", id_q(5), "Propuesta que incluye la clase")),
             desc="Con `id_profesor` e `id_propuesta` se arma la grilla de un profesor.")
    sv.query("get_anio_academico", "Año académico", "Obtener año académico", id_de="del año académico",
             resp=ref("AnioAcademico"))
    sv.query("get_anios_academicos", "Año académico", "Listar años académicos", resp=arr(ref("AnioAcademico")))
    sv.query("get_cursos_anio_academico", "Año académico", "Cursos del año académico", id_de="del año académico",
             resp=arr(ref("Curso")))
    sv.guardar()


# ================================================================= ORIENTACIÓN
def orientacion():
    sv = Servicio("orientacion.json", "Orientación", "orientacion", 8085,
                  "Provee una API para gestionar las orientaciones, y las áreas y materias que las componen.",
                  "Orientación, Área, Materia")
    sv.tag("Orientación", "Orientaciones (planes de estudio)")
    sv.tag("Área", "Áreas que agrupan materias")
    sv.tag("Materia", "Materias")

    sv.schema("ProfesorResumen", profesor_resumen())
    sv.schema("Orientacion", obj({
        "id_orientacion": i(ex=2, ro=True),
        "nombre_orientacion": s_(ex="Economía"),
        "descripcion_orientacion": s_(ex="Bachiller en Economía y Administración"),
        "codigo": s_(ex="ECO"),
        "ids_cursos": arr(i(ex=4)),
    }, ["id_orientacion", "nombre_orientacion", "codigo"]))
    sv.schema("Area", obj({
        "id_area": i(ex=1, ro=True),
        "nombre_area": s_(ex="Exactas"),
        "descripcion_area": s_(ex="Matemática, ciencias naturales e informática"),
        "id_profesor_coordinador": {"type": "integer", "format": "int64", "nullable": True, "example": 12},
        "coordinador": ro(nullable_ref("ProfesorResumen", "Profesor que coordina el área")),
    }, ["id_area", "nombre_area"]))
    sv.schema("Materia", obj({
        "id_materia": i(ex=3, ro=True),
        "nombre_materia": s_(ex="Matemática"),
        "descripcion_materia": s_(ex="Matemática de 1° año"),
        "horas_semanales": i(ex=5),
        "id_area": {"type": "integer", "format": "int64", "nullable": True, "example": 1,
                    "description": "Una materia puede no tener área"},
        "area": ro(nullable_ref("Area")),
        "id_orientacion": i(ex=2, desc="Orientación de la materia. Dos materias con el mismo nombre "
                                       "en distintas orientaciones son materias distintas."),
        "orientacion": ro(ref("Orientacion")),
        "id_anio_academico": i(ex=1),
        "ids_clases": arr(i(ex=40)),
    }, ["id_materia", "nombre_materia", "horas_semanales", "id_orientacion"]))

    sv.dep("profesor_suplencias", "get_profesor", ["get_profesores_materia", "get_profesores_area", "get_area"])
    sv.dep("planificacion", "get_clase", ["asignar_clase_a_materia"])
    sv.dep("planificacion", "get_curso", ["asignar_curso_a_orientacion"])
    sv.dep("planificacion", "get_anio_academico", ["asignar_anio_academico_a_materia"])

    sv.command("crear_materia", "Materia", "Crear materia",
               body=obj({"nombre_materia": s_(ex="Matemática"), "descripcion_materia": s_(ex="Matemática de 1° año"),
                         "horas_semanales": i(ex=5),
                         "id_area": {"type": "integer", "format": "int64", "nullable": True, "example": 1},
                         "id_orientacion": i(ex=2), "id_anio_academico": i(ex=1)},
                        ["nombre_materia", "horas_semanales", "id_orientacion"]),
               resp=ref("Materia"))
    sv.eliminar("eliminar_materia", "Materia", "Eliminar materia", "de la materia")
    sv.command("crear_area", "Área", "Crear área",
               body=obj({"nombre_area": s_(ex="Exactas"), "descripcion_area": s_(ex="Matemática y ciencias"),
                         "id_profesor_coordinador": {"type": "integer", "format": "int64", "nullable": True,
                                                     "example": 12}},
                        ["nombre_area"]),
               resp=ref("Area"))
    sv.command("crear_orientacion", "Orientación", "Crear orientación",
               body=obj({"nombre_orientacion": s_(ex="Economía"), "descripcion_orientacion": s_(ex="Bachiller en Economía"),
                         "codigo": s_(ex="ECO")}, ["nombre_orientacion", "codigo"]),
               resp=ref("Orientacion"))
    sv.command("asignar_materia_area", "Área", "Asignar una materia al área", id_de="del área",
               body=obj({"id_materia": i(ex=3)}, ["id_materia"]), resp=ref("Materia"))
    sv.command("asignar_materia_orientacion", "Materia", "Asignar la orientación de la materia (reemplaza la anterior)",
               id_de="de la materia", body=obj({"id_orientacion": i(ex=2)}, ["id_orientacion"]), resp=ref("Materia"))
    sv.eliminar("eliminar_orientacion", "Orientación", "Eliminar orientación", "de la orientación")
    sv.eliminar("eliminar_area", "Área", "Eliminar área", "del área")
    sv.command("quitar_materia_area", "Área", "Quitar una materia del área", id_de="del área",
               id2=("id_materia", "de la materia a quitar"), resp=ref("Materia"))
    sv.command("asignar_curso_a_orientacion", "Orientación", "Asignar un curso a la orientación",
               id_de="de la orientación", body=obj({"id_curso": i(ex=4)}, ["id_curso"]), resp=ref("Orientacion"))
    sv.command("asignar_clase_a_materia", "Materia", "Asignar una clase a la materia", id_de="de la materia",
               body=obj({"id_clase": i(ex=40)}, ["id_clase"]), resp=ref("Materia"))
    sv.command("asignar_anio_academico_a_materia", "Materia", "Asignar el año académico de la materia",
               id_de="de la materia", body=obj({"id_anio_academico": i(ex=1)}, ["id_anio_academico"]),
               resp=ref("Materia"))

    sv.query("get_materia", "Materia", "Obtener materia (área y orientación anidadas)", id_de="de la materia",
             resp=ref("Materia"))
    sv.query("get_materias", "Materia", "Listar materias", resp=arr(ref("Materia")))
    sv.query("get_orientacion", "Orientación", "Obtener orientación", id_de="de la orientación",
             resp=ref("Orientacion"))
    sv.query("get_orientaciones", "Orientación", "Listar orientaciones", resp=arr(ref("Orientacion")))
    sv.query("get_area", "Área", "Obtener área (con su coordinador)", id_de="del área", resp=ref("Area"))
    sv.query("get_areas", "Área", "Listar áreas", resp=arr(ref("Area")))
    sv.query("get_materias_orientacion", "Orientación", "Materias de la orientación", id_de="de la orientación",
             resp=arr(ref("Materia")))
    sv.query("get_materias_area", "Área", "Materias del área", id_de="del área", resp=arr(ref("Materia")))
    sv.query("get_profesores_area", "Área", "Profesores del área", id_de="del área", resp=arr(ref("ProfesorResumen")))
    sv.query("get_profesores_materia", "Materia", "Profesores habilitados para la materia", id_de="de la materia",
             resp=arr(ref("ProfesorResumen")))
    sv.guardar()


# ================================================================= PROFESOR Y SUPLENCIAS
def profesor_suplencias():
    sv = Servicio("profesor_suplencias.json", "Profesor y Suplencias", "profesor_suplencias", 8086,
                  "Provee una API para gestionar los profesores y las suplencias.",
                  "Suplencia, Profesor")
    sv.tag("Profesor", "Profesores, su usuario, materias habilitadas y disponibilidad")
    sv.tag("Suplencia", "Suplencias: quién cubre qué clases")

    sv.schema("MateriaResumen", materia_resumen())
    sv.schema("FranjaHorariaResumen", franja_resumen())
    sv.schema("ClaseResumen", clase_resumen())
    sv.schema("ProfesorResumen", profesor_resumen())
    sv.schema("Profesor", obj({
        "id_profesor": i(ex=12, ro=True),
        "nombre": s_(ex="Juan"),
        "apellido": s_(ex="Ramírez"),
        "documento": s_(ex="30123456"),
        "legajo": s_(ex="L-0042", nullable=True),
        "cargo_asociado": s_(ex="Profesor titular", nullable=True),
        "correo_electronico": s_(fmt="email", ex="jramirez@donbosco.edu.ar"),
        "telefono": s_(ex="+54 299 555-1234"),
        "direccion": s_(ex="Av. Argentina 123, Neuquén"),
        "id_usuario": dict(i(ex=10, desc="Usuario para ingresar al sistema. Se asigna con asignar_usuario_profesor"),
                           nullable=True),
        "lista_materias_habilitadas": ro(arr(ref("MateriaResumen"))),
        "disponibilidad": ro(arr(ref("FranjaHorariaResumen"))),
    }, ["id_profesor", "nombre", "apellido", "documento"]))
    sv.schema("Suplencia", obj({
        "id_suplencia": i(ex=15, ro=True),
        "fecha_inicio": s_(fmt="date", ex="2026-05-04"),
        "fecha_fin": s_(fmt="date", ex="2026-05-08"),
        "motivo": s_(ex="Licencia médica"),
        "id_profesor": i(ex=12, desc="Profesor que cubre la suplencia"),
        "profesor": ro(ref("ProfesorResumen")),
        "ids_clases": arr(i(ex=40)),
        "clases": ro(arr(ref("ClaseResumen"))),
    }, ["id_suplencia", "fecha_inicio", "fecha_fin", "motivo", "id_profesor", "ids_clases"]))

    sv.dep("usuario", "get_usuario", ["asignar_usuario_profesor"])
    sv.dep("orientacion", "get_materia", ["asignar_materias_habilitadas", "get_profesor"])
    sv.dep("planificacion", "get_clase", ["crear_suplencia", "get_suplencias"])
    sv.dep("horarios", "get_franja_horaria", ["asignar_disponibilidad", "get_disponibilidad_profesor"])

    sv.command("crear_suplencia", "Suplencia", "Crear suplencia (suplente y clases que cubre)",
               body=obj({"fecha_inicio": s_(fmt="date", ex="2026-05-04"), "fecha_fin": s_(fmt="date", ex="2026-05-08"),
                         "motivo": s_(ex="Licencia médica"),
                         "id_profesor": i(ex=12, desc="Profesor que cubre la suplencia"),
                         "ids_clases": dict(arr(i(ex=40)), minItems=1, description="Clases que cubre")},
                        ["fecha_inicio", "fecha_fin", "motivo", "id_profesor", "ids_clases"]),
               resp=ref("Suplencia"),
               desc="La suplencia se crea completa: un suplente y las clases que cubre en el período.")
    sv.command("crear_profesor", "Profesor", "Crear profesor",
               body=obj({"nombre": s_(ex="Juan"), "apellido": s_(ex="Ramírez"), "documento": s_(ex="30123456"),
                         "correo_electronico": s_(fmt="email", ex="jramirez@donbosco.edu.ar"),
                         "telefono": s_(ex="+54 299 555-1234"), "direccion": s_(ex="Av. Argentina 123, Neuquén")},
                        ["nombre", "apellido", "documento", "correo_electronico"]),
               resp=ref("Profesor"),
               desc="No crea el usuario: se asigna después con `asignar_usuario_profesor`.")
    sv.command("editar_profesor", "Profesor", "Editar los datos del profesor", id_de="del profesor",
               body=obj({"nombre": s_(ex="Juan"), "apellido": s_(ex="Ramírez"), "documento": s_(ex="30123456"),
                         "correo_electronico": s_(fmt="email", ex="jramirez@donbosco.edu.ar"),
                         "telefono": s_(ex="+54 299 555-1234"), "direccion": s_(ex="Av. Argentina 123, Neuquén"),
                         "legajo": s_(ex="L-0042", nullable=True),
                         "cargo_asociado": s_(ex="Profesor titular", nullable=True)},
                        ["nombre", "apellido", "documento", "correo_electronico", "telefono", "direccion",
                         "legajo", "cargo_asociado"]),
               resp=ref("Profesor"),
               desc="Reemplaza todos los datos editables del profesor. `null` en `legajo` o `cargo_asociado` "
                    "lo deja sin legajo o sin cargo.")
    sv.command("asignar_usuario_profesor", "Profesor", "Asignar el usuario del profesor (reemplaza el anterior)",
               id_de="del profesor", body=obj({"id_usuario": i(ex=10)}, ["id_usuario"]), resp=ref("Profesor"))
    sv.command("asignar_materias_habilitadas", "Profesor", "Asignar materias que puede dictar", id_de="del profesor",
               body=obj({"ids_materias": arr(i(ex=3))}, ["ids_materias"]), resp=ref("Profesor"))
    sv.command("asignar_disponibilidad", "Profesor", "Asignar disponibilidad horaria", id_de="del profesor",
               body=obj({"ids_franjas_horarias": arr(i(ex=7))}, ["ids_franjas_horarias"]), resp=ref("Profesor"),
               desc="Reemplaza la disponibilidad del profesor por las franjas indicadas.")

    sv.query("get_profesor", "Profesor", "Obtener profesor", id_de="del profesor", resp=ref("Profesor"))
    sv.query("get_profesores", "Profesor", "Listar profesores", resp=arr(ref("Profesor")),
             query_params=filtros(("id_usuario", id_q(10), "Usuario del profesor")),
             desc="Con `id_usuario` se obtiene el profesor del usuario que inició sesión.")
    fecha_q = {"type": "string", "format": "date", "example": "2026-05-11"}
    sv.query("get_suplencias", "Suplencia", "Listar suplencias", resp=arr(ref("Suplencia")),
             query_params=filtros(("fecha_desde", fecha_q, "Inicio del rango"),
                                  ("fecha_hasta", dict(fecha_q, example="2026-05-15"), "Fin del rango"),
                                  ("id_profesor", id_q(12), "Profesor que cubre"),
                                  ("id_curso", id_q(1), "Curso de alguna de las clases cubiertas"),
                                  ("id_clase", id_q(40), "Clase incluida en la suplencia")),
             desc="Con `fecha_desde` y `fecha_hasta` devuelve las suplencias cuyo período se superpone con el rango.")
    sv.query("get_disponibilidad_profesor", "Profesor", "Disponibilidad horaria del profesor", id_de="del profesor",
             resp=arr(ref("FranjaHorariaResumen")))
    sv.guardar()


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for f in (usuario, pago, horarios, planificacion, orientacion, profesor_suplencias):
        f()
    print("OK:", ", ".join(sorted(p.name for p in OUT.glob("*.json"))))
