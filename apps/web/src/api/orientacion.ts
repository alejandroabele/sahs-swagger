// Generado por tools/generar_cliente_web.mjs a partir del /docs-json del servicio. No editar a mano.
import type { Area, AsignarAnioAcademicoAMateriaBody, AsignarClaseAMateriaBody, AsignarCursoAOrientacionBody, AsignarMateriaAreaBody, AsignarMateriaOrientacionBody, CrearAreaBody, CrearMateriaBody, CrearOrientacionBody, Materia, Orientacion, ProfesorResumen } from '@sahs/contratos';
import { pedir } from './http';

/** Servicio Orientación Service. */
export const orientacion = {
  /** POST /orientacion/crear_materia — Crear materia */
  crear_materia: (body: CrearMateriaBody) =>
    pedir<Materia>(`/orientacion/crear_materia`, { metodo: 'POST', body }),
  /** DELETE /orientacion/eliminar_materia/{id} — Eliminar materia */
  eliminar_materia: (id: number) =>
    pedir<void>(`/orientacion/eliminar_materia/${id}`, { metodo: 'DELETE' }),
  /** PUT /orientacion/asignar_materia_orientacion/{id} — Asignar la orientación de la materia (reemplaza la anterior) */
  asignar_materia_orientacion: (id: number, body: AsignarMateriaOrientacionBody) =>
    pedir<Materia>(`/orientacion/asignar_materia_orientacion/${id}`, { metodo: 'PUT', body }),
  /** POST /orientacion/asignar_clase_a_materia/{id} — Asignar una clase a la materia. Invoca: planificacion.get_clase */
  asignar_clase_a_materia: (id: number, body: AsignarClaseAMateriaBody) =>
    pedir<Materia>(`/orientacion/asignar_clase_a_materia/${id}`, { metodo: 'POST', body }),
  /** PUT /orientacion/asignar_anio_academico_a_materia/{id} — Asignar el año académico de la materia. Invoca: planificacion.get_anio_academico */
  asignar_anio_academico_a_materia: (id: number, body: AsignarAnioAcademicoAMateriaBody) =>
    pedir<Materia>(`/orientacion/asignar_anio_academico_a_materia/${id}`, { metodo: 'PUT', body }),
  /** GET /orientacion/get_materia/{id} — Obtener materia (área y orientación anidadas) */
  get_materia: (id: number) =>
    pedir<Materia>(`/orientacion/get_materia/${id}`, { metodo: 'GET' }),
  /** GET /orientacion/get_materias — Listar materias */
  get_materias: () =>
    pedir<Materia[]>(`/orientacion/get_materias`, { metodo: 'GET' }),
  /** GET /orientacion/get_profesores_materia/{id} — Profesores habilitados para la materia. Invoca: profesor_suplencias.get_profesor */
  get_profesores_materia: (id: number) =>
    pedir<ProfesorResumen[]>(`/orientacion/get_profesores_materia/${id}`, { metodo: 'GET' }),
  /** POST /orientacion/crear_area — Crear área */
  crear_area: (body: CrearAreaBody) =>
    pedir<Area>(`/orientacion/crear_area`, { metodo: 'POST', body }),
  /** POST /orientacion/asignar_materia_area/{id} — Asignar una materia al área */
  asignar_materia_area: (id: number, body: AsignarMateriaAreaBody) =>
    pedir<Materia>(`/orientacion/asignar_materia_area/${id}`, { metodo: 'POST', body }),
  /** DELETE /orientacion/eliminar_area/{id} — Eliminar área */
  eliminar_area: (id: number) =>
    pedir<void>(`/orientacion/eliminar_area/${id}`, { metodo: 'DELETE' }),
  /** DELETE /orientacion/quitar_materia_area/{id}/{id_materia} — Quitar una materia del área */
  quitar_materia_area: (id: number, idMateria: number) =>
    pedir<Materia>(`/orientacion/quitar_materia_area/${id}/${idMateria}`, { metodo: 'DELETE' }),
  /** GET /orientacion/get_area/{id} — Obtener área (con su coordinador). Invoca: profesor_suplencias.get_profesor */
  get_area: (id: number) =>
    pedir<Area>(`/orientacion/get_area/${id}`, { metodo: 'GET' }),
  /** GET /orientacion/get_areas — Listar áreas */
  get_areas: () =>
    pedir<Area[]>(`/orientacion/get_areas`, { metodo: 'GET' }),
  /** GET /orientacion/get_materias_area/{id} — Materias del área */
  get_materias_area: (id: number) =>
    pedir<Materia[]>(`/orientacion/get_materias_area/${id}`, { metodo: 'GET' }),
  /** GET /orientacion/get_profesores_area/{id} — Profesores del área. Invoca: profesor_suplencias.get_profesor */
  get_profesores_area: (id: number) =>
    pedir<ProfesorResumen[]>(`/orientacion/get_profesores_area/${id}`, { metodo: 'GET' }),
  /** POST /orientacion/crear_orientacion — Crear orientación */
  crear_orientacion: (body: CrearOrientacionBody) =>
    pedir<Orientacion>(`/orientacion/crear_orientacion`, { metodo: 'POST', body }),
  /** DELETE /orientacion/eliminar_orientacion/{id} — Eliminar orientación */
  eliminar_orientacion: (id: number) =>
    pedir<void>(`/orientacion/eliminar_orientacion/${id}`, { metodo: 'DELETE' }),
  /** POST /orientacion/asignar_curso_a_orientacion/{id} — Asignar un curso a la orientación. Invoca: planificacion.get_curso */
  asignar_curso_a_orientacion: (id: number, body: AsignarCursoAOrientacionBody) =>
    pedir<Orientacion>(`/orientacion/asignar_curso_a_orientacion/${id}`, { metodo: 'POST', body }),
  /** GET /orientacion/get_orientacion/{id} — Obtener orientación */
  get_orientacion: (id: number) =>
    pedir<Orientacion>(`/orientacion/get_orientacion/${id}`, { metodo: 'GET' }),
  /** GET /orientacion/get_orientaciones — Listar orientaciones */
  get_orientaciones: () =>
    pedir<Orientacion[]>(`/orientacion/get_orientaciones`, { metodo: 'GET' }),
  /** GET /orientacion/get_materias_orientacion/{id} — Materias de la orientación */
  get_materias_orientacion: (id: number) =>
    pedir<Materia[]>(`/orientacion/get_materias_orientacion/${id}`, { metodo: 'GET' }),
};
