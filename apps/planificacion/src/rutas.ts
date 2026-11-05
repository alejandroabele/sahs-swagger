// Controllers y services del servicio, uno por tag del swagger.
import { PlanificacionController } from './planificacion/planificacion.controller';
import { PlanificacionService } from './planificacion/planificacion.service';
import { EstadoDePlanificacionController } from './estado-de-planificacion/estado-de-planificacion.controller';
import { EstadoDePlanificacionService } from './estado-de-planificacion/estado-de-planificacion.service';
import { CicloLectivoController } from './ciclo-lectivo/ciclo-lectivo.controller';
import { CicloLectivoService } from './ciclo-lectivo/ciclo-lectivo.service';
import { CursoController } from './curso/curso.controller';
import { CursoService } from './curso/curso.service';
import { ClaseController } from './clase/clase.controller';
import { ClaseService } from './clase/clase.service';
import { AnioAcademicoController } from './anio-academico/anio-academico.controller';
import { AnioAcademicoService } from './anio-academico/anio-academico.service';

// EstadoDePlanificacionController va antes: GET /planificaciones/estados tiene que ganarle a GET /planificaciones/:id.
export const CONTROLLERS = [EstadoDePlanificacionController, PlanificacionController, CicloLectivoController, CursoController, ClaseController, AnioAcademicoController];
export const SERVICES = [PlanificacionService, EstadoDePlanificacionService, CicloLectivoService, CursoService, ClaseService, AnioAcademicoService];
