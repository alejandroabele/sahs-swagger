// Rutas de Año académico. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { AnioAcademico, Curso } from '../dto/modelos';
import { AsignarCursoAAnioAcademicoDto, CrearAnioAcademicoDto } from '../dto/entradas';
import { AnioAcademicoService } from './anio-academico.service';

@ApiTags("Año académico")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("planificacion")
export class AnioAcademicoController {
  constructor(private readonly servicio: AnioAcademicoService) {}

  @Post("anios-academicos")
  @ApiOperation({"operationId":"crear_anio_academico","summary":"Crear año académico"})
  @ApiResponse({ status: 201, description: "Creado", type: AnioAcademico })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_anio_academico(@Body() body: CrearAnioAcademicoDto): Promise<AnioAcademico> {
    return this.servicio.crear_anio_academico(body);
  }

  @Post("anios-academicos/:id/cursos")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_curso_a_anio_academico","summary":"Asignar un curso al año académico"})
  @ApiParam({"name":"id","description":"Id del año académico","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Curso })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_curso_a_anio_academico(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarCursoAAnioAcademicoDto): Promise<Curso> {
    return this.servicio.asignar_curso_a_anio_academico(id, body);
  }

  @Get("anios-academicos/:id")
  @ApiOperation({"operationId":"get_anio_academico","summary":"Obtener año académico"})
  @ApiParam({"name":"id","description":"Id del año académico","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: AnioAcademico })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_anio_academico(@Param("id", ParseIntPipe) id: number): Promise<AnioAcademico> {
    return this.servicio.get_anio_academico(id);
  }

  @Get("anios-academicos")
  @ApiOperation({"operationId":"get_anios_academicos","summary":"Listar años académicos"})
  @ApiResponse({ status: 200, description: "OK", type: [AnioAcademico] })
  get_anios_academicos(): Promise<AnioAcademico[]> {
    return this.servicio.get_anios_academicos();
  }

  @Get("anios-academicos/:id/cursos")
  @ApiOperation({"operationId":"get_cursos_anio_academico","summary":"Cursos del año académico"})
  @ApiParam({"name":"id","description":"Id del año académico","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [Curso] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_cursos_anio_academico(@Param("id", ParseIntPipe) id: number): Promise<Curso[]> {
    return this.servicio.get_cursos_anio_academico(id);
  }
}
