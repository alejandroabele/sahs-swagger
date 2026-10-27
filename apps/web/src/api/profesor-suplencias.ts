// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { AsignarDisponibilidadBody, AsignarMateriasHabilitadasBody, AsignarUsuarioProfesorBody, CrearProfesorBody, CrearSuplenciaBody, EditarProfesorBody, FranjaHorariaResumen, GetProfesoresQuery, GetSuplenciasQuery, Profesor, Suplencia } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Profesor y Suplencias Service. */
export const profesorSuplencias = {
  /** POST /profesor-suplencias/profesores/{id}/suplencias — Crear suplencia del profesor (las clases que cubre). La suplencia es del profesor que la cubre (el suplente, `{id}`) y se crea completa, con las clases que cubre en el período. */
  crear_suplencia: (id: number, body: CrearSuplenciaBody) =>
    pedir<Suplencia>(`/profesor-suplencias/profesores/${id}/suplencias`, { metodo: 'POST', body }),
  /** GET /profesor-suplencias/suplencias — Listar suplencias. Con `fecha_desde` y `fecha_hasta` devuelve las suplencias cuyo período se superpone con el rango. */
  get_suplencias: (query?: GetSuplenciasQuery) =>
    pedir<Suplencia[]>(`/profesor-suplencias/suplencias`, { metodo: 'GET', query }),
  /** POST /profesor-suplencias/profesores — Crear profesor. No crea el usuario: se asigna después con `asignar_usuario_profesor`. */
  crear_profesor: (body: CrearProfesorBody) =>
    pedir<Profesor>(`/profesor-suplencias/profesores`, { metodo: 'POST', body }),
  /** GET /profesor-suplencias/profesores — Listar profesores. Con `id_usuario` se obtiene el profesor del usuario que inició sesión. */
  get_profesores: (query?: GetProfesoresQuery) =>
    pedir<Profesor[]>(`/profesor-suplencias/profesores`, { metodo: 'GET', query }),
  /** PUT /profesor-suplencias/profesores/{id} — Editar los datos del profesor. Reemplaza todos los datos editables del profesor. `null` en `legajo` o `cargo_asociado` lo deja sin legajo o sin cargo. */
  editar_profesor: (id: number, body: EditarProfesorBody) =>
    pedir<Profesor>(`/profesor-suplencias/profesores/${id}`, { metodo: 'PUT', body }),
  /** GET /profesor-suplencias/profesores/{id} — Obtener profesor. Invoca: orientacion.get_materia */
  get_profesor: (id: number) =>
    pedir<Profesor>(`/profesor-suplencias/profesores/${id}`, { metodo: 'GET' }),
  /** PUT /profesor-suplencias/profesores/{id}/usuario — Asignar el usuario del profesor (reemplaza el anterior). Invoca: usuario.get_usuario */
  asignar_usuario_profesor: (id: number, body: AsignarUsuarioProfesorBody) =>
    pedir<Profesor>(`/profesor-suplencias/profesores/${id}/usuario`, { metodo: 'PUT', body }),
  /** PUT /profesor-suplencias/profesores/{id}/materias-habilitadas — Asignar materias que puede dictar. Invoca: orientacion.get_materia */
  asignar_materias_habilitadas: (id: number, body: AsignarMateriasHabilitadasBody) =>
    pedir<Profesor>(`/profesor-suplencias/profesores/${id}/materias-habilitadas`, { metodo: 'PUT', body }),
  /** PUT /profesor-suplencias/profesores/{id}/disponibilidad — Asignar disponibilidad horaria. Reemplaza la disponibilidad del profesor por las franjas indicadas. */
  asignar_disponibilidad: (id: number, body: AsignarDisponibilidadBody) =>
    pedir<Profesor>(`/profesor-suplencias/profesores/${id}/disponibilidad`, { metodo: 'PUT', body }),
  /** GET /profesor-suplencias/profesores/{id}/disponibilidad — Disponibilidad horaria del profesor. Invoca: horarios.get_franja_horaria */
  get_disponibilidad_profesor: (id: number) =>
    pedir<FranjaHorariaResumen[]>(`/profesor-suplencias/profesores/${id}/disponibilidad`, { metodo: 'GET' }),
};
