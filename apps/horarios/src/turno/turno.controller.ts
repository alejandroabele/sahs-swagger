// Rutas de Turno. Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorApi } from '@sahs/comun';
import { Turno } from '../dto/modelos';
import { AsignarFranjaATurnoDto, CrearTurnoDto } from '../dto/entradas';
import { TurnoService } from './turno.service';

@ApiTags("Turno")
@ApiResponse({ status: 409, description: 'Conflicto con una regla de negocio', type: ErrorApi })
@ApiResponse({ status: 503, description: 'Otro servicio no responde', type: ErrorApi })
@Controller("horarios")
export class TurnoController {
  constructor(private readonly servicio: TurnoService) {}

  @Post("turnos")
  @ApiOperation({"operationId":"crear_turno","summary":"Crear turno"})
  @ApiResponse({ status: 201, description: "Creado", type: Turno })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  crear_turno(@Body() body: CrearTurnoDto): Promise<Turno> {
    return this.servicio.crear_turno(body);
  }

  @Delete("turnos/:id")
  @HttpCode(204)
  @ApiOperation({"operationId":"eliminar_turno","summary":"Eliminar turno"})
  @ApiParam({"name":"id","description":"Id del turno","type":"integer","format":"int64"})
  @ApiResponse({ status: 204, description: "Eliminado" })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_turno(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.servicio.eliminar_turno(id);
  }

  @Post("turnos/:id/franjas-horarias")
  @HttpCode(200)
  @ApiOperation({"operationId":"asignar_franja_a_turno","summary":"Asignar franja horaria al turno"})
  @ApiParam({"name":"id","description":"Id del turno","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Turno })
  @ApiResponse({ status: 400, description: 'Datos inválidos', type: ErrorApi })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  asignar_franja_a_turno(@Param("id", ParseIntPipe) id: number, @Body() body: AsignarFranjaATurnoDto): Promise<Turno> {
    return this.servicio.asignar_franja_a_turno(id, body);
  }

  @Delete("turnos/:id/franjas-horarias/:id_franja_horaria")
  @ApiOperation({"operationId":"eliminar_franja_horaria_turno","summary":"Quitar franja horaria del turno"})
  @ApiParam({"name":"id","description":"Id del turno","type":"integer","format":"int64"})
  @ApiParam({"name":"id_franja_horaria","description":"Id de la franja horaria a quitar","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Turno })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  eliminar_franja_horaria_turno(@Param("id", ParseIntPipe) id: number, @Param("id_franja_horaria", ParseIntPipe) idFranjaHoraria: number): Promise<Turno> {
    return this.servicio.eliminar_franja_horaria_turno(id, idFranjaHoraria);
  }

  @Get("turnos/:id")
  @ApiOperation({"operationId":"get_turno","summary":"Obtener turno (con sus franjas)"})
  @ApiParam({"name":"id","description":"Id del turno","type":"integer","format":"int64"})
  @ApiResponse({ status: 200, description: "OK", type: Turno })
  @ApiResponse({ status: 404, description: 'No existe el recurso', type: ErrorApi })
  get_turno(@Param("id", ParseIntPipe) id: number): Promise<Turno> {
    return this.servicio.get_turno(id);
  }

  @Get("turnos")
  @ApiOperation({"operationId":"get_turnos","summary":"Listar turnos"})
  @ApiResponse({ status: 200, description: "OK", type: [Turno] })
  get_turnos(): Promise<Turno[]> {
    return this.servicio.get_turnos();
  }
}
