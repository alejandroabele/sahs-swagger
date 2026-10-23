// Rutas de Curso. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Clase, Curso } from '../dto/modelos';
import { AsignarMateriaACursoDto, CambiarHorasMateriaCursoDto, CrearCursoDto, GetCursosQuery } from '../dto/entradas';
import { CursoService } from './curso.service';

@ApiTags("Curso")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("planificacion")
export class CursoController {
  constructor(private readonly servicio: CursoService) {}

  @Post("crear_curso")
  @ApiOperation({"operationId":"crear_curso","summary":"Crear curso","description":"El año académico se asigna con asignar_curso_a_anio_academico. La orientación se cambia después desde el servicio Orientación (asignar_curso_a_orientacion).\n\nInvoca: orientacion.get_orientacion"})
  @ApiResponse({ status: 201, description: "Creado", type: Curso })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_curso(@Body() body: CrearCursoDto): Promise<Curso> {
    return this.servicio.crear_curso(body);
  }

  @Post("asignar_materia_a_curso/:id")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_materia_a_curso","summary":"Agregar una materia al plan del curso","description":"Si no se indican las horas, se toman las de la materia.\n\nInvoca: orientacion.get_materia"})
  @ApiParam({"name":"id","description":"Id del curso","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Curso })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_materia_a_curso(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarMateriaACursoDto): Promise<Curso> {
    return this.servicio.asignar_materia_a_curso(id, body);
  }

  @Patch("cambiar_horas_materia_curso/:id")
  @ApiOperation({"operationId":"cambiar_horas_materia_curso","summary":"Cambiar las horas de una materia en el curso","description":"Solo cambia las horas en este curso; la materia no se modifica."})
  @ApiParam({"name":"id","description":"Id del curso","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Curso })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  cambiar_horas_materia_curso(@Param("id", ParseIntPipe) id: number, @Body() body: CambiarHorasMateriaCursoDto): Promise<Curso> {
    return this.servicio.cambiar_horas_materia_curso(id, body);
  }

  @Delete("quitar_materia_curso/:id/:id_materia")
  @ApiOperation({"operationId":"quitar_materia_curso","summary":"Quitar una materia del plan del curso"})
  @ApiParam({"name":"id","description":"Id del curso","type":"integer","format":"int64"})
  @ApiParam({"name":"id_materia","description":"Id de la materia a quitar","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Curso })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  quitar_materia_curso(@Param("id", ParseIntPipe) id: number, @Param("id_materia", ParseIntPipe) idMateria: number): Promise<Curso> {
    return this.servicio.quitar_materia_curso(id, idMateria);
  }

  @Get("get_curso_clases/:id")
  @ApiOperation({"operationId":"get_curso_clases","summary":"Clases del curso","description":"Invoca: orientacion.get_materia"})
  @ApiParam({"name":"id","description":"Id del curso","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [Clase] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_curso_clases(@Param("id", ParseIntPipe) id: number): Promise<Clase[]> {
    return this.servicio.get_curso_clases(id);
  }

  @Get("get_curso/:id")
  @ApiOperation({"operationId":"get_curso","summary":"Obtener curso (turno, orientación, materias y franjas anidados)","description":"Invoca: orientacion.get_materia, orientacion.get_orientacion, horarios.get_franja_horaria, horarios.get_turno"})
  @ApiParam({"name":"id","description":"Id del curso","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Curso })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_curso(@Param("id", ParseIntPipe) id: number): Promise<Curso> {
    return this.servicio.get_curso(id);
  }

  @Get("get_cursos")
  @ApiOperation({"operationId":"get_cursos","summary":"Listar cursos"})
  @ApiResponse({ status: 200, description: "OK", type: [Curso] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_cursos(@Query() query: GetCursosQuery): Promise<Curso[]> {
    return this.servicio.get_cursos(query);
  }
}
