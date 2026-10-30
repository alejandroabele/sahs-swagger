// Rutas de Área. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Area, Materia, ProfesorResumen } from '../dto/modelos';
import { AsignarMateriaAreaDto, CrearAreaDto } from '../dto/entradas';
import { AreaService } from './area.service';

@ApiTags("Área")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("orientacion")
export class AreaController {
  constructor(private readonly servicio: AreaService) {}

  @Post("areas")
  @ApiOperation({"operationId":"crear_area","summary":"Crear área"})
  @ApiResponse({ status: 201, description: "Creado", type: Area })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_area(@Body() body: CrearAreaDto): Promise<Area> {
    return this.servicio.crear_area(body);
  }

  @Post("areas/:id/materias")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_materia_area","summary":"Asignar una materia al área"})
  @ApiParam({"name":"id","description":"Id del área","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Materia })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_materia_area(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarMateriaAreaDto): Promise<Materia> {
    return this.servicio.asignar_materia_area(id, body);
  }

  @Delete("areas/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_area","summary":"Eliminar área"})
  @ApiParam({"name":"id","description":"Id del área","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminado" })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_area(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_area(id);
  }

  @Delete("areas/:id/materias/:id_materia")
  @ApiOperation({"operationId":"quitar_materia_area","summary":"Quitar una materia del área"})
  @ApiParam({"name":"id","description":"Id del área","type":"integer","format":"int64"})
  @ApiParam({"name":"id_materia","description":"Id de la materia a quitar","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Materia })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  quitar_materia_area(@Param("id", ParseIntPipe) id: number, @Param("id_materia", ParseIntPipe) idMateria: number): Promise<Materia> {
    return this.servicio.quitar_materia_area(id, idMateria);
  }

  @Get("areas/:id")
  @ApiOperation({"operationId":"get_area","summary":"Obtener área (con su coordinador)","description":"Invoca: profesor_suplencias.get_profesor"})
  @ApiParam({"name":"id","description":"Id del área","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Area })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_area(@Param("id", ParseIntPipe) id: number): Promise<Area> {
    return this.servicio.get_area(id);
  }

  @Get("areas")
  @ApiOperation({"operationId":"get_areas","summary":"Listar áreas"})
  @ApiResponse({ status: 200, description: "OK", type: [Area] })
  get_areas(): Promise<Area[]> {
    return this.servicio.get_areas();
  }

  @Get("areas/:id/materias")
  @ApiOperation({"operationId":"get_materias_area","summary":"Materias del área"})
  @ApiParam({"name":"id","description":"Id del área","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [Materia] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_materias_area(@Param("id", ParseIntPipe) id: number): Promise<Materia[]> {
    return this.servicio.get_materias_area(id);
  }

  @Get("areas/:id/profesores")
  @ApiOperation({"operationId":"get_profesores_area","summary":"Profesores del área","description":"Solo profesores activos: los dados de baja no se devuelven.\n\nInvoca: profesor_suplencias.get_profesor"})
  @ApiParam({"name":"id","description":"Id del área","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [ProfesorResumen] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_profesores_area(@Param("id", ParseIntPipe) id: number): Promise<ProfesorResumen[]> {
    return this.servicio.get_profesores_area(id);
  }
}
