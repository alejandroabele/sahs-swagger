// Rutas de Recibo de sueldo. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RespuestaError } from '@sahs/comun';
import { ReciboSueldo } from '../dto/modelos';
import { FirmarReciboDeSueldoDto, GetRecibosDeSueldoQuery } from '../dto/entradas';
import { ReciboDeSueldoService } from './recibo-de-sueldo.service';

@ApiTags("Recibo de sueldo")
@RespuestaError(409)
@RespuestaError(503)
@Controller("pago")
export class ReciboDeSueldoController {
  constructor(private readonly servicio: ReciboDeSueldoService) {}

  @Get("recibos-de-sueldo/:id/pdf")
  @ApiOperation({"operationId":"bajar_recibo_sueldo","summary":"Descargar el recibo en PDF","description":"Es GET porque solo descarga el PDF (en el documento figura como command)."})
  @ApiParam({"name":"id","description":"Id del recibo de sueldo","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "PDF del recibo", content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })
  @RespuestaError(404)
  bajar_recibo_sueldo(@Param("id", ParseIntPipe) id: number): Promise<StreamableFile> {
    return this.servicio.bajar_recibo_sueldo(id);
  }

  @Post("recibos-de-sueldo/:id/firma")
  @HttpCode(200)
  @ApiOperation({"operationId":"firmar_recibo_de_sueldo","summary":"Firmar recibo (profesor)","description":"Completa `firma_receptor` con el usuario y la fecha. La firma es definitiva: no hay operación para revertirla."})
  @ApiParam({"name":"id","description":"Id del recibo de sueldo","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: ReciboSueldo })
  @RespuestaError(400)
  @RespuestaError(404)
  firmar_recibo_de_sueldo(@Param("id", ParseIntPipe) id: number, @Body() body: FirmarReciboDeSueldoDto): Promise<ReciboSueldo> {
    return this.servicio.firmar_recibo_de_sueldo(id, body);
  }

  @Get("recibos-de-sueldo")
  @ApiOperation({"operationId":"get_recibos_de_sueldo","summary":"Listar recibos de sueldo"})
  @ApiResponse({ status: 200, description: "OK", type: [ReciboSueldo] })
  @RespuestaError(400)
  get_recibos_de_sueldo(@Query() query: GetRecibosDeSueldoQuery): Promise<ReciboSueldo[]> {
    return this.servicio.get_recibos_de_sueldo(query);
  }
}
