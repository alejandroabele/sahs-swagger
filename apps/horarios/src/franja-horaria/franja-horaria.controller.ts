// Rutas de Franja horaria. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { FranjaHoraria } from '../dto/modelos';
import { CrearFranjaHorariaDto } from '../dto/entradas';
import { FranjaHorariaService } from './franja-horaria.service';

@ApiTags("Franja horaria")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("horarios")
export class FranjaHorariaController {
  constructor(private readonly servicio: FranjaHorariaService) {}

  @Post("crear_franja_horaria")
  @ApiOperation({"operationId":"crear_franja_horaria","summary":"Crear franja horaria"})
  @ApiResponse({ status: 201, description: "Creado", type: FranjaHoraria })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_franja_horaria(@Body() body: CrearFranjaHorariaDto): Promise<FranjaHoraria> {
    return this.servicio.crear_franja_horaria(body);
  }

  @Get("get_franja_horaria/:id")
  @ApiOperation({"operationId":"get_franja_horaria","summary":"Obtener franja horaria"})
  @ApiParam({"name":"id","description":"Id de la franja horaria","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: FranjaHoraria })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_franja_horaria(@Param("id", ParseIntPipe) id: number): Promise<FranjaHoraria> {
    return this.servicio.get_franja_horaria(id);
  }

  @Get("get_franjas_horarias")
  @ApiOperation({"operationId":"get_franjas_horarias","summary":"Listar franjas horarias"})
  @ApiResponse({ status: 200, description: "OK", type: [FranjaHoraria] })
  get_franjas_horarias(): Promise<FranjaHoraria[]> {
    return this.servicio.get_franjas_horarias();
  }
}
