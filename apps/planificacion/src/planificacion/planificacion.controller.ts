// Rutas de Planificación. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RespuestaError } from '@sahs/comun';
import { ArmadoPlanificacion, EstadoPlanificacion, Planificacion, ResultadoGeneracion } from '../dto/modelos';
import { AsignarClaseAPlanificacionDto, AsignarEstadoAPlanificacionDto, CrearPlanificacionDto, GenerarPlanillaDto, GetPlanificacionesQuery } from '../dto/entradas';
import { PlanificacionService } from './planificacion.service';

@ApiTags("Planificación")
@RespuestaError(409)
@RespuestaError(503)
@Controller("planificaciones")
export class PlanificacionController {
  constructor(private readonly servicio: PlanificacionService) {}

  @Post()
  @ApiOperation({"operationId":"crear_planificacion","summary":"Crear planificación (queda en estado Borrador)","description":"La planificación nace en Borrador (BOR) y se valida completa, no curso por curso."})
  @ApiResponse({ status: 201, description: "Creado", type: Planificacion })
  @RespuestaError(400)
  crear_planificacion(@Body() body: CrearPlanificacionDto): Promise<Planificacion> {
    return this.servicio.crear_planificacion(body);
  }

  @Put(":id/estado")
  @ApiOperation({"operationId":"asignar_estado_a_planificacion","summary":"Asignar estado a la planificación","description":"Transiciones: Borrador → En revisión; En revisión → Vigente o Borrador. Una planificación Vigente no cambia de estado por pedido: pasa sola a Fue vigente cuando otra de su ciclo lectivo pasa a Vigente, así hay una sola Vigente por ciclo.\n\nPara pasar a En revisión la planificación necesita al menos una clase, y para pasar a En revisión o a Vigente cada materia de cada curso del ciclo tiene que tener exactamente sus horas semanales. Si no, responde `409` con cada diferencia (`1A: Matemática 3 de 5 h`).\n\nInvoca: orientacion.get_materia"})
  @ApiParam({"name":"id","description":"Id de la planificación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Planificacion })
  @RespuestaError(400)
  @RespuestaError(404)
  asignar_estado_a_planificacion(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarEstadoAPlanificacionDto): Promise<Planificacion> {
    return this.servicio.asignar_estado_a_planificacion(id, body);
  }

  @Post(":id/clases")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_clase_a_planificacion","summary":"Agregar una clase a la planificación","description":"Solo en Borrador. Responde `409` si el curso ya tiene otra clase en alguna de sus franjas, si un docente ya tiene otra clase a la vez, o si con la clase la materia supera sus horas semanales en el curso."})
  @ApiParam({"name":"id","description":"Id de la planificación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Planificacion })
  @RespuestaError(400)
  @RespuestaError(404)
  @RespuestaError(409, 'RN-02')
  asignar_clase_a_planificacion(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarClaseAPlanificacionDto): Promise<Planificacion> {
    return this.servicio.asignar_clase_a_planificacion(id, body);
  }

  @Post(":id/generacion")
  @HttpCode(200)
  @ApiOperation({
    operationId: "generar_planilla",
    summary: "Generar la planilla automáticamente",
    description:
      "Completa las horas que faltan en los cursos del ciclo de la planificación (o solo en `id_curso`) y guarda el resultado. " +
      "Respeta lo ya ubicado, la disponibilidad declarada por cada docente, que un docente no esté en dos clases a la vez " +
      "(por horario real, aunque sean turnos distintos) y que ninguna materia supere sus horas semanales en el curso. Si la clase ya tiene docentes " +
      "usa esos; si no, el habilitado activo con más margen (las materias EPA van con todos sus habilitados juntos). " +
      "Cada cambio se guarda como crear_clase + asignar_clase_a_planificacion o editar_clase; si una regla lo rechaza, sigue con " +
      "el resto y lo informa en `errores`. `cambios` trae lo que tenía cada clase antes, para deshacer. Solo en Borrador. " +
      "(Agregado: no está en el documento.)\n\n" +
      "Invoca: orientacion.get_materias, horarios.get_turnos, horarios.get_franjas_horarias, profesor_suplencias.get_profesores, " +
      "profesor_suplencias.get_disponibilidad_profesor, orientacion.get_materia, horarios.get_turno, orientacion.asignar_clase_a_materia.",
  })
  @ApiParam({"name":"id","description":"Id de la planificación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: ResultadoGeneracion })
  @RespuestaError(400)
  @RespuestaError(404)
  @RespuestaError(409)
  generar_planilla(@Param("id", ParseIntPipe) id: number, @Body() body: GenerarPlanillaDto): Promise<ResultadoGeneracion> {
    return this.servicio.generar_planilla(id, body ?? {});
  }

  @Get(":id/armado")
  @ApiOperation({
    operationId: "get_armado_planificacion",
    summary: "Fachada: datos para abrir el armado de la planificación (pantalla A13)",
    description:
      "**Fachada** (agregado: no está en el documento). Junta en una sola respuesta lo que la pantalla de armado " +
      "pedía en cuatro llamadas, y no guarda nada.\n\n" +
      "**Qué hace por detrás:**\n\n" +
      "| Paso | Origen | Equivale a |\n" +
      "|---|---|---|\n" +
      "| 1. Busca la planificación con su estado (404 si no existe) | Planificación, tablas `planificacion_planificacion` y `planificacion_estado_planificacion` | `get_planificacion` |\n" +
      "| 2. Lista los estados posibles | Planificación, tabla `planificacion_estado_planificacion` | `get_posibles_estados_de_planificaciones` |\n" +
      "| 3. Lista los cursos del ciclo de la planificación, ordenados por año y división, con sus materias y su año académico | Planificación, tablas `planificacion_curso`, `planificacion_materia_curso` y `planificacion_anio_academico` | `get_cursos?id_ciclo_lectivo` + `get_anios_academicos` |\n" +
      "| 4. Nombre y área de cada materia del curso | HTTP a **Orientación**: `GET /orientacion/materias` (una vez) | `orientacion.get_materias` |\n" +
      "| 5. Orientación de cada curso | HTTP a **Orientación**: `GET /orientacion/orientaciones` (una vez) | `orientacion.get_orientaciones` |\n" +
      "| 6. Turno y franjas horarias de cada curso | HTTP a **Horarios**: `GET /horarios/turnos` (una vez) | `horarios.get_turnos` |\n\n" +
      "Los pasos 1 a 3 corren en paralelo y los 4 a 6 también, así que hay 3 llamadas HTTP por request sin importar cuántos cursos haya. " +
      "Si Orientación u Horarios no responden, devuelve 503.\n\n" +
      "**Qué no trae:** las clases. La pantalla las pide recién al elegir un curso, con `get_clases?id_planificacion={id}&id_curso={id_curso}`.\n\n" +
      "Invoca: orientacion.get_materias, orientacion.get_orientaciones, horarios.get_turnos.",
  })
  @ApiParam({"name":"id","description":"Id de la planificación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: ArmadoPlanificacion })
  @RespuestaError(404)
  get_armado_planificacion(@Param("id", ParseIntPipe) id: number): Promise<ArmadoPlanificacion> {
    return this.servicio.get_armado_planificacion(id);
  }

  @Get(":id/estado")
  @ApiOperation({"operationId":"get_estado_actual_de_planificacion","summary":"Estado actual de la planificación"})
  @ApiParam({"name":"id","description":"Id de la planificación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: EstadoPlanificacion })
  @RespuestaError(404)
  get_estado_actual_de_planificacion(@Param("id", ParseIntPipe) id: number): Promise<EstadoPlanificacion> {
    return this.servicio.get_estado_actual_de_planificacion(id);
  }

  @Get()
  @ApiOperation({"operationId":"get_planificaciones","summary":"Listar planificaciones"})
  @ApiResponse({ status: 200, description: "OK", type: [Planificacion] })
  @RespuestaError(400)
  get_planificaciones(@Query() query: GetPlanificacionesQuery): Promise<Planificacion[]> {
    return this.servicio.get_planificaciones(query);
  }

  @Get(":id")
  @ApiOperation({"operationId":"get_planificacion","summary":"Obtener planificación"})
  @ApiParam({"name":"id","description":"Id de la planificación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Planificacion })
  @RespuestaError(404)
  get_planificacion(@Param("id", ParseIntPipe) id: number): Promise<Planificacion> {
    return this.servicio.get_planificacion(id);
  }
}
