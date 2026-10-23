// Rutas de Rol. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Privilegio, Rol } from '../dto/modelos';
import { AsignarPrivilegioDto, CambiarNombreRolDto, CrearRolDto } from '../dto/entradas';
import { RolService } from './rol.service';

@ApiTags("Rol")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("usuario")
export class RolController {
  constructor(private readonly servicio: RolService) {}

  @Post("crear_rol")
  @ApiOperation({"operationId":"crear_rol","summary":"Crear rol"})
  @ApiResponse({ status: 201, description: "Creado", type: Rol })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_rol(@Body() body: CrearRolDto): Promise<Rol> {
    return this.servicio.crear_rol(body);
  }

  @Post("asignar_privilegio/:id")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_privilegio","summary":"Asignar un privilegio al rol"})
  @ApiParam({"name":"id","description":"Id del rol","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Rol })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_privilegio(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarPrivilegioDto): Promise<Rol> {
    return this.servicio.asignar_privilegio(id, body);
  }

  @Delete("quitar_privilegio/:id/:id_privilegio")
  @ApiOperation({"operationId":"quitar_privilegio","summary":"Quitar un privilegio del rol"})
  @ApiParam({"name":"id","description":"Id del rol","type":"integer","format":"int64"})
  @ApiParam({"name":"id_privilegio","description":"Id del privilegio a quitar","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Rol })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  quitar_privilegio(@Param("id", ParseIntPipe) id: number, @Param("id_privilegio", ParseIntPipe) idPrivilegio: number): Promise<Rol> {
    return this.servicio.quitar_privilegio(id, idPrivilegio);
  }

  @Delete("eliminar_rol/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_rol","summary":"Eliminar rol"})
  @ApiParam({"name":"id","description":"Id del rol","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminado" })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_rol(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_rol(id);
  }

  @Patch("cambiar_nombre_rol/:id")
  @ApiOperation({"operationId":"cambiar_nombre_rol","summary":"Cambiar nombre del rol"})
  @ApiParam({"name":"id","description":"Id del rol","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Rol })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  cambiar_nombre_rol(@Param("id", ParseIntPipe) id: number, @Body() body: CambiarNombreRolDto): Promise<Rol> {
    return this.servicio.cambiar_nombre_rol(id, body);
  }

  @Get("get_roles")
  @ApiOperation({"operationId":"get_roles","summary":"Listar roles"})
  @ApiResponse({ status: 200, description: "OK", type: [Rol] })
  get_roles(): Promise<Rol[]> {
    return this.servicio.get_roles();
  }

  @Get("get_rol_privilegios/:id")
  @ApiOperation({"operationId":"get_rol_privilegios","summary":"Privilegios del rol"})
  @ApiParam({"name":"id","description":"Id del rol","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [Privilegio] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_rol_privilegios(@Param("id", ParseIntPipe) id: number): Promise<Privilegio[]> {
    return this.servicio.get_rol_privilegios(id);
  }
}
