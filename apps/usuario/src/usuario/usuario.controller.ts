// Rutas de Usuario. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RespuestaError } from '@sahs/comun';
import { Usuario } from '../dto/modelos';
import { AsignarRolDto, CambiarContraseniaDto, CrearUsuarioDto, EditarUsuarioDto } from '../dto/entradas';
import { UsuarioService } from './usuario.service';

@ApiTags("Usuario")
@RespuestaError(409)
@RespuestaError(503)
@Controller("usuario")
export class UsuarioController {
  constructor(private readonly servicio: UsuarioService) {}

  @Post("usuarios")
  @ApiOperation({"operationId":"crear_usuario","summary":"Crear usuario"})
  @ApiResponse({ status: 201, description: "Creado", type: Usuario })
  @RespuestaError(400)
  crear_usuario(@Body() body: CrearUsuarioDto): Promise<Usuario> {
    return this.servicio.crear_usuario(body);
  }

  @Put("usuarios/:id/rol")
  @ApiOperation({"operationId":"asignar_rol","summary":"Asignar el rol del usuario (reemplaza el anterior)"})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Usuario })
  @RespuestaError(400)
  @RespuestaError(404)
  asignar_rol(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarRolDto): Promise<Usuario> {
    return this.servicio.asignar_rol(id, body);
  }

  @Put("usuarios/:id")
  @ApiOperation({"operationId":"editar_usuario","summary":"Editar usuario (nombre de usuario y email)","description":"Reemplaza el nombre de usuario y el email. No cambia la contraseña (`cambiar_contrasenia`) ni el rol (`asignar_rol`)."})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Usuario })
  @RespuestaError(400)
  @RespuestaError(404)
  editar_usuario(@Param("id", ParseIntPipe) id: number, @Body() body: EditarUsuarioDto): Promise<Usuario> {
    return this.servicio.editar_usuario(id, body);
  }

  @Patch("usuarios/:id/contrasenia")
  @ApiOperation({"operationId":"cambiar_contrasenia","summary":"Cambiar contraseña"})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Usuario })
  @RespuestaError(400)
  @RespuestaError(404)
  cambiar_contrasenia(@Param("id", ParseIntPipe) id: number, @Body() body: CambiarContraseniaDto): Promise<Usuario> {
    return this.servicio.cambiar_contrasenia(id, body);
  }

  @Delete("usuarios/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_usuario","summary":"Eliminar usuario"})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminado" })
  @RespuestaError(404)
  eliminar_usuario(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_usuario(id);
  }

  @Get("usuarios/:id")
  @ApiOperation({"operationId":"get_usuario","summary":"Obtener usuario (con su rol anidado)"})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Usuario })
  @RespuestaError(404)
  get_usuario(@Param("id", ParseIntPipe) id: number): Promise<Usuario> {
    return this.servicio.get_usuario(id);
  }

  @Get("usuarios")
  @ApiOperation({"operationId":"get_usuarios","summary":"Listar usuarios"})
  @ApiResponse({ status: 200, description: "OK", type: [Usuario] })
  get_usuarios(): Promise<Usuario[]> {
    return this.servicio.get_usuarios();
  }
}
