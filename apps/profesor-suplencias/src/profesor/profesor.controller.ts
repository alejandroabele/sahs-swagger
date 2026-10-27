// Rutas de Profesor. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { FranjaHorariaResumen, Profesor } from '../dto/modelos';
import { AsignarDisponibilidadDto, AsignarMateriasHabilitadasDto, AsignarUsuarioProfesorDto, CrearProfesorDto, EditarProfesorDto, GetProfesoresQuery } from '../dto/entradas';
import { ProfesorService } from './profesor.service';

@ApiTags("Profesor")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("profesor-suplencias")
export class ProfesorController {
  constructor(private readonly servicio: ProfesorService) {}

  @Post("profesores")
  @ApiOperation({"operationId":"crear_profesor","summary":"Crear profesor","description":"No crea el usuario: se asigna después con `asignar_usuario_profesor`."})
  @ApiResponse({ status: 201, description: "Creado", type: Profesor })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_profesor(@Body() body: CrearProfesorDto): Promise<Profesor> {
    return this.servicio.crear_profesor(body);
  }

  @Put("profesores/:id")
  @ApiOperation({"operationId":"editar_profesor","summary":"Editar los datos del profesor","description":"Reemplaza todos los datos editables del profesor. `null` en `legajo` o `cargo_asociado` lo deja sin legajo o sin cargo."})
  @ApiParam({"name":"id","description":"Id del profesor","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Profesor })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  editar_profesor(@Param("id", ParseIntPipe) id: number, @Body() body: EditarProfesorDto): Promise<Profesor> {
    return this.servicio.editar_profesor(id, body);
  }

  @Put("profesores/:id/usuario")
  @ApiOperation({"operationId":"asignar_usuario_profesor","summary":"Asignar el usuario del profesor (reemplaza el anterior)","description":"Invoca: usuario.get_usuario"})
  @ApiParam({"name":"id","description":"Id del profesor","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Profesor })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_usuario_profesor(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarUsuarioProfesorDto): Promise<Profesor> {
    return this.servicio.asignar_usuario_profesor(id, body);
  }

  @Put("profesores/:id/materias-habilitadas")
  @ApiOperation({"operationId":"asignar_materias_habilitadas","summary":"Asignar materias que puede dictar","description":"Invoca: orientacion.get_materia"})
  @ApiParam({"name":"id","description":"Id del profesor","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Profesor })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_materias_habilitadas(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarMateriasHabilitadasDto): Promise<Profesor> {
    return this.servicio.asignar_materias_habilitadas(id, body);
  }

  @Put("profesores/:id/disponibilidad")
  @ApiOperation({"operationId":"asignar_disponibilidad","summary":"Asignar disponibilidad horaria","description":"Reemplaza la disponibilidad del profesor por las franjas indicadas.\n\nInvoca: horarios.get_franja_horaria"})
  @ApiParam({"name":"id","description":"Id del profesor","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Profesor })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_disponibilidad(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarDisponibilidadDto): Promise<Profesor> {
    return this.servicio.asignar_disponibilidad(id, body);
  }

  @Get("profesores/:id")
  @ApiOperation({"operationId":"get_profesor","summary":"Obtener profesor","description":"Invoca: orientacion.get_materia"})
  @ApiParam({"name":"id","description":"Id del profesor","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Profesor })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_profesor(@Param("id", ParseIntPipe) id: number): Promise<Profesor> {
    return this.servicio.get_profesor(id);
  }

  @Get("profesores")
  @ApiOperation({"operationId":"get_profesores","summary":"Listar profesores","description":"Con `id_usuario` se obtiene el profesor del usuario que inició sesión."})
  @ApiResponse({ status: 200, description: "OK", type: [Profesor] })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  get_profesores(@Query() query: GetProfesoresQuery): Promise<Profesor[]> {
    return this.servicio.get_profesores(query);
  }

  @Get("profesores/:id/disponibilidad")
  @ApiOperation({"operationId":"get_disponibilidad_profesor","summary":"Disponibilidad horaria del profesor","description":"Invoca: horarios.get_franja_horaria"})
  @ApiParam({"name":"id","description":"Id del profesor","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: [FranjaHorariaResumen] })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_disponibilidad_profesor(@Param("id", ParseIntPipe) id: number): Promise<FranjaHorariaResumen[]> {
    return this.servicio.get_disponibilidad_profesor(id);
  }
}
