// Controllers y services del servicio, uno por tag del swagger.
import { SuplenciaController } from './suplencia/suplencia.controller';
import { SuplenciaService } from './suplencia/suplencia.service';
import { ProfesorController } from './profesor/profesor.controller';
import { ProfesorService } from './profesor/profesor.service';

export const CONTROLLERS = [SuplenciaController, ProfesorController];
export const SERVICES = [SuplenciaService, ProfesorService];
