// Rutas de Propuesta. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { EstadoPropuesta, Propuesta, ResultadoGeneracion } from '../dto/modelos';
import { AsignarClaseAPropuestaDto, AsignarEstadoAPropuestaDto, CrearPropuestaDto, GenerarPlanillaDto, GetPropuestasQuery } from '../dto/entradas';
import { PropuestaService } from './propuesta.service';

@ApiTags("Propuesta")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("planificacion")
export class PropuestaController {
  constructor(private readonly servicio: PropuestaService) {}

  @Post("propuestas")
  @ApiOperation({"operationId":"crear_propuesta","summary":"Crear propuesta (queda en estado Borrador)","description":"La propuesta nace en Borrador (BOR) y se valida completa, no curso por curso."})
  @ApiResponse({ status: 201, description: "Creado", type: Propuesta })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_propuesta(@Body() body: CrearPropuestaDto): Promise<Propuesta> {
    return this.servicio.crear_propuesta(body);
  }

  @Put("propuestas/:id/estado")
  @ApiOperation({"operationId":"asignar_estado_a_propuesta","summary":"Asignar estado a la propuesta"})
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Propuesta })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_estado_a_propuesta(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarEstadoAPropuestaDto): Promise<Propuesta> {
    return this.servicio.asignar_estado_a_propuesta(id, body);
  }

  @Post("propuestas/:id/clases")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_clase_a_propuesta","summary":"Agregar una clase a la propuesta"})
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Propuesta })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_clase_a_propuesta(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarClaseAPropuestaDto): Promise<Propuesta> {
    return this.servicio.asignar_clase_a_propuesta(id, body);
  }

  @Post("propuestas/:id/generacion")
  @HttpCode(200)
  @ApiOperation({
    operationId: "generar_planilla",
    summary: "Generar la planilla automáticamente",
    description:
      "Completa las horas que faltan en los cursos del ciclo de la propuesta (o solo en `id_curso`) y guarda el resultado. " +
      "Respeta lo ya ubicado, la disponibilidad declarada por cada docente, que un docente no esté en dos clases a la vez " +
      "(por horario real, aunque sean turnos distintos) y el tope de 2 horas diarias por materia. Si la clase ya tiene docentes " +
      "usa esos; si no, el habilitado con más margen (las materias EPA van con todos sus habilitados juntos). " +
      "Cada cambio se guarda como crear_clase + asignar_clase_a_propuesta o editar_clase; si una regla lo rechaza, sigue con " +
      "el resto y lo informa en `errores`. `cambios` trae lo que tenía cada clase antes, para deshacer. Solo en Borrador. " +
      "(Agregado: no está en el documento.)\n\n" +
      "Invoca: orientacion.get_materias, horarios.get_turnos, horarios.get_franjas_horarias, profesor_suplencias.get_profesores, " +
      "profesor_suplencias.get_disponibilidad_profesor, orientacion.get_materia, horarios.get_turno, orientacion.asignar_clase_a_materia.",
  })
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: ResultadoGeneracion })
  @ApiResponse({ status: 400, description: 'Datos inválidos o curso que no es del ciclo de la propuesta', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe la propuesta', type: ErrorApi })
  @ApiResponse({ status: 409, description: 'La propuesta no está en Borrador', type: ErrorApi })
  generar_planilla(@Param("id", ParseIntPipe) id: number, @Body() body: GenerarPlanillaDto): Promise<ResultadoGeneracion> {
    return this.servicio.generar_planilla(id, body ?? {});
  }

  @Get("propuestas/:id/estado")
  @ApiOperation({"operationId":"get_estado_actual_de_propuesta","summary":"Estado actual de la propuesta"})
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: EstadoPropuesta })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_estado_actual_de_propuesta(@Param("id", ParseIntPipe) id: number): Promise<EstadoPropuesta> {
    return this.servicio.get_estado_actual_de_propuesta(id);
  }

  @Get("propuestas")
  @ApiOperation({"operationId":"get_propuestas","summary":"Listar propuestas"})
  @ApiResponse({ status: 200, description: "OK", type: [Propuesta] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_propuestas(@Query() query: GetPropuestasQuery): Promise<Propuesta[]> {
    return this.servicio.get_propuestas(query);
  }

  @Get("propuestas/:id")
  @ApiOperation({"operationId":"get_propuesta","summary":"Obtener propuesta"})
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Propuesta })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_propuesta(@Param("id", ParseIntPipe) id: number): Promise<Propuesta> {
    return this.servicio.get_propuesta(id);
  }
}
