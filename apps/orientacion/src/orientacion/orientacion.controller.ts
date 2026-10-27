// Rutas de Orientación. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Materia, Orientacion } from '../dto/modelos';
import { AsignarCursoAOrientacionDto, CrearOrientacionDto } from '../dto/entradas';
import { OrientacionService } from './orientacion.service';

@ApiTags("Orientación")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("orientacion")
export class OrientacionController {
  constructor(private readonly servicio: OrientacionService) {}

  @Post("orientaciones")
  @ApiOperation({"operationId":"crear_orientacion","summary":"Crear orientación"})
  @ApiResponse({ status: 201, description: "Creado", type: Orientacion })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_orientacion(@Body() body: CrearOrientacionDto): Promise<Orientacion> {
    return this.servicio.crear_orientacion(body);
  }

  @Delete("orientaciones/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_orientacion","summary":"Eliminar orientación"})
  @ApiParam({"name":"id","description":"Id de la orientación","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminado" })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_orientacion(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_orientacion(id);
  }

  @Post("orientaciones/:id/cursos")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_curso_a_orientacion","summary":"Asignar un curso a la orientación","description":"Invoca: planificacion.get_curso"})
  @ApiParam({"name":"id","description":"Id de la orientación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Orientacion })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_curso_a_orientacion(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarCursoAOrientacionDto): Promise<Orientacion> {
    return this.servicio.asignar_curso_a_orientacion(id, body);
  }

  @Get("orientaciones/:id")
  @ApiOperation({"operationId":"get_orientacion","summary":"Obtener orientación"})
  @ApiParam({"name":"id","description":"Id de la orientación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Orientacion })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_orientacion(@Param("id", ParseIntPipe) id: number): Promise<Orientacion> {
    return this.servicio.get_orientacion(id);
  }

  @Get("orientaciones")
  @ApiOperation({"operationId":"get_orientaciones","summary":"Listar orientaciones"})
  @ApiResponse({ status: 200, description: "OK", type: [Orientacion] })
  get_orientaciones(): Promise<Orientacion[]> {
    return this.servicio.get_orientaciones();
  }

  @Get("orientaciones/:id/materias")
  @ApiOperation({"operationId":"get_materias_orientacion","summary":"Materias de la orientación"})
  @ApiParam({"name":"id","description":"Id de la orientación","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [Materia] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_materias_orientacion(@Param("id", ParseIntPipe) id: number): Promise<Materia[]> {
    return this.servicio.get_materias_orientacion(id);
  }
}
