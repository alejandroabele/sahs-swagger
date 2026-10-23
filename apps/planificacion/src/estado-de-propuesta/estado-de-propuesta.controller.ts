// Rutas de Estado de propuesta. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { EstadoPropuesta } from '../dto/modelos';
import { CrearEstadoPropuestaDto } from '../dto/entradas';
import { EstadoDePropuestaService } from './estado-de-propuesta.service';

@ApiTags("Estado de propuesta")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("planificacion")
export class EstadoDePropuestaController {
  constructor(private readonly servicio: EstadoDePropuestaService) {}

  @Post("crear_estado_propuesta")
  @ApiOperation({"operationId":"crear_estado_propuesta","summary":"Crear estado de propuesta"})
  @ApiResponse({ status: 201, description: "Creado", type: EstadoPropuesta })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_estado_propuesta(@Body() body: CrearEstadoPropuestaDto): Promise<EstadoPropuesta> {
    return this.servicio.crear_estado_propuesta(body);
  }

  @Get("get_posibles_estados_de_propuestas")
  @ApiOperation({"operationId":"get_posibles_estados_de_propuestas","summary":"Listar estados posibles"})
  @ApiResponse({ status: 200, description: "OK", type: [EstadoPropuesta] })
  get_posibles_estados_de_propuestas(): Promise<EstadoPropuesta[]> {
    return this.servicio.get_posibles_estados_de_propuestas();
  }
}
