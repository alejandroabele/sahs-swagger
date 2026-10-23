// Datos del documento OpenAPI del servicio. Generado una vez por tools/generar_scaffold.mjs.
import type { InfoSwagger } from '@sahs/comun';

export const INFO_SWAGGER: InfoSwagger = {
  titulo: "Profesor y Suplencias Service",
  descripcion: "Provee una API para gestionar los profesores y las suplencias.\n\n**Modelos del dominio:** Suplencia, Profesor.\n\nConvenciones: una ruta por función; `POST` para commands y `GET` para queries; el id de la entidad principal va en la ruta y el resto de los datos en el body. Los datos relacionados de un solo elemento vienen anidados en la entidad.",
  version: "1.0.0",
  tags: [{"name":"Profesor","description":"Profesores, su usuario, materias habilitadas y disponibilidad"},{"name":"Suplencia","description":"Suplencias: quién cubre qué clases"}],
  dependencias: [{"servicio": "usuario", "endpoint": "get_usuario", "usado_por": ["asignar_usuario_profesor"]}, {"servicio": "orientacion", "endpoint": "get_materia", "usado_por": ["asignar_materias_habilitadas"]}, {"servicio": "orientacion", "endpoint": "get_materias", "usado_por": ["get_profesor", "get_profesores", "get_disponibilidad_profesor"]}, {"servicio": "planificacion", "endpoint": "get_clase", "usado_por": ["crear_suplencia"]}, {"servicio": "planificacion", "endpoint": "get_clases", "usado_por": ["crear_suplencia", "get_suplencias"]}, {"servicio": "horarios", "endpoint": "get_franja_horaria", "usado_por": ["asignar_disponibilidad"]}, {"servicio": "horarios", "endpoint": "get_franjas_horarias", "usado_por": ["get_profesor", "get_profesores", "get_disponibilidad_profesor"]}],
};
