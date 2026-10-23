// Rutas de Usuario. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Usuario } from '../dto/modelos';
import { AsignarRolDto, CambiarContraseniaDto, CrearUsuarioDto, EditarUsuarioDto } from '../dto/entradas';
import { UsuarioService } from './usuario.service';

@ApiTags("Usuario")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("usuario")
export class UsuarioController {
  constructor(private readonly servicio: UsuarioService) {}

  @Post("crear_usuario")
  @ApiOperation({"operationId":"crear_usuario","summary":"Crear usuario"})
  @ApiResponse({ status: 201, description: "Creado", type: Usuario })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_usuario(@Body() body: CrearUsuarioDto): Promise<Usuario> {
    return this.servicio.crear_usuario(body);
  }

  @Put("asignar_rol/:id")
  @ApiOperation({"operationId":"asignar_rol","summary":"Asignar el rol del usuario (reemplaza el anterior)"})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Usuario })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_rol(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarRolDto): Promise<Usuario> {
    return this.servicio.asignar_rol(id, body);
  }

  @Put("editar_usuario/:id")
  @ApiOperation({"operationId":"editar_usuario","summary":"Editar usuario (nombre de usuario y email)","description":"Reemplaza el nombre de usuario y el email. No cambia la contraseña (`cambiar_contrasenia`) ni el rol (`asignar_rol`)."})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Usuario })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  editar_usuario(@Param("id", ParseIntPipe) id: number, @Body() body: EditarUsuarioDto): Promise<Usuario> {
    return this.servicio.editar_usuario(id, body);
  }

  @Patch("cambiar_contrasenia/:id")
  @ApiOperation({"operationId":"cambiar_contrasenia","summary":"Cambiar contraseña"})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Usuario })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  cambiar_contrasenia(@Param("id", ParseIntPipe) id: number, @Body() body: CambiarContraseniaDto): Promise<Usuario> {
    return this.servicio.cambiar_contrasenia(id, body);
  }

  @Delete("eliminar_usuario/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_usuario","summary":"Eliminar usuario"})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminado" })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_usuario(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_usuario(id);
  }

  @Get("get_usuario/:id")
  @ApiOperation({"operationId":"get_usuario","summary":"Obtener usuario (con su rol anidado)"})
  @ApiParam({"name":"id","description":"Id del usuario","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Usuario })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_usuario(@Param("id", ParseIntPipe) id: number): Promise<Usuario> {
    return this.servicio.get_usuario(id);
  }

  @Get("get_usuarios")
  @ApiOperation({"operationId":"get_usuarios","summary":"Listar usuarios"})
  @ApiResponse({ status: 200, description: "OK", type: [Usuario] })
  get_usuarios(): Promise<Usuario[]> {
    return this.servicio.get_usuarios();
  }
}
