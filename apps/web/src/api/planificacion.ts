// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { AnioAcademico, AsignarClaseAPropuestaBody, AsignarCursoAAnioAcademicoBody, AsignarCursoAClaseBody, AsignarEstadoAPropuestaBody, AsignarMateriaACursoBody, CambiarHorasMateriaCursoBody, CicloLectivo, Clase, CrearAnioAcademicoBody, CrearCicloLectivoBody, CrearClaseBody, CrearCursoBody, CrearEstadoPropuestaBody, CrearPropuestaBody, Curso, EditarClaseBody, EstadoPropuesta, GetClasesQuery, GetCursosQuery, GetPropuestasQuery, Propuesta } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Planificación Service. */
export const planificacion = {
  /** POST /planificacion/crear_propuesta — Crear propuesta (queda en estado Borrador). La propuesta nace en Borrador (BOR) y se valida completa, no curso por curso. */
  crear_propuesta: (body: CrearPropuestaBody) =>
    pedir<Propuesta>(`/planificacion/crear_propuesta`, { metodo: 'POST', body }),
  /** PUT /planificacion/asignar_estado_a_propuesta/{id} — Asignar estado a la propuesta */
  asignar_estado_a_propuesta: (id: number, body: AsignarEstadoAPropuestaBody) =>
    pedir<Propuesta>(`/planificacion/asignar_estado_a_propuesta/${id}`, { metodo: 'PUT', body }),
  /** POST /planificacion/asignar_clase_a_propuesta/{id} — Agregar una clase a la propuesta */
  asignar_clase_a_propuesta: (id: number, body: AsignarClaseAPropuestaBody) =>
    pedir<Propuesta>(`/planificacion/asignar_clase_a_propuesta/${id}`, { metodo: 'POST', body }),
  /** GET /planificacion/get_estado_actual_de_propuesta/{id} — Estado actual de la propuesta */
  get_estado_actual_de_propuesta: (id: number) =>
    pedir<EstadoPropuesta>(`/planificacion/get_estado_actual_de_propuesta/${id}`, { metodo: 'GET' }),
  /** GET /planificacion/get_propuestas — Listar propuestas */
  get_propuestas: (query?: GetPropuestasQuery) =>
    pedir<Propuesta[]>(`/planificacion/get_propuestas`, { metodo: 'GET', query }),
  /** GET /planificacion/get_propuesta/{id} — Obtener propuesta */
  get_propuesta: (id: number) =>
    pedir<Propuesta>(`/planificacion/get_propuesta/${id}`, { metodo: 'GET' }),
  /** POST /planificacion/crear_estado_propuesta — Crear estado de propuesta */
  crear_estado_propuesta: (body: CrearEstadoPropuestaBody) =>
    pedir<EstadoPropuesta>(`/planificacion/crear_estado_propuesta`, { metodo: 'POST', body }),
  /** GET /planificacion/get_posibles_estados_de_propuestas — Listar estados posibles */
  get_posibles_estados_de_propuestas: () =>
    pedir<EstadoPropuesta[]>(`/planificacion/get_posibles_estados_de_propuestas`, { metodo: 'GET' }),
  /** POST /planificacion/crear_ciclo_lectivo — Crear ciclo lectivo */
  crear_ciclo_lectivo: (body: CrearCicloLectivoBody) =>
    pedir<CicloLectivo>(`/planificacion/crear_ciclo_lectivo`, { metodo: 'POST', body }),
  /** GET /planificacion/get_ciclo_lectivo/{id} — Obtener ciclo lectivo */
  get_ciclo_lectivo: (id: number) =>
    pedir<CicloLectivo>(`/planificacion/get_ciclo_lectivo/${id}`, { metodo: 'GET' }),
  /** GET /planificacion/get_ciclos_lectivos — Listar ciclos lectivos */
  get_ciclos_lectivos: () =>
    pedir<CicloLectivo[]>(`/planificacion/get_ciclos_lectivos`, { metodo: 'GET' }),
  /** POST /planificacion/crear_curso — Crear curso. El año académico se asigna con asignar_curso_a_anio_academico. La orientación se cambia después desde el servicio Orientación (asignar_curso_a_orientacion). */
  crear_curso: (body: CrearCursoBody) =>
    pedir<Curso>(`/planificacion/crear_curso`, { metodo: 'POST', body }),
  /** POST /planificacion/asignar_materia_a_curso/{id} — Agregar una materia al plan del curso. Si no se indican las horas, se toman las de la materia. */
  asignar_materia_a_curso: (id: number, body: AsignarMateriaACursoBody) =>
    pedir<Curso>(`/planificacion/asignar_materia_a_curso/${id}`, { metodo: 'POST', body }),
  /** PATCH /planificacion/cambiar_horas_materia_curso/{id} — Cambiar las horas de una materia en el curso. Solo cambia las horas en este curso; la materia no se modifica. */
  cambiar_horas_materia_curso: (id: number, body: CambiarHorasMateriaCursoBody) =>
    pedir<Curso>(`/planificacion/cambiar_horas_materia_curso/${id}`, { metodo: 'PATCH', body }),
  /** DELETE /planificacion/quitar_materia_curso/{id}/{id_materia} — Quitar una materia del plan del curso */
  quitar_materia_curso: (id: number, idMateria: number) =>
    pedir<Curso>(`/planificacion/quitar_materia_curso/${id}/${idMateria}`, { metodo: 'DELETE' }),
  /** GET /planificacion/get_curso_clases/{id} — Clases del curso. Invoca: orientacion.get_materia */
  get_curso_clases: (id: number) =>
    pedir<Clase[]>(`/planificacion/get_curso_clases/${id}`, { metodo: 'GET' }),
  /** GET /planificacion/get_curso/{id} — Obtener curso (turno, orientación, materias y franjas anidados). Invoca: orientacion.get_materia, orientacion.get_orientacion, horarios.get_franja_horaria, horarios.get_turno */
  get_curso: (id: number) =>
    pedir<Curso>(`/planificacion/get_curso/${id}`, { metodo: 'GET' }),
  /** GET /planificacion/get_cursos — Listar cursos */
  get_cursos: (query?: GetCursosQuery) =>
    pedir<Curso[]>(`/planificacion/get_cursos`, { metodo: 'GET', query }),
  /** POST /planificacion/crear_clase — Crear clase. Verifica que los profesores estén disponibles en las franjas indicadas. */
  crear_clase: (body: CrearClaseBody) =>
    pedir<Clase>(`/planificacion/crear_clase`, { metodo: 'POST', body }),
  /** PUT /planificacion/asignar_curso_a_clase/{id} — Asignar curso a la clase */
  asignar_curso_a_clase: (id: number, body: AsignarCursoAClaseBody) =>
    pedir<Clase>(`/planificacion/asignar_curso_a_clase/${id}`, { metodo: 'PUT', body }),
  /** GET /planificacion/get_clase/{id} — Obtener clase (materia, franjas, profesores y suplencia anidados). La suplencia vigente se obtiene con `get_suplencias?id_clase=<id>` y la fecha del día: la referencia entre suplencia y clase la guarda la suplencia. */
  get_clase: (id: number) =>
    pedir<Clase>(`/planificacion/get_clase/${id}`, { metodo: 'GET' }),
  /** GET /planificacion/get_clases — Listar clases. Con `id_profesor` e `id_propuesta` se arma la grilla de un profesor. */
  get_clases: (query?: GetClasesQuery) =>
    pedir<Clase[]>(`/planificacion/get_clases`, { metodo: 'GET', query }),
  /** PUT /planificacion/editar_clase/{id} — Editar las franjas y los docentes de la clase. Agregado (no está en el documento). Reemplaza las franjas y los docentes. Solo si todas las propuestas que incluyen la clase están en Borrador; controla disponibilidad, recreos y choques. */
  editar_clase: (id: number, body: EditarClaseBody) =>
    pedir<Clase>(`/planificacion/editar_clase/${id}`, { metodo: 'PUT', body }),
  /** DELETE /planificacion/eliminar_clase/{id} — Eliminar clase. Agregado (no está en el documento). Solo si todas las propuestas que incluyen la clase están en Borrador. */
  eliminar_clase: (id: number) =>
    pedir<void>(`/planificacion/eliminar_clase/${id}`, { metodo: 'DELETE' }),
  /** POST /planificacion/crear_anio_academico — Crear año académico */
  crear_anio_academico: (body: CrearAnioAcademicoBody) =>
    pedir<AnioAcademico>(`/planificacion/crear_anio_academico`, { metodo: 'POST', body }),
  /** POST /planificacion/asignar_curso_a_anio_academico/{id} — Asignar un curso al año académico */
  asignar_curso_a_anio_academico: (id: number, body: AsignarCursoAAnioAcademicoBody) =>
    pedir<Curso>(`/planificacion/asignar_curso_a_anio_academico/${id}`, { metodo: 'POST', body }),
  /** GET /planificacion/get_anio_academico/{id} — Obtener año académico */
  get_anio_academico: (id: number) =>
    pedir<AnioAcademico>(`/planificacion/get_anio_academico/${id}`, { metodo: 'GET' }),
  /** GET /planificacion/get_anios_academicos — Listar años académicos */
  get_anios_academicos: () =>
    pedir<AnioAcademico[]>(`/planificacion/get_anios_academicos`, { metodo: 'GET' }),
  /** GET /planificacion/get_cursos_anio_academico/{id} — Cursos del año académico */
  get_cursos_anio_academico: (id: number) =>
    pedir<Curso[]>(`/planificacion/get_cursos_anio_academico/${id}`, { metodo: 'GET' }),
};
