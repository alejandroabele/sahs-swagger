// Controllers y services del servicio, uno por tag del swagger.
import { MateriaController } from './materia/materia.controller';
import { MateriaService } from './materia/materia.service';
import { AreaController } from './area/area.controller';
import { AreaService } from './area/area.service';
import { OrientacionController } from './orientacion/orientacion.controller';
import { OrientacionService } from './orientacion/orientacion.service';

export const CONTROLLERS = [MateriaController, AreaController, OrientacionController];
export const SERVICES = [MateriaService, AreaService, OrientacionService];
