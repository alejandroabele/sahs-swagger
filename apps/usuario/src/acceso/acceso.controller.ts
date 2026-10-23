// Rutas de Acceso. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { LoginRespuesta } from '../dto/modelos';
import { LoginDto } from '../dto/entradas';
import { AccesoService } from './acceso.service';

@ApiTags("Acceso")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("usuario")
export class AccesoController {
  constructor(private readonly servicio: AccesoService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({"operationId":"login","summary":"Ingresar al sistema","description":"Sin esquema de seguridad por ahora: el token se devuelve como texto simple."})
  @ApiResponse({ status: 200, description: "OK", type: LoginRespuesta })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  login(@Body() body: LoginDto): Promise<LoginRespuesta> {
    return this.servicio.login(body);
  }
}
