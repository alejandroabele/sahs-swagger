// Rutas de Estado de planificación. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RespuestaError } from '@sahs/comun';
import { EstadoPlanificacion } from '../dto/modelos';
import { CrearEstadoPlanificacionDto } from '../dto/entradas';
import { EstadoDePlanificacionService } from './estado-de-planificacion.service';

@ApiTags("Estado de planificación")
@RespuestaError(409)
@RespuestaError(503)
@Controller("planificaciones")
export class EstadoDePlanificacionController {
  constructor(private readonly servicio: EstadoDePlanificacionService) {}

  @Post("estados")
  @ApiOperation({"operationId":"crear_estado_planificacion","summary":"Crear estado de planificación"})
  @ApiResponse({ status: 201, description: "Creado", type: EstadoPlanificacion })
  @RespuestaError(400)
  crear_estado_planificacion(@Body() body: CrearEstadoPlanificacionDto): Promise<EstadoPlanificacion> {
    return this.servicio.crear_estado_planificacion(body);
  }

  @Get("estados")
  @ApiOperation({"operationId":"get_posibles_estados_de_planificaciones","summary":"Listar estados posibles"})
  @ApiResponse({ status: 200, description: "OK", type: [EstadoPlanificacion] })
  get_posibles_estados_de_planificaciones(): Promise<EstadoPlanificacion[]> {
    return this.servicio.get_posibles_estados_de_planificaciones();
  }
}
