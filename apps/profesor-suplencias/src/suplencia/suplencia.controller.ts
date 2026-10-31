// Rutas de Suplencia. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Suplencia } from '../dto/modelos';
import { CrearSuplenciaDto, GetSuplenciasQuery } from '../dto/entradas';
import { SuplenciaService } from './suplencia.service';

@ApiTags("Suplencia")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("profesor-suplencias")
export class SuplenciaController {
  constructor(private readonly servicio: SuplenciaService) {}

  @Post("profesores/:id/suplencias")
  @ApiOperation({"operationId":"crear_suplencia","summary":"Crear suplencia del profesor (las clases que cubre)","description":"La suplencia es del profesor que la cubre (el suplente, `{id}`) y se crea completa, con las clases que cubre en el período. El suplente tiene que estar activo, tener habilitada la materia de cada clase y haber declarado como disponibles todas sus franjas; no puede ser docente de la clase, y una clase no puede tener dos suplencias con fechas superpuestas (`409`).\n\nInvoca: planificacion.get_clase, horarios.get_franja_horaria"})
  @ApiParam({"name":"id","description":"Id del profesor que cubre la suplencia (suplente)","type":"integer","format":"int64"})
  @ApiResponse({ status: 201, description: "Creado", type: Suplencia })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  crear_suplencia(@Param("id", ParseIntPipe) id: number, @Body() body: CrearSuplenciaDto): Promise<Suplencia> {
    return this.servicio.crear_suplencia(id, body);
  }

  @Get("suplencias")
  @ApiOperation({"operationId":"get_suplencias","summary":"Listar suplencias","description":"Con `fecha_desde` y `fecha_hasta` devuelve las suplencias cuyo período se superpone con el rango.\n\nInvoca: planificacion.get_clase"})
  @ApiResponse({ status: 200, description: "OK", type: [Suplencia] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_suplencias(@Query() query: GetSuplenciasQuery): Promise<Suplencia[]> {
    return this.servicio.get_suplencias(query);
  }
}
