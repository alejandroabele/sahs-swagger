// Rutas de Día lectivo. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { DiaLectivo, FranjaHoraria } from '../dto/modelos';
import { CrearDiaLectivoDto } from '../dto/entradas';
import { DiaLectivoService } from './dia-lectivo.service';

@ApiTags("Día lectivo")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("horarios")
export class DiaLectivoController {
  constructor(private readonly servicio: DiaLectivoService) {}

  @Post("dias-lectivos")
  @ApiOperation({"operationId":"crear_dia_lectivo","summary":"Crear día lectivo"})
  @ApiResponse({ status: 201, description: "Creado", type: DiaLectivo })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_dia_lectivo(@Body() body: CrearDiaLectivoDto): Promise<DiaLectivo> {
    return this.servicio.crear_dia_lectivo(body);
  }

  @Delete("dias-lectivos/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_dia_lectivo","summary":"Eliminar día lectivo"})
  @ApiParam({"name":"id","description":"Id del día lectivo","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminado" })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_dia_lectivo(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_dia_lectivo(id);
  }

  @Get("dias-lectivos/:id")
  @ApiOperation({"operationId":"get_dia_lectivo","summary":"Obtener día lectivo"})
  @ApiParam({"name":"id","description":"Id del día lectivo","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: DiaLectivo })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_dia_lectivo(@Param("id", ParseIntPipe) id: number): Promise<DiaLectivo> {
    return this.servicio.get_dia_lectivo(id);
  }

  @Get("dias-lectivos")
  @ApiOperation({"operationId":"get_dias_lectivos","summary":"Listar días lectivos"})
  @ApiResponse({ status: 200, description: "OK", type: [DiaLectivo] })
  get_dias_lectivos(): Promise<DiaLectivo[]> {
    return this.servicio.get_dias_lectivos();
  }

  @Get("dias-lectivos/:id/franjas-horarias")
  @ApiOperation({"operationId":"get_franja_horaria_dia_lectivo","summary":"Franjas horarias del día lectivo"})
  @ApiParam({"name":"id","description":"Id del día lectivo","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [FranjaHoraria] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_franja_horaria_dia_lectivo(@Param("id", ParseIntPipe) id: number): Promise<FranjaHoraria[]> {
    return this.servicio.get_franja_horaria_dia_lectivo(id);
  }
}
