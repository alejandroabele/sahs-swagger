// Controllers y services del servicio, uno por tag del swagger.
import { PropuestaController } from './propuesta/propuesta.controller';
import { PropuestaService } from './propuesta/propuesta.service';
import { EstadoDePropuestaController } from './estado-de-propuesta/estado-de-propuesta.controller';
import { EstadoDePropuestaService } from './estado-de-propuesta/estado-de-propuesta.service';
import { CicloLectivoController } from './ciclo-lectivo/ciclo-lectivo.controller';
import { CicloLectivoService } from './ciclo-lectivo/ciclo-lectivo.service';
import { CursoController } from './curso/curso.controller';
import { CursoService } from './curso/curso.service';
import { ClaseController } from './clase/clase.controller';
import { ClaseService } from './clase/clase.service';
import { AnioAcademicoController } from './anio-academico/anio-academico.controller';
import { AnioAcademicoService } from './anio-academico/anio-academico.service';

export const CONTROLLERS = [PropuestaController, EstadoDePropuestaController, CicloLectivoController, CursoController, ClaseController, AnioAcademicoController];
export const SERVICES = [PropuestaService, EstadoDePropuestaService, CicloLectivoService, CursoService, ClaseService, AnioAcademicoService];
