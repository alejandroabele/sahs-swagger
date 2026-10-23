// Rutas de Recibo de sueldo. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { ReciboSueldo } from '../dto/modelos';
import { FirmarReciboDeSueldoDto, GetRecibosDeSueldoQuery } from '../dto/entradas';
import { ReciboDeSueldoService } from './recibo-de-sueldo.service';

@ApiTags("Recibo de sueldo")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("pago")
export class ReciboDeSueldoController {
  constructor(private readonly servicio: ReciboDeSueldoService) {}

  @Get("bajar_recibo_sueldo/:id")
  @ApiOperation({"operationId":"bajar_recibo_sueldo","summary":"Descargar el recibo en PDF","description":"Es GET porque solo descarga el PDF (en el documento figura como command)."})
  @ApiParam({"name":"id","description":"Id del recibo de sueldo","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "PDF del recibo", content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  bajar_recibo_sueldo(@Param("id", ParseIntPipe) id: number): Promise<StreamableFile> {
    return this.servicio.bajar_recibo_sueldo(id);
  }

  @Post("firmar_recibo_de_sueldo/:id")
  @HttpCode(200)
  @ApiOperation({"operationId":"firmar_recibo_de_sueldo","summary":"Firmar recibo (profesor)","description":"Completa `firma_receptor` con el usuario y la fecha. La firma es definitiva: no hay operación para revertirla."})
  @ApiParam({"name":"id","description":"Id del recibo de sueldo","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: ReciboSueldo })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  firmar_recibo_de_sueldo(@Param("id", ParseIntPipe) id: number, @Body() body: FirmarReciboDeSueldoDto): Promise<ReciboSueldo> {
    return this.servicio.firmar_recibo_de_sueldo(id, body);
  }

  @Get("get_recibos_de_sueldo")
  @ApiOperation({"operationId":"get_recibos_de_sueldo","summary":"Listar recibos de sueldo"})
  @ApiResponse({ status: 200, description: "OK", type: [ReciboSueldo] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_recibos_de_sueldo(@Query() query: GetRecibosDeSueldoQuery): Promise<ReciboSueldo[]> {
    return this.servicio.get_recibos_de_sueldo(query);
  }
}
