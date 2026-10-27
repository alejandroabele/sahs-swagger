// Rutas de Materia. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Materia, PlanDeEstudiosAnio, ProfesorResumen } from '../dto/modelos';
import { AsignarAnioAcademicoAMateriaDto, AsignarClaseAMateriaDto, AsignarMateriaOrientacionDto, CrearMateriaDto, GetPlanDeEstudiosQuery } from '../dto/entradas';
import { MateriaService } from './materia.service';

@ApiTags("Materia")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("orientacion")
export class MateriaController {
  constructor(private readonly servicio: MateriaService) {}

  @Get("plan-de-estudios")
  @ApiOperation({"operationId":"get_plan_de_estudios","summary":"Plan de estudios: año académico → orientación → materias","description":"El plan armado en tres niveles, para no cruzar en el cliente las materias con los años. Solo trae los años y orientaciones que tienen materias; con `id_orientacion`, esa orientación aparece en todos los años, aunque no tenga materias.\n\nInvoca: planificacion.get_anios_academicos"})
  @ApiResponse({ status: 200, description: "OK", type: [PlanDeEstudiosAnio] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_plan_de_estudios(@Query() query: GetPlanDeEstudiosQuery): Promise<PlanDeEstudiosAnio[]> {
    return this.servicio.get_plan_de_estudios(query);
  }

  @Post("materias")
  @ApiOperation({"operationId":"crear_materia","summary":"Crear materia"})
  @ApiResponse({ status: 201, description: "Creado", type: Materia })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_materia(@Body() body: CrearMateriaDto): Promise<Materia> {
    return this.servicio.crear_materia(body);
  }

  @Delete("materias/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_materia","summary":"Eliminar materia"})
  @ApiParam({"name":"id","description":"Id de la materia","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminado" })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_materia(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_materia(id);
  }

  @Put("materias/:id/orientacion")
  @ApiOperation({"operationId":"asignar_materia_orientacion","summary":"Asignar la orientación de la materia (reemplaza la anterior)"})
  @ApiParam({"name":"id","description":"Id de la materia","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Materia })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_materia_orientacion(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarMateriaOrientacionDto): Promise<Materia> {
    return this.servicio.asignar_materia_orientacion(id, body);
  }

  @Post("materias/:id/clases")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_clase_a_materia","summary":"Asignar una clase a la materia","description":"Invoca: planificacion.get_clase"})
  @ApiParam({"name":"id","description":"Id de la materia","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Materia })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_clase_a_materia(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarClaseAMateriaDto): Promise<Materia> {
    return this.servicio.asignar_clase_a_materia(id, body);
  }

  @Put("materias/:id/anio-academico")
  @ApiOperation({"operationId":"asignar_anio_academico_a_materia","summary":"Asignar el año académico de la materia","description":"Invoca: planificacion.get_anio_academico"})
  @ApiParam({"name":"id","description":"Id de la materia","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Materia })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_anio_academico_a_materia(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarAnioAcademicoAMateriaDto): Promise<Materia> {
    return this.servicio.asignar_anio_academico_a_materia(id, body);
  }

  @Get("materias/:id")
  @ApiOperation({"operationId":"get_materia","summary":"Obtener materia (área y orientación anidadas)"})
  @ApiParam({"name":"id","description":"Id de la materia","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Materia })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_materia(@Param("id", ParseIntPipe) id: number): Promise<Materia> {
    return this.servicio.get_materia(id);
  }

  @Get("materias")
  @ApiOperation({"operationId":"get_materias","summary":"Listar materias"})
  @ApiResponse({ status: 200, description: "OK", type: [Materia] })
  get_materias(): Promise<Materia[]> {
    return this.servicio.get_materias();
  }

  @Get("materias/:id/profesores")
  @ApiOperation({"operationId":"get_profesores_materia","summary":"Profesores habilitados para la materia","description":"Invoca: profesor_suplencias.get_profesor"})
  @ApiParam({"name":"id","description":"Id de la materia","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [ProfesorResumen] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_profesores_materia(@Param("id", ParseIntPipe) id: number): Promise<ProfesorResumen[]> {
    return this.servicio.get_profesores_materia(id);
  }
}
