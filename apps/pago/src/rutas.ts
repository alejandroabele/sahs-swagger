// Controllers y services del servicio, uno por tag del swagger.
import { PagoController } from './pago/pago.controller';
import { PagoService } from './pago/pago.service';
import { ReciboDeSueldoController } from './recibo-de-sueldo/recibo-de-sueldo.controller';
import { ReciboDeSueldoService } from './recibo-de-sueldo/recibo-de-sueldo.service';

export const CONTROLLERS = [PagoController, ReciboDeSueldoController];
export const SERVICES = [PagoService, ReciboDeSueldoService];
