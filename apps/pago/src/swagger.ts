// Datos del documento OpenAPI del servicio. Generado una vez por tools/generar_scaffold.mjs.
import type { InfoSwagger } from '@sahs/comun';

export const INFO_SWAGGER: InfoSwagger = {
  titulo: "Pago Service",
  descripcion: "Provee una API para gestionar los recibos de sueldo y cálculos de pagos a liquidar.\n\n**Modelos del dominio:** Pago, Recibo de Sueldo.\n\nConvenciones: rutas REST sobre recursos en plural y en kebab-case; el `operationId` es el nombre de la función del documento. `GET` lee, `POST` crea o agrega, `PUT` reemplaza, `PATCH` cambia una parte y `DELETE` borra o quita. El id de la entidad principal va en la ruta y el resto de los datos en el body. Los datos relacionados de un solo elemento vienen anidados en la entidad.",
  version: "1.0.0",
  tags: [{"name":"Pago","description":"Pagos a liquidar por profesor y período"},{"name":"Recibo de sueldo","description":"Recibos de sueldo, firma y descarga"}],
  dependencias: [{"servicio": "profesor_suplencias", "endpoint": "get_profesor", "usado_por": ["crear_pago", "calcular_monto_a_liquidar", "firmar_recibo_de_sueldo", "bajar_recibo_sueldo"]}, {"servicio": "planificacion", "endpoint": "get_ciclos_lectivos", "usado_por": ["crear_pago", "calcular_monto_a_liquidar"]}, {"servicio": "planificacion", "endpoint": "get_propuestas", "usado_por": ["crear_pago", "calcular_monto_a_liquidar"]}, {"servicio": "planificacion", "endpoint": "get_clases", "usado_por": ["crear_pago", "calcular_monto_a_liquidar"]}, {"servicio": "planificacion", "endpoint": "get_cursos", "usado_por": ["crear_pago", "calcular_monto_a_liquidar"]}, {"servicio": "planificacion", "endpoint": "get_anios_academicos", "usado_por": ["crear_pago", "calcular_monto_a_liquidar"]}],
};
