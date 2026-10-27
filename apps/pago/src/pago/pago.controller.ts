// Rutas de Pago. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { MontoLiquidar, Pago } from '../dto/modelos';
import { CalcularMontoALiquidarQuery, CrearPagoDto, GetPagosQuery, ValidarPagoDto } from '../dto/entradas';
import { PagoService } from './pago.service';

@ApiTags("Pago")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("pago")
export class PagoController {
  constructor(private readonly servicio: PagoService) {}

  @Post("pagos")
  @ApiOperation({"operationId":"crear_pago","summary":"Crear pago del profesor para un período","description":"Genera también el único recibo de sueldo del pago, con sus conceptos y el neto de calcular_monto_a_liquidar.\n\nInvoca: profesor_suplencias.get_profesor"})
  @ApiResponse({ status: 201, description: "Creado", type: Pago })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_pago(@Body() body: CrearPagoDto): Promise<Pago> {
    return this.servicio.crear_pago(body);
  }

  @Post("pagos/:id/validacion")
  @HttpCode(200)
  @ApiOperation({"operationId":"validar_pago","summary":"Validar pago (administrativo)","description":"Deja `validado` en true y completa `firma_emisor` en el recibo del pago."})
  @ApiParam({"name":"id","description":"Id del pago","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Pago })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  validar_pago(@Param("id", ParseIntPipe) id: number, @Body() body: ValidarPagoDto): Promise<Pago> {
    return this.servicio.validar_pago(id, body);
  }

  @Get("profesores/:id/monto-a-liquidar")
  @ApiOperation({"operationId":"calcular_monto_a_liquidar","summary":"Calcular monto a liquidar","description":"El cálculo es interno del servicio; solo recibe el profesor y el período. Es GET porque no guarda nada (en el documento figura como command).\n\nInvoca: profesor_suplencias.get_profesor"})
  @ApiParam({"name":"id","description":"Id del profesor","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: MontoLiquidar })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  calcular_monto_a_liquidar(@Param("id", ParseIntPipe) id: number, @Query() query: CalcularMontoALiquidarQuery): Promise<MontoLiquidar> {
    return this.servicio.calcular_monto_a_liquidar(id, query);
  }

  @Get("pagos")
  @ApiOperation({"operationId":"get_pagos","summary":"Listar pagos (con su recibo anidado)"})
  @ApiResponse({ status: 200, description: "OK", type: [Pago] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_pagos(@Query() query: GetPagosQuery): Promise<Pago[]> {
    return this.servicio.get_pagos(query);
  }
}
