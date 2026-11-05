// Rutas de Ciclo lectivo. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RespuestaError } from '@sahs/comun';
import { CicloLectivo } from '../dto/modelos';
import { CrearCicloLectivoDto } from '../dto/entradas';
import { CicloLectivoService } from './ciclo-lectivo.service';

@ApiTags("Ciclo lectivo")
@RespuestaError(409)
@RespuestaError(503)
@Controller("planificacion")
export class CicloLectivoController {
  constructor(private readonly servicio: CicloLectivoService) {}

  @Post("ciclos-lectivos")
  @ApiOperation({"operationId":"crear_ciclo_lectivo","summary":"Crear ciclo lectivo"})
  @ApiResponse({ status: 201, description: "Creado", type: CicloLectivo })
  @RespuestaError(400)
  crear_ciclo_lectivo(@Body() body: CrearCicloLectivoDto): Promise<CicloLectivo> {
    return this.servicio.crear_ciclo_lectivo(body);
  }

  @Get("ciclos-lectivos/:id")
  @ApiOperation({"operationId":"get_ciclo_lectivo","summary":"Obtener ciclo lectivo"})
  @ApiParam({"name":"id","description":"Id del ciclo lectivo","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: CicloLectivo })
  @RespuestaError(404)
  get_ciclo_lectivo(@Param("id", ParseIntPipe) id: number): Promise<CicloLectivo> {
    return this.servicio.get_ciclo_lectivo(id);
  }

  @Get("ciclos-lectivos")
  @ApiOperation({"operationId":"get_ciclos_lectivos","summary":"Listar ciclos lectivos"})
  @ApiResponse({ status: 200, description: "OK", type: [CicloLectivo] })
  get_ciclos_lectivos(): Promise<CicloLectivo[]> {
    return this.servicio.get_ciclos_lectivos();
  }
}
