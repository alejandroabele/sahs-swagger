// Rutas de Clase. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Clase } from '../dto/modelos';
import { AsignarCursoAClaseDto, CrearClaseDto, EditarClaseDto, GetClasesQuery } from '../dto/entradas';
import { ClaseService } from './clase.service';

@ApiTags("Clase")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("planificacion")
export class ClaseController {
  constructor(private readonly servicio: ClaseService) {}

  @Post("clases")
  @ApiOperation({"operationId":"crear_clase","summary":"Crear clase","description":"Verifica que los profesores estén disponibles en las franjas indicadas.\n\nInvoca: profesor_suplencias.get_disponibilidad_profesor"})
  @ApiResponse({ status: 201, description: "Creado", type: Clase })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_clase(@Body() body: CrearClaseDto): Promise<Clase> {
    return this.servicio.crear_clase(body);
  }

  @Put("clases/:id/curso")
  @ApiOperation({"operationId":"asignar_curso_a_clase","summary":"Asignar curso a la clase"})
  @ApiParam({"name":"id","description":"Id de la clase","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Clase })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_curso_a_clase(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarCursoAClaseDto): Promise<Clase> {
    return this.servicio.asignar_curso_a_clase(id, body);
  }

  @Get("clases/:id")
  @ApiOperation({"operationId":"get_clase","summary":"Obtener clase (materia, franjas, profesores y suplencia anidados)","description":"La suplencia vigente se obtiene con `get_suplencias?id_clase=<id>` y la fecha del día: la referencia entre suplencia y clase la guarda la suplencia.\n\nInvoca: orientacion.get_materia, horarios.get_franja_horaria, profesor_suplencias.get_profesor, profesor_suplencias.get_suplencias"})
  @ApiParam({"name":"id","description":"Id de la clase","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Clase })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_clase(@Param("id", ParseIntPipe) id: number): Promise<Clase> {
    return this.servicio.get_clase(id);
  }

  @Get("clases")
  @ApiOperation({"operationId":"get_clases","summary":"Listar clases","description":"Con `id_profesor` e `id_propuesta` se arma la grilla de un profesor.\n\nInvoca: orientacion.get_materia"})
  @ApiResponse({ status: 200, description: "OK", type: [Clase] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_clases(@Query() query: GetClasesQuery): Promise<Clase[]> {
    return this.servicio.get_clases(query);
  }

  @Put("clases/:id")
  @ApiOperation({"operationId":"editar_clase","summary":"Editar las franjas y los docentes de la clase","description":"Agregado (no está en el documento). Reemplaza las franjas y los docentes. Solo si todas las propuestas que incluyen la clase están en Borrador; controla disponibilidad, recreos y choques.\n\nInvoca: profesor_suplencias.get_disponibilidad_profesor"})
  @ApiParam({"name":"id","description":"Id de la clase","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Clase })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  editar_clase(@Param("id", ParseIntPipe) id: number, @Body() body: EditarClaseDto): Promise<Clase> {
    return this.servicio.editar_clase(id, body);
  }

  @Delete("clases/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_clase","summary":"Eliminar clase","description":"Agregado (no está en el documento). Solo si todas las propuestas que incluyen la clase están en Borrador."})
  @ApiParam({"name":"id","description":"Id de la clase","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminada" })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_clase(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_clase(id);
  }
}
