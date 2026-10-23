// Rutas de Suplencia. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Suplencia } from '../dto/modelos';
import { CrearSuplenciaDto, GetSuplenciasQuery } from '../dto/entradas';
import { SuplenciaService } from './suplencia.service';

@ApiTags("Suplencia")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("profesor_suplencias")
export class SuplenciaController {
  constructor(private readonly servicio: SuplenciaService) {}

  @Post("crear_suplencia")
  @ApiOperation({"operationId":"crear_suplencia","summary":"Crear suplencia (suplente y clases que cubre)","description":"La suplencia se crea completa: un suplente y las clases que cubre en el período.\n\nInvoca: planificacion.get_clase"})
  @ApiResponse({ status: 201, description: "Creado", type: Suplencia })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_suplencia(@Body() body: CrearSuplenciaDto): Promise<Suplencia> {
    return this.servicio.crear_suplencia(body);
  }

  @Get("get_suplencias")
  @ApiOperation({"operationId":"get_suplencias","summary":"Listar suplencias","description":"Con `fecha_desde` y `fecha_hasta` devuelve las suplencias cuyo período se superpone con el rango.\n\nInvoca: planificacion.get_clase"})
  @ApiResponse({ status: 200, description: "OK", type: [Suplencia] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_suplencias(@Query() query: GetSuplenciasQuery): Promise<Suplencia[]> {
    return this.servicio.get_suplencias(query);
  }
}
