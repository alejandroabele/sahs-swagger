// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { AsignarDisponibilidadBody, AsignarMateriasHabilitadasBody, AsignarUsuarioProfesorBody, CrearProfesorBody, CrearSuplenciaBody, EditarProfesorBody, FranjaHorariaResumen, GetProfesoresQuery, GetSuplenciasQuery, Profesor, Suplencia } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Profesor y Suplencias Service. */
export const profesorSuplencias = {
  /** POST /profesor_suplencias/crear_suplencia — Crear suplencia (suplente y clases que cubre). La suplencia se crea completa: un suplente y las clases que cubre en el período. */
  crear_suplencia: (body: CrearSuplenciaBody) =>
    pedir<Suplencia>(`/profesor_suplencias/crear_suplencia`, { metodo: 'POST', body }),
  /** GET /profesor_suplencias/get_suplencias — Listar suplencias. Con `fecha_desde` y `fecha_hasta` devuelve las suplencias cuyo período se superpone con el rango. */
  get_suplencias: (query?: GetSuplenciasQuery) =>
    pedir<Suplencia[]>(`/profesor_suplencias/get_suplencias`, { metodo: 'GET', query }),
  /** POST /profesor_suplencias/crear_profesor — Crear profesor. No crea el usuario: se asigna después con `asignar_usuario_profesor`. */
  crear_profesor: (body: CrearProfesorBody) =>
    pedir<Profesor>(`/profesor_suplencias/crear_profesor`, { metodo: 'POST', body }),
  /** PUT /profesor_suplencias/editar_profesor/{id} — Editar los datos del profesor. Reemplaza todos los datos editables del profesor. `null` en `legajo` o `cargo_asociado` lo deja sin legajo o sin cargo. */
  editar_profesor: (id: number, body: EditarProfesorBody) =>
    pedir<Profesor>(`/profesor_suplencias/editar_profesor/${id}`, { metodo: 'PUT', body }),
  /** PUT /profesor_suplencias/asignar_usuario_profesor/{id} — Asignar el usuario del profesor (reemplaza el anterior). Invoca: usuario.get_usuario */
  asignar_usuario_profesor: (id: number, body: AsignarUsuarioProfesorBody) =>
    pedir<Profesor>(`/profesor_suplencias/asignar_usuario_profesor/${id}`, { metodo: 'PUT', body }),
  /** PUT /profesor_suplencias/asignar_materias_habilitadas/{id} — Asignar materias que puede dictar. Invoca: orientacion.get_materia */
  asignar_materias_habilitadas: (id: number, body: AsignarMateriasHabilitadasBody) =>
    pedir<Profesor>(`/profesor_suplencias/asignar_materias_habilitadas/${id}`, { metodo: 'PUT', body }),
  /** PUT /profesor_suplencias/asignar_disponibilidad/{id} — Asignar disponibilidad horaria. Reemplaza la disponibilidad del profesor por las franjas indicadas. */
  asignar_disponibilidad: (id: number, body: AsignarDisponibilidadBody) =>
    pedir<Profesor>(`/profesor_suplencias/asignar_disponibilidad/${id}`, { metodo: 'PUT', body }),
  /** GET /profesor_suplencias/get_profesor/{id} — Obtener profesor. Invoca: orientacion.get_materia */
  get_profesor: (id: number) =>
    pedir<Profesor>(`/profesor_suplencias/get_profesor/${id}`, { metodo: 'GET' }),
  /** GET /profesor_suplencias/get_profesores — Listar profesores. Con `id_usuario` se obtiene el profesor del usuario que inició sesión. */
  get_profesores: (query?: GetProfesoresQuery) =>
    pedir<Profesor[]>(`/profesor_suplencias/get_profesores`, { metodo: 'GET', query }),
  /** GET /profesor_suplencias/get_disponibilidad_profesor/{id} — Disponibilidad horaria del profesor. Invoca: horarios.get_franja_horaria */
  get_disponibilidad_profesor: (id: number) =>
    pedir<FranjaHorariaResumen[]>(`/profesor_suplencias/get_disponibilidad_profesor/${id}`, { metodo: 'GET' }),
};
