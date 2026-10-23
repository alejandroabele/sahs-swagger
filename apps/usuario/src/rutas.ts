// Controllers y services del servicio, uno por tag del swagger.
import { AccesoController } from './acceso/acceso.controller';
import { AccesoService } from './acceso/acceso.service';
import { UsuarioController } from './usuario/usuario.controller';
import { UsuarioService } from './usuario/usuario.service';
import { RolController } from './rol/rol.controller';
import { RolService } from './rol/rol.service';
import { PrivilegioController } from './privilegio/privilegio.controller';
import { PrivilegioService } from './privilegio/privilegio.service';

export const CONTROLLERS = [AccesoController, UsuarioController, RolController, PrivilegioController];
export const SERVICES = [AccesoService, UsuarioService, RolService, PrivilegioService];
