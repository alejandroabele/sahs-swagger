// Rutas de Franja horaria. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RespuestaError } from '@sahs/comun';
import { FranjaHoraria } from '../dto/modelos';
import { CrearFranjaHorariaDto } from '../dto/entradas';
import { FranjaHorariaService } from './franja-horaria.service';

@ApiTags("Franja horaria")
@RespuestaError(409)
@RespuestaError(503)
@Controller("horarios")
export class FranjaHorariaController {
  constructor(private readonly servicio: FranjaHorariaService) {}

  @Post("franjas-horarias")
  @ApiOperation({"operationId":"crear_franja_horaria","summary":"Crear franja horaria"})
  @ApiResponse({ status: 201, description: "Creado", type: FranjaHoraria })
  @RespuestaError(400, 'RN-10', 'RN-16')
  crear_franja_horaria(@Body() body: CrearFranjaHorariaDto): Promise<FranjaHoraria> {
    return this.servicio.crear_franja_horaria(body);
  }

  @Get("franjas-horarias/:id")
  @ApiOperation({"operationId":"get_franja_horaria","summary":"Obtener franja horaria"})
  @ApiParam({"name":"id","description":"Id de la franja horaria","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: FranjaHoraria })
  @RespuestaError(404)
  get_franja_horaria(@Param("id", ParseIntPipe) id: number): Promise<FranjaHoraria> {
    return this.servicio.get_franja_horaria(id);
  }

  @Get("franjas-horarias")
  @ApiOperation({"operationId":"get_franjas_horarias","summary":"Listar franjas horarias"})
  @ApiResponse({ status: 200, description: "OK", type: [FranjaHoraria] })
  get_franjas_horarias(): Promise<FranjaHoraria[]> {
    return this.servicio.get_franjas_horarias();
  }
}
