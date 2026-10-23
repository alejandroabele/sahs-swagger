// Rutas de Propuesta. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { EstadoPropuesta, Propuesta } from '../dto/modelos';
import { AsignarClaseAPropuestaDto, AsignarEstadoAPropuestaDto, CrearPropuestaDto, GetPropuestasQuery } from '../dto/entradas';
import { PropuestaService } from './propuesta.service';

@ApiTags("Propuesta")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("planificacion")
export class PropuestaController {
  constructor(private readonly servicio: PropuestaService) {}

  @Post("crear_propuesta")
  @ApiOperation({"operationId":"crear_propuesta","summary":"Crear propuesta (queda en estado Borrador)","description":"La propuesta nace en Borrador (BOR) y se valida completa, no curso por curso."})
  @ApiResponse({ status: 201, description: "Creado", type: Propuesta })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_propuesta(@Body() body: CrearPropuestaDto): Promise<Propuesta> {
    return this.servicio.crear_propuesta(body);
  }

  @Put("asignar_estado_a_propuesta/:id")
  @ApiOperation({"operationId":"asignar_estado_a_propuesta","summary":"Asignar estado a la propuesta"})
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Propuesta })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_estado_a_propuesta(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarEstadoAPropuestaDto): Promise<Propuesta> {
    return this.servicio.asignar_estado_a_propuesta(id, body);
  }

  @Post("asignar_clase_a_propuesta/:id")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_clase_a_propuesta","summary":"Agregar una clase a la propuesta"})
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Propuesta })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_clase_a_propuesta(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarClaseAPropuestaDto): Promise<Propuesta> {
    return this.servicio.asignar_clase_a_propuesta(id, body);
  }

  @Get("get_estado_actual_de_propuesta/:id")
  @ApiOperation({"operationId":"get_estado_actual_de_propuesta","summary":"Estado actual de la propuesta"})
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: EstadoPropuesta })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_estado_actual_de_propuesta(@Param("id", ParseIntPipe) id: number): Promise<EstadoPropuesta> {
    return this.servicio.get_estado_actual_de_propuesta(id);
  }

  @Get("get_propuestas")
  @ApiOperation({"operationId":"get_propuestas","summary":"Listar propuestas"})
  @ApiResponse({ status: 200, description: "OK", type: [Propuesta] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_propuestas(@Query() query: GetPropuestasQuery): Promise<Propuesta[]> {
    return this.servicio.get_propuestas(query);
  }

  @Get("get_propuesta/:id")
  @ApiOperation({"operationId":"get_propuesta","summary":"Obtener propuesta"})
  @ApiParam({"name":"id","description":"Id de la propuesta","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Propuesta })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_propuesta(@Param("id", ParseIntPipe) id: number): Promise<Propuesta> {
    return this.servicio.get_propuesta(id);
  }
}
