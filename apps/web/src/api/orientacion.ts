// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { Area, AsignarAnioAcademicoAMateriaBody, AsignarClaseAMateriaBody, AsignarCursoAOrientacionBody, AsignarMateriaAreaBody, AsignarMateriaOrientacionBody, CrearAreaBody, CrearMateriaBody, CrearOrientacionBody, GetPlanDeEstudiosQuery, Materia, Orientacion, PlanDeEstudiosAnio, ProfesorResumen } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Orientación Service. */
export const orientacion = {
  /** GET /orientacion/plan-de-estudios — Plan de estudios: año académico → orientación → materias. El plan armado en tres niveles, para no cruzar en el cliente las materias con los años. Solo trae los años y orientaciones que tienen materias; con `id_orientacion`, esa orientación aparece en todos los años, aunque no tenga materias. */
  get_plan_de_estudios: (query?: GetPlanDeEstudiosQuery) =>
    pedir<PlanDeEstudiosAnio[]>(`/orientacion/plan-de-estudios`, { metodo: 'GET', query }),
  /** POST /orientacion/materias — Crear materia */
  crear_materia: (body: CrearMateriaBody) =>
    pedir<Materia>(`/orientacion/materias`, { metodo: 'POST', body }),
  /** GET /orientacion/materias — Listar materias */
  get_materias: () =>
    pedir<Materia[]>(`/orientacion/materias`, { metodo: 'GET' }),
  /** DELETE /orientacion/materias/{id} — Eliminar materia */
  eliminar_materia: (id: number) =>
    pedir<void>(`/orientacion/materias/${id}`, { metodo: 'DELETE' }),
  /** GET /orientacion/materias/{id} — Obtener materia (área y orientación anidadas) */
  get_materia: (id: number) =>
    pedir<Materia>(`/orientacion/materias/${id}`, { metodo: 'GET' }),
  /** PUT /orientacion/materias/{id}/orientacion — Asignar la orientación de la materia (reemplaza la anterior) */
  asignar_materia_orientacion: (id: number, body: AsignarMateriaOrientacionBody) =>
    pedir<Materia>(`/orientacion/materias/${id}/orientacion`, { metodo: 'PUT', body }),
  /** POST /orientacion/materias/{id}/clases — Asignar una clase a la materia. Invoca: planificacion.get_clase */
  asignar_clase_a_materia: (id: number, body: AsignarClaseAMateriaBody) =>
    pedir<Materia>(`/orientacion/materias/${id}/clases`, { metodo: 'POST', body }),
  /** PUT /orientacion/materias/{id}/anio-academico — Asignar el año académico de la materia. Invoca: planificacion.get_anio_academico */
  asignar_anio_academico_a_materia: (id: number, body: AsignarAnioAcademicoAMateriaBody) =>
    pedir<Materia>(`/orientacion/materias/${id}/anio-academico`, { metodo: 'PUT', body }),
  /** GET /orientacion/materias/{id}/profesores — Profesores habilitados para la materia. Invoca: profesor_suplencias.get_profesor */
  get_profesores_materia: (id: number) =>
    pedir<ProfesorResumen[]>(`/orientacion/materias/${id}/profesores`, { metodo: 'GET' }),
  /** POST /orientacion/areas — Crear área */
  crear_area: (body: CrearAreaBody) =>
    pedir<Area>(`/orientacion/areas`, { metodo: 'POST', body }),
  /** GET /orientacion/areas — Listar áreas */
  get_areas: () =>
    pedir<Area[]>(`/orientacion/areas`, { metodo: 'GET' }),
  /** POST /orientacion/areas/{id}/materias — Asignar una materia al área */
  asignar_materia_area: (id: number, body: AsignarMateriaAreaBody) =>
    pedir<Materia>(`/orientacion/areas/${id}/materias`, { metodo: 'POST', body }),
  /** GET /orientacion/areas/{id}/materias — Materias del área */
  get_materias_area: (id: number) =>
    pedir<Materia[]>(`/orientacion/areas/${id}/materias`, { metodo: 'GET' }),
  /** DELETE /orientacion/areas/{id} — Eliminar área */
  eliminar_area: (id: number) =>
    pedir<void>(`/orientacion/areas/${id}`, { metodo: 'DELETE' }),
  /** GET /orientacion/areas/{id} — Obtener área (con su coordinador). Invoca: profesor_suplencias.get_profesor */
  get_area: (id: number) =>
    pedir<Area>(`/orientacion/areas/${id}`, { metodo: 'GET' }),
  /** DELETE /orientacion/areas/{id}/materias/{id_materia} — Quitar una materia del área */
  quitar_materia_area: (id: number, idMateria: number) =>
    pedir<Materia>(`/orientacion/areas/${id}/materias/${idMateria}`, { metodo: 'DELETE' }),
  /** GET /orientacion/areas/{id}/profesores — Profesores del área. Invoca: profesor_suplencias.get_profesor */
  get_profesores_area: (id: number) =>
    pedir<ProfesorResumen[]>(`/orientacion/areas/${id}/profesores`, { metodo: 'GET' }),
  /** POST /orientacion/orientaciones — Crear orientación */
  crear_orientacion: (body: CrearOrientacionBody) =>
    pedir<Orientacion>(`/orientacion/orientaciones`, { metodo: 'POST', body }),
  /** GET /orientacion/orientaciones — Listar orientaciones */
  get_orientaciones: () =>
    pedir<Orientacion[]>(`/orientacion/orientaciones`, { metodo: 'GET' }),
  /** DELETE /orientacion/orientaciones/{id} — Eliminar orientación */
  eliminar_orientacion: (id: number) =>
    pedir<void>(`/orientacion/orientaciones/${id}`, { metodo: 'DELETE' }),
  /** GET /orientacion/orientaciones/{id} — Obtener orientación */
  get_orientacion: (id: number) =>
    pedir<Orientacion>(`/orientacion/orientaciones/${id}`, { metodo: 'GET' }),
  /** POST /orientacion/orientaciones/{id}/cursos — Asignar un curso a la orientación. Invoca: planificacion.get_curso */
  asignar_curso_a_orientacion: (id: number, body: AsignarCursoAOrientacionBody) =>
    pedir<Orientacion>(`/orientacion/orientaciones/${id}/cursos`, { metodo: 'POST', body }),
  /** GET /orientacion/orientaciones/{id}/materias — Materias de la orientación */
  get_materias_orientacion: (id: number) =>
    pedir<Materia[]>(`/orientacion/orientaciones/${id}/materias`, { metodo: 'GET' }),
};
