// Datos del documento OpenAPI del servicio. Generado una vez por tools/generar_scaffold.mjs.
import type { InfoSwagger } from '@sahs/comun';

export const INFO_SWAGGER: InfoSwagger = {
  titulo: "Horarios Service",
  descripcion: "Provee una API que define estructuralmente los bloques de franja horaria y turnos.\n\n**Modelos del dominio:** Día_lectivo, Franja_horaria, Turno.\n\nConvenciones: una ruta por función; `POST` para commands y `GET` para queries; el id de la entidad principal va en la ruta y el resto de los datos en el body. Los datos relacionados de un solo elemento vienen anidados en la entidad.",
  version: "1.0.0",
  tags: [{"name":"Día lectivo","description":"Días de la semana con clase"},{"name":"Franja horaria","description":"Bloques horarios (incluye recreos)"},{"name":"Turno","description":"Turnos y sus franjas"}],
  dependencias: [],
};
