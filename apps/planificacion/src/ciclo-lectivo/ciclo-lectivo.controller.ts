// Rutas de Ciclo lectivo. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { CicloLectivo } from '../dto/modelos';
import { CrearCicloLectivoDto } from '../dto/entradas';
import { CicloLectivoService } from './ciclo-lectivo.service';

@ApiTags("Ciclo lectivo")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("planificacion")
export class CicloLectivoController {
  constructor(private readonly servicio: CicloLectivoService) {}

  @Post("ciclos-lectivos")
  @ApiOperation({"operationId":"crear_ciclo_lectivo","summary":"Crear ciclo lectivo"})
  @ApiResponse({ status: 201, description: "Creado", type: CicloLectivo })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_ciclo_lectivo(@Body() body: CrearCicloLectivoDto): Promise<CicloLectivo> {
    return this.servicio.crear_ciclo_lectivo(body);
  }

  @Get("ciclos-lectivos/:id")
  @ApiOperation({"operationId":"get_ciclo_lectivo","summary":"Obtener ciclo lectivo"})
  @ApiParam({"name":"id","description":"Id del ciclo lectivo","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: CicloLectivo })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
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
