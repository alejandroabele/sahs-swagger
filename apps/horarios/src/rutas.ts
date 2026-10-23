// Controllers y services del servicio, uno por tag del swagger.
import { DiaLectivoController } from './dia-lectivo/dia-lectivo.controller';
import { DiaLectivoService } from './dia-lectivo/dia-lectivo.service';
import { FranjaHorariaController } from './franja-horaria/franja-horaria.controller';
import { FranjaHorariaService } from './franja-horaria/franja-horaria.service';
import { TurnoController } from './turno/turno.controller';
import { TurnoService } from './turno/turno.service';

export const CONTROLLERS = [DiaLectivoController, FranjaHorariaController, TurnoController];
export const SERVICES = [DiaLectivoService, FranjaHorariaService, TurnoService];
