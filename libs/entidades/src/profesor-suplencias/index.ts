import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('profesor_profesor')
export class ProfesorEntidad {
  @PrimaryGeneratedColumn()
  id_profesor!: number;

  @Column({ type: 'varchar', length: 80 })
  nombre!: string;

  @Column({ type: 'varchar', length: 80 })
  apellido!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  documento!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  legajo!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  cargo_asociado!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  correo_electronico!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  telefono!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  direccion!: string | null;

  /** Referencia a Usuario (sin FK). Un usuario es de un solo profesor. */
  @Index({ unique: true, where: 'id_usuario IS NOT NULL' })
  @Column({ type: 'integer', nullable: true })
  id_usuario!: number | null;

  /** false = dado de baja en la institución (baja lógica). */
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @OneToMany(() => ProfesorMateriaEntidad, (m) => m.profesor)
  materias?: ProfesorMateriaEntidad[];

  @OneToMany(() => ProfesorDisponibilidadEntidad, (d) => d.profesor)
  disponibilidad?: ProfesorDisponibilidadEntidad[];
}

/** Materias habilitadas del profesor. id_materia referencia a Orientación (sin FK). */
@Entity('profesor_materia_habilitada')
export class ProfesorMateriaEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_profesor!: number;

  @PrimaryColumn({ type: 'integer' })
  id_materia!: number;

  @ManyToOne(() => ProfesorEntidad, (p) => p.materias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_profesor' })
  profesor?: ProfesorEntidad;
}

/** Franjas en las que el profesor puede dar clase. id_franja_horaria referencia a Horarios (sin FK). */
@Entity('profesor_disponibilidad')
export class ProfesorDisponibilidadEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_profesor!: number;

  @PrimaryColumn({ type: 'integer' })
  id_franja_horaria!: number;

  @ManyToOne(() => ProfesorEntidad, (p) => p.disponibilidad, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_profesor' })
  profesor?: ProfesorEntidad;
}

@Entity('profesor_suplencia')
export class SuplenciaEntidad {
  @PrimaryGeneratedColumn()
  id_suplencia!: number;

  @Column({ type: 'varchar', length: 10 })
  fecha_inicio!: string;

  @Column({ type: 'varchar', length: 10 })
  fecha_fin!: string;

  @Column({ type: 'varchar', length: 300 })
  motivo!: string;

  /** Profesor suplente. */
  @Column({ type: 'integer' })
  id_profesor!: number;

  @ManyToOne(() => ProfesorEntidad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_profesor' })
  profesor?: ProfesorEntidad;

  @OneToMany(() => SuplenciaClaseEntidad, (c) => c.suplencia)
  clases?: SuplenciaClaseEntidad[];
}

/** Clases que cubre la suplencia. id_clase referencia a Planificación (sin FK). */
@Entity('profesor_suplencia_clase')
export class SuplenciaClaseEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_suplencia!: number;

  @Index()
  @PrimaryColumn({ type: 'integer' })
  id_clase!: number;

  @ManyToOne(() => SuplenciaEntidad, (s) => s.clases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_suplencia' })
  suplencia?: SuplenciaEntidad;
}

export const ENTIDADES_PROFESOR_SUPLENCIAS = [
  ProfesorEntidad,
  ProfesorMateriaEntidad,
  ProfesorDisponibilidadEntidad,
  SuplenciaEntidad,
  SuplenciaClaseEntidad,
];
