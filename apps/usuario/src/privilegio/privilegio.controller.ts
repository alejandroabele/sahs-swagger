// Rutas de Privilegio. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RespuestaError } from '@sahs/comun';
import { Privilegio } from '../dto/modelos';
import { PrivilegioService } from './privilegio.service';

@ApiTags("Privilegio")
@RespuestaError(409)
@RespuestaError(503)
@Controller("usuario")
export class PrivilegioController {
  constructor(private readonly servicio: PrivilegioService) {}

  @Get("privilegios")
  @ApiOperation({"operationId":"get_privilegios","summary":"Listar privilegios"})
  @ApiResponse({ status: 200, description: "OK", type: [Privilegio] })
  get_privilegios(): Promise<Privilegio[]> {
    return this.servicio.get_privilegios();
  }
}
