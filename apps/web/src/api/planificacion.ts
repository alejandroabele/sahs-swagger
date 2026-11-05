// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { AnioAcademico, ArmadoPlanificacion, AsignarClaseAPlanificacionBody, AsignarCursoAAnioAcademicoBody, AsignarCursoAClaseBody, AsignarEstadoAPlanificacionBody, AsignarMateriaACursoBody, CambiarHorasMateriaCursoBody, CicloLectivo, Clase, CrearAnioAcademicoBody, CrearCicloLectivoBody, CrearClaseBody, CrearCursoBody, CrearEstadoPlanificacionBody, CrearPlanificacionBody, Curso, EditarClaseBody, EstadoPlanificacion, GenerarPlanillaBody, GetClasesQuery, GetCursosQuery, GetPlanificacionesQuery, Planificacion, ResultadoGeneracion } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Planificación Service. */
export const planificacion = {
  /** POST /planificaciones/estados — Crear estado de planificación */
  crear_estado_planificacion: (body: CrearEstadoPlanificacionBody) =>
    pedir<EstadoPlanificacion>(`/planificaciones/estados`, { metodo: 'POST', body }),
  /** GET /planificaciones/estados — Listar estados posibles */
  get_posibles_estados_de_planificaciones: () =>
    pedir<EstadoPlanificacion[]>(`/planificaciones/estados`, { metodo: 'GET' }),
  /** POST /planificaciones — Crear planificación (queda en estado Borrador). La planificación nace en Borrador (BOR) y se valida completa, no curso por curso. */
  crear_planificacion: (body: CrearPlanificacionBody) =>
    pedir<Planificacion>(`/planificaciones`, { metodo: 'POST', body }),
  /** GET /planificaciones — Listar planificaciones */
  get_planificaciones: (query?: GetPlanificacionesQuery) =>
    pedir<Planificacion[]>(`/planificaciones`, { metodo: 'GET', query }),
  /** PUT /planificaciones/{id}/estado — Asignar estado a la planificación. Transiciones: Borrador → En revisión; En revisión → Vigente o Borrador. Una planificación Vigente no cambia de estado por pedido: pasa sola a Fue vigente cuando otra de su ciclo lectivo pasa a Vigente, así hay una sola Vigente por ciclo. */
  asignar_estado_a_planificacion: (id: number, body: AsignarEstadoAPlanificacionBody) =>
    pedir<Planificacion>(`/planificaciones/${id}/estado`, { metodo: 'PUT', body }),
  /** GET /planificaciones/{id}/estado — Estado actual de la planificación */
  get_estado_actual_de_planificacion: (id: number) =>
    pedir<EstadoPlanificacion>(`/planificaciones/${id}/estado`, { metodo: 'GET' }),
  /** POST /planificaciones/{id}/clases — Agregar una clase a la planificación. Solo en Borrador. Responde `409` si el curso ya tiene otra clase en alguna de sus franjas, si un docente ya tiene otra clase a la vez, o si con la clase la materia supera sus horas semanales en el curso. */
  asignar_clase_a_planificacion: (id: number, body: AsignarClaseAPlanificacionBody) =>
    pedir<Planificacion>(`/planificaciones/${id}/clases`, { metodo: 'POST', body }),
  /** POST /planificaciones/{id}/generacion — Generar la planilla automáticamente. Completa las horas que faltan en los cursos del ciclo de la planificación (o solo en `id_curso`) y guarda el resultado. Respeta lo ya ubicado, la disponibilidad declarada por cada docente, que un docente no esté en dos clases a la vez (por horario real, aunque sean turnos distintos) y que ninguna materia supere sus horas semanales en el curso. Si la clase ya tiene docentes usa esos; si no, el habilitado activo con más margen (las materias EPA van con todos sus habilitados juntos). Cada cambio se guarda como crear_clase + asignar_clase_a_planificacion o editar_clase; si una regla lo rechaza, sigue con el resto y lo informa en `errores`. `cambios` trae lo que tenía cada clase antes, para deshacer. Solo en Borrador. (Agregado: no está en el documento.) */
  generar_planilla: (id: number, body: GenerarPlanillaBody) =>
    pedir<ResultadoGeneracion>(`/planificaciones/${id}/generacion`, { metodo: 'POST', body }),
  /** GET /planificaciones/{id}/armado — Fachada: datos para abrir el armado de la planificación (pantalla A13). **Fachada** (agregado: no está en el documento). Junta en una sola respuesta lo que la pantalla de armado pedía en cuatro llamadas, y no guarda nada. */
  get_armado_planificacion: (id: number) =>
    pedir<ArmadoPlanificacion>(`/planificaciones/${id}/armado`, { metodo: 'GET' }),
  /** GET /planificaciones/{id} — Obtener planificación */
  get_planificacion: (id: number) =>
    pedir<Planificacion>(`/planificaciones/${id}`, { metodo: 'GET' }),
  /** POST /planificacion/ciclos-lectivos — Crear ciclo lectivo */
  crear_ciclo_lectivo: (body: CrearCicloLectivoBody) =>
    pedir<CicloLectivo>(`/planificacion/ciclos-lectivos`, { metodo: 'POST', body }),
  /** GET /planificacion/ciclos-lectivos — Listar ciclos lectivos */
  get_ciclos_lectivos: () =>
    pedir<CicloLectivo[]>(`/planificacion/ciclos-lectivos`, { metodo: 'GET' }),
  /** GET /planificacion/ciclos-lectivos/{id} — Obtener ciclo lectivo */
  get_ciclo_lectivo: (id: number) =>
    pedir<CicloLectivo>(`/planificacion/ciclos-lectivos/${id}`, { metodo: 'GET' }),
  /** POST /planificacion/cursos — Crear curso. El año académico se asigna con asignar_curso_a_anio_academico. La orientación se cambia después desde el servicio Orientación (asignar_curso_a_orientacion). */
  crear_curso: (body: CrearCursoBody) =>
    pedir<Curso>(`/planificacion/cursos`, { metodo: 'POST', body }),
  /** GET /planificacion/cursos — Listar cursos */
  get_cursos: (query?: GetCursosQuery) =>
    pedir<Curso[]>(`/planificacion/cursos`, { metodo: 'GET', query }),
  /** POST /planificacion/cursos/{id}/materias — Agregar una materia al plan del curso. Si no se indican las horas, se toman las de la materia. */
  asignar_materia_a_curso: (id: number, body: AsignarMateriaACursoBody) =>
    pedir<Curso>(`/planificacion/cursos/${id}/materias`, { metodo: 'POST', body }),
  /** PATCH /planificacion/cursos/{id}/materias/{id_materia} — Cambiar las horas de una materia en el curso. Solo cambia las horas en este curso; la materia no se modifica. */
  cambiar_horas_materia_curso: (id: number, idMateria: number, body: CambiarHorasMateriaCursoBody) =>
    pedir<Curso>(`/planificacion/cursos/${id}/materias/${idMateria}`, { metodo: 'PATCH', body }),
  /** DELETE /planificacion/cursos/{id}/materias/{id_materia} — Quitar una materia del plan del curso */
  quitar_materia_curso: (id: number, idMateria: number) =>
    pedir<Curso>(`/planificacion/cursos/${id}/materias/${idMateria}`, { metodo: 'DELETE' }),
  /** GET /planificacion/cursos/{id}/clases — Clases del curso. Invoca: orientacion.get_materia */
  get_curso_clases: (id: number) =>
    pedir<Clase[]>(`/planificacion/cursos/${id}/clases`, { metodo: 'GET' }),
  /** GET /planificacion/cursos/{id} — Obtener curso (turno, orientación, materias y franjas anidados). Invoca: orientacion.get_materia, orientacion.get_orientacion, horarios.get_franja_horaria, horarios.get_turno */
  get_curso: (id: number) =>
    pedir<Curso>(`/planificacion/cursos/${id}`, { metodo: 'GET' }),
  /** POST /planificacion/clases — Crear clase. Verifica que los profesores estén disponibles en las franjas indicadas. */
  crear_clase: (body: CrearClaseBody) =>
    pedir<Clase>(`/planificacion/clases`, { metodo: 'POST', body }),
  /** GET /planificacion/clases — Listar clases. Con `id_profesor` e `id_planificacion` se arma la grilla de un profesor. */
  get_clases: (query?: GetClasesQuery) =>
    pedir<Clase[]>(`/planificacion/clases`, { metodo: 'GET', query }),
  /** PUT /planificacion/clases/{id}/curso — Asignar curso a la clase */
  asignar_curso_a_clase: (id: number, body: AsignarCursoAClaseBody) =>
    pedir<Clase>(`/planificacion/clases/${id}/curso`, { metodo: 'PUT', body }),
  /** GET /planificacion/clases/{id} — Obtener clase (materia, franjas, profesores y suplencia anidados). La suplencia vigente se obtiene con `get_suplencias?id_clase=<id>` y la fecha del día: la referencia entre suplencia y clase la guarda la suplencia. */
  get_clase: (id: number) =>
    pedir<Clase>(`/planificacion/clases/${id}`, { metodo: 'GET' }),
  /** PUT /planificacion/clases/{id} — Editar las franjas y los docentes de la clase. Agregado (no está en el documento). Reemplaza las franjas y los docentes. Solo si todas las planificaciones que incluyen la clase están en Borrador; controla disponibilidad, recreos y choques. */
  editar_clase: (id: number, body: EditarClaseBody) =>
    pedir<Clase>(`/planificacion/clases/${id}`, { metodo: 'PUT', body }),
  /** DELETE /planificacion/clases/{id} — Eliminar clase. Agregado (no está en el documento). Solo si todas las planificaciones que incluyen la clase están en Borrador. */
  eliminar_clase: (id: number) =>
    pedir<void>(`/planificacion/clases/${id}`, { metodo: 'DELETE' }),
  /** POST /planificacion/anios-academicos — Crear año académico */
  crear_anio_academico: (body: CrearAnioAcademicoBody) =>
    pedir<AnioAcademico>(`/planificacion/anios-academicos`, { metodo: 'POST', body }),
  /** GET /planificacion/anios-academicos — Listar años académicos */
  get_anios_academicos: () =>
    pedir<AnioAcademico[]>(`/planificacion/anios-academicos`, { metodo: 'GET' }),
  /** POST /planificacion/anios-academicos/{id}/cursos — Asignar un curso al año académico */
  asignar_curso_a_anio_academico: (id: number, body: AsignarCursoAAnioAcademicoBody) =>
    pedir<Curso>(`/planificacion/anios-academicos/${id}/cursos`, { metodo: 'POST', body }),
  /** GET /planificacion/anios-academicos/{id}/cursos — Cursos del año académico */
  get_cursos_anio_academico: (id: number) =>
    pedir<Curso[]>(`/planificacion/anios-academicos/${id}/cursos`, { metodo: 'GET' }),
  /** GET /planificacion/anios-academicos/{id} — Obtener año académico */
  get_anio_academico: (id: number) =>
    pedir<AnioAcademico>(`/planificacion/anios-academicos/${id}`, { metodo: 'GET' }),
};
