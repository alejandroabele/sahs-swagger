import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

/** Privilegios del sistema. Se cargan por configuración (seeds): no hay commands para crearlos. */
@Entity('usuario_privilegio')
export class PrivilegioEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_privilegio!: number;

  @Column({ type: 'varchar', length: 120 })
  descripcion_privilegio!: string;
}

@Entity('usuario_rol')
export class RolEntidad {
  @PrimaryGeneratedColumn()
  id_rol!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  nombre_rol!: string;

  @ManyToMany(() => PrivilegioEntidad)
  @JoinTable({
    name: 'usuario_rol_privilegio',
    joinColumn: { name: 'id_rol', referencedColumnName: 'id_rol' },
    inverseJoinColumn: { name: 'id_privilegio', referencedColumnName: 'id_privilegio' },
  })
  privilegios!: PrivilegioEntidad[];
}

@Entity('usuario_usuario')
export class UsuarioEntidad {
  @PrimaryGeneratedColumn()
  id_usuario!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  nombre_user!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  email!: string;

  /** Hash bcrypt. Nunca se devuelve en las respuestas. */
  @Column({ type: 'varchar', length: 100, select: false })
  contrasenia!: string;

  @Column({ type: 'integer', nullable: true })
  id_rol!: number | null;

  @ManyToOne(() => RolEntidad, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'id_rol' })
  rol?: RolEntidad | null;
}

export const ENTIDADES_USUARIO = [PrivilegioEntidad, RolEntidad, UsuarioEntidad];
