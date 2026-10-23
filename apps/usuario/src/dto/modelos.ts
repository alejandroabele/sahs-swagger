// Modelos de respuesta del servicio (schemas del swagger).
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import type * as C from '@sahs/contratos';
@ApiSchema({ name: "Rol" })
export class Rol implements C.Rol {
  @ApiProperty({"type":"integer","format":"int64","example":2,"readOnly":true,"required":true})
  id_rol!: number;
  @ApiProperty({"type":"string","example":"Profesor","required":true})
  nombre_rol!: string;
}

@ApiSchema({ name: "Privilegio" })
export class Privilegio implements C.Privilegio {
  @ApiProperty({"type":"integer","format":"int64","example":5,"readOnly":true,"required":true})
  id_privilegio!: number;
  @ApiProperty({"type":"string","example":"Firmar recibos de sueldo","required":true})
  descripcion_privilegio!: string;
}

@ApiSchema({ name: "Usuario" })
export class Usuario implements C.Usuario {
  @ApiProperty({"type":"integer","format":"int64","example":10,"readOnly":true,"required":true})
  id_usuario!: number;
  @ApiProperty({"type":"string","example":"jramirez","required":true})
  nombre_user!: string;
  @ApiProperty({"type":"string","format":"email","example":"jramirez@donbosco.edu.ar","required":true})
  email!: string;
  @ApiProperty({"type":"integer","format":"int64","example":2,"required":true})
  id_rol!: number;
  @ApiProperty({ type: () => Rol,"readOnly":true,"required":false})
  rol?: Rol;
}

@ApiSchema({ name: "LoginRespuesta" })
export class LoginRespuesta implements C.LoginRespuesta {
  @ApiProperty({"type":"string","example":"eyJhbGciOiJIUzI1NiJ9...","required":true})
  token!: string;
  @ApiProperty({ type: () => Usuario,"required":true})
  usuario!: Usuario;
}
