// Generado por tools/generar_scaffold.mjs a partir de specs/*.json (corte inicial).
// Desde el corte, este archivo se mantiene a mano junto con los DTOs de cada servicio.

export interface Rol {
  readonly id_rol: number;
  nombre_rol: string;
}

export interface Privilegio {
  readonly id_privilegio: number;
  descripcion_privilegio: string;
}

export interface Usuario {
  readonly id_usuario: number;
  nombre_user: string;
  email: string;
  id_rol: number;
  readonly rol?: Rol;
}

export interface LoginRespuesta {
  token: string;
  usuario: Usuario;
}

/** Body de POST /usuario/login */
export interface LoginBody {
  email: string;
  contrasenia: string;
}

/** Body de POST /usuario/usuarios */
export interface CrearUsuarioBody {
  nombre_user: string;
  email: string;
  contrasenia: string;
  /** Opcional: se puede asignar después con asignar_rol */
  id_rol?: number;
}

/** Body de PUT /usuario/usuarios/{id}/rol */
export interface AsignarRolBody {
  id_rol: number;
}

/** Body de PUT /usuario/usuarios/{id} */
export interface EditarUsuarioBody {
  nombre_user: string;
  email: string;
}

/** Body de PATCH /usuario/usuarios/{id}/contrasenia */
export interface CambiarContraseniaBody {
  contrasenia: string;
}

/** Body de POST /usuario/roles */
export interface CrearRolBody {
  nombre_rol: string;
}

/** Body de POST /usuario/roles/{id}/privilegios */
export interface AsignarPrivilegioBody {
  id_privilegio: number;
}

/** Body de PATCH /usuario/roles/{id} */
export interface CambiarNombreRolBody {
  nombre_rol: string;
}
