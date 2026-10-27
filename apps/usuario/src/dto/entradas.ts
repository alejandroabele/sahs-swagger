// Bodies y queries de entrada, con validación (class-validator) y swagger.
// Generado una vez por tools/generar_scaffold.mjs; desde entonces se mantiene a mano.
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type * as C from '@sahs/contratos';
/** Body de POST /usuario/login */
export class LoginDto implements C.LoginBody {
  @ApiProperty({"type":"string","format":"email","example":"jramirez@donbosco.edu.ar","required":true})
  @IsString()
  @IsNotEmpty()
  email!: string;
  @ApiProperty({"type":"string","format":"password","example":"secreta123","writeOnly":true,"required":true})
  @IsString()
  @IsNotEmpty()
  contrasenia!: string;
}

/** Body de POST /usuario/usuarios */
export class CrearUsuarioDto implements C.CrearUsuarioBody {
  @ApiProperty({"type":"string","example":"jramirez","required":true})
  @IsString()
  @IsNotEmpty()
  nombre_user!: string;
  @ApiProperty({"type":"string","format":"email","example":"jramirez@donbosco.edu.ar","required":true})
  @IsEmail()
  @IsNotEmpty()
  email!: string;
  @ApiProperty({"type":"string","format":"password","example":"secreta123","writeOnly":true,"required":true})
  @IsString()
  @IsNotEmpty()
  contrasenia!: string;
  @ApiProperty({"type":"integer","format":"int64","description":"Opcional: se puede asignar después con asignar_rol","example":2,"required":false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_rol?: number;
}

/** Body de PUT /usuario/usuarios/{id}/rol */
export class AsignarRolDto implements C.AsignarRolBody {
  @ApiProperty({"type":"integer","format":"int64","example":2,"required":true})
  @Type(() => Number)
  @IsInt()
  id_rol!: number;
}

/** Body de PUT /usuario/usuarios/{id} */
export class EditarUsuarioDto implements C.EditarUsuarioBody {
  @ApiProperty({"type":"string","example":"jramirez","required":true})
  @IsString()
  @IsNotEmpty()
  nombre_user!: string;
  @ApiProperty({"type":"string","format":"email","example":"juan.ramirez@donbosco.edu.ar","required":true})
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

/** Body de PATCH /usuario/usuarios/{id}/contrasenia */
export class CambiarContraseniaDto implements C.CambiarContraseniaBody {
  @ApiProperty({"type":"string","format":"password","example":"secreta123","writeOnly":true,"required":true})
  @IsString()
  @IsNotEmpty()
  contrasenia!: string;
}

/** Body de POST /usuario/roles */
export class CrearRolDto implements C.CrearRolBody {
  @ApiProperty({"type":"string","example":"Administrativo","required":true})
  @IsString()
  @IsNotEmpty()
  nombre_rol!: string;
}

/** Body de POST /usuario/roles/{id}/privilegios */
export class AsignarPrivilegioDto implements C.AsignarPrivilegioBody {
  @ApiProperty({"type":"integer","format":"int64","example":5,"required":true})
  @Type(() => Number)
  @IsInt()
  id_privilegio!: number;
}

/** Body de PATCH /usuario/roles/{id} */
export class CambiarNombreRolDto implements C.CambiarNombreRolBody {
  @ApiProperty({"type":"string","example":"Docente","required":true})
  @IsString()
  @IsNotEmpty()
  nombre_rol!: string;
}
