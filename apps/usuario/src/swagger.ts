// Datos del documento OpenAPI del servicio. Generado una vez por tools/generar_scaffold.mjs.
import type { InfoSwagger } from '@sahs/comun';

export const INFO_SWAGGER: InfoSwagger = {
  titulo: "Usuario Service",
  descripcion: "Provee una API para gestionar usuarios y roles. Cada usuario tiene un solo rol.\n\n**Modelos del dominio:** Usuario, Rol, Privilegio.\n\nConvenciones: rutas REST sobre recursos en plural y en kebab-case; el `operationId` es el nombre de la función del documento. `GET` lee, `POST` crea o agrega, `PUT` reemplaza, `PATCH` cambia una parte y `DELETE` borra o quita. El id de la entidad principal va en la ruta y el resto de los datos en el body. Los datos relacionados de un solo elemento vienen anidados en la entidad.",
  version: "1.0.0",
  tags: [{"name":"Acceso","description":"Ingreso al sistema"},{"name":"Usuario","description":"Cuentas de usuario"},{"name":"Rol","description":"Roles"},{"name":"Privilegio","description":"Privilegios de los roles"}],
  dependencias: [],
};
