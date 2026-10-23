// Datos del documento OpenAPI del servicio. Generado una vez por tools/generar_scaffold.mjs.
import type { InfoSwagger } from '@sahs/comun';

export const INFO_SWAGGER: InfoSwagger = {
  titulo: "Orientación Service",
  descripcion: "Provee una API para gestionar las orientaciones, y las áreas y materias que las componen.\n\n**Modelos del dominio:** Orientación, Área, Materia.\n\nConvenciones: una ruta por función; `POST` para commands y `GET` para queries; el id de la entidad principal va en la ruta y el resto de los datos en el body. Los datos relacionados de un solo elemento vienen anidados en la entidad.",
  version: "1.0.0",
  tags: [{"name":"Orientación","description":"Orientaciones (planes de estudio)"},{"name":"Área","description":"Áreas que agrupan materias"},{"name":"Materia","description":"Materias"}],
  dependencias: [{"servicio": "profesor_suplencias", "endpoint": "get_profesor", "usado_por": ["crear_area", "get_area", "get_areas", "get_materia", "get_materias"]}, {"servicio": "profesor_suplencias", "endpoint": "get_profesores", "usado_por": ["get_profesores_materia", "get_profesores_area"]}, {"servicio": "planificacion", "endpoint": "get_clase", "usado_por": ["asignar_clase_a_materia", "eliminar_materia"]}, {"servicio": "planificacion", "endpoint": "get_curso", "usado_por": ["asignar_curso_a_orientacion"]}, {"servicio": "planificacion", "endpoint": "get_anio_academico", "usado_por": ["crear_materia", "asignar_anio_academico_a_materia"]}],
};
