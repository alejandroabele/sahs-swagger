import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('planificacion_estado_planificacion')
export class EstadoPlanificacionEntidad {
  @PrimaryGeneratedColumn()
  id_estado!: number;

  @Column({ type: 'varchar', length: 60 })
  nombre!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10 })
  codigo!: string;
}

@Entity('planificacion_ciclo_lectivo')
export class CicloLectivoEntidad {
  @PrimaryGeneratedColumn()
  id_ciclo_lectivo!: number;

  @Index({ unique: true })
  @Column({ type: 'integer' })
  anio_calendario!: number;
}

@Entity('planificacion_anio_academico')
export class AnioAcademicoEntidad {
  @PrimaryGeneratedColumn()
  id_anio_academico!: number;

  @Column({ type: 'varchar', length: 40 })
  anio_curricular!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10 })
  codigo!: string;
}

@Entity('planificacion_planificacion')
export class PlanificacionEntidad {
  @PrimaryGeneratedColumn()
  id_planificacion!: number;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  descripcion_planificacion!: string | null;

  @Column({ type: 'varchar', length: 30 })
  fecha_creacion!: string;

  @Column({ type: 'varchar', length: 30 })
  fecha_modificacion!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  codigo!: string;

  @Column({ type: 'integer' })
  id_ciclo_lectivo!: number;

  @ManyToOne(() => CicloLectivoEntidad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_ciclo_lectivo' })
  ciclo_lectivo?: CicloLectivoEntidad;

  @Column({ type: 'integer' })
  id_estado!: number;

  @ManyToOne(() => EstadoPlanificacionEntidad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_estado' })
  estado?: EstadoPlanificacionEntidad;

  @OneToMany(() => PlanificacionClaseEntidad, (c) => c.planificacion)
  clases?: PlanificacionClaseEntidad[];
}

/**
 * Curso. La orientación del curso la guarda el servicio Orientación
 * (orientacion_curso); acá solo se guarda el turno (referencia a Horarios, sin FK).
 */
@Entity('planificacion_curso')
export class CursoEntidad {
  @PrimaryGeneratedColumn()
  id_curso!: number;

  @Column({ type: 'varchar', length: 10 })
  division!: string;

  @Column({ type: 'integer', nullable: true })
  id_anio_academico!: number | null;

  @ManyToOne(() => AnioAcademicoEntidad, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'id_anio_academico' })
  anio_academico?: AnioAcademicoEntidad | null;

  @Column({ type: 'integer' })
  id_ciclo_lectivo!: number;

  @ManyToOne(() => CicloLectivoEntidad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_ciclo_lectivo' })
  ciclo_lectivo?: CicloLectivoEntidad;

  @Index()
  @Column({ type: 'integer' })
  id_turno!: number;

  @OneToMany(() => MateriaCursoEntidad, (m) => m.curso)
  materias?: MateriaCursoEntidad[];
}

/** Materias que dicta cada curso y sus horas. id_materia referencia a Orientación (sin FK). */
@Entity('planificacion_materia_curso')
export class MateriaCursoEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_curso!: number;

  @PrimaryColumn({ type: 'integer' })
  id_materia!: number;

  @Column({ type: 'integer' })
  horas_semanales!: number;

  @ManyToOne(() => CursoEntidad, (c) => c.materias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_curso' })
  curso?: CursoEntidad;
}

/** Clase: una materia en un curso, con sus franjas y sus docentes (los mismos en todas las franjas). */
@Entity('planificacion_clase')
export class ClaseEntidad {
  @PrimaryGeneratedColumn()
  id_clase!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  descripcion!: string | null;

  @Column({ type: 'varchar', length: 40 })
  codigo!: string;

  @Column({ type: 'integer' })
  id_curso!: number;

  @ManyToOne(() => CursoEntidad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_curso' })
  curso?: CursoEntidad;

  /** Referencia a Orientación (sin FK). */
  @Index()
  @Column({ type: 'integer' })
  id_materia!: number;

  @OneToMany(() => ClaseFranjaEntidad, (f) => f.clase, { cascade: true })
  franjas?: ClaseFranjaEntidad[];

  @OneToMany(() => ClaseProfesorEntidad, (p) => p.clase, { cascade: true })
  profesores?: ClaseProfesorEntidad[];

  @OneToMany(() => PlanificacionClaseEntidad, (p) => p.clase)
  planificaciones?: PlanificacionClaseEntidad[];
}

/** Franjas de una clase. id_franja_horaria referencia a Horarios (sin FK). */
@Entity('planificacion_clase_franja')
export class ClaseFranjaEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_clase!: number;

  @Index()
  @PrimaryColumn({ type: 'integer' })
  id_franja_horaria!: number;

  @ManyToOne(() => ClaseEntidad, (c) => c.franjas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_clase' })
  clase?: ClaseEntidad;
}

/** Docentes de una clase. id_profesor referencia a Profesor y Suplencias (sin FK). */
@Entity('planificacion_clase_profesor')
export class ClaseProfesorEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_clase!: number;

  @Index()
  @PrimaryColumn({ type: 'integer' })
  id_profesor!: number;

  @ManyToOne(() => ClaseEntidad, (c) => c.profesores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_clase' })
  clase?: ClaseEntidad;
}

/** Clases de cada planificación (ids_clases). */
@Entity('planificacion_planificacion_clase')
export class PlanificacionClaseEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_planificacion!: number;

  @Index()
  @PrimaryColumn({ type: 'integer' })
  id_clase!: number;

  @ManyToOne(() => PlanificacionEntidad, (p) => p.clases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_planificacion' })
  planificacion?: PlanificacionEntidad;

  @ManyToOne(() => ClaseEntidad, (c) => c.planificaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_clase' })
  clase?: ClaseEntidad;
}

export const ENTIDADES_PLANIFICACION = [
  EstadoPlanificacionEntidad,
  CicloLectivoEntidad,
  AnioAcademicoEntidad,
  PlanificacionEntidad,
  CursoEntidad,
  MateriaCursoEntidad,
  ClaseEntidad,
  ClaseFranjaEntidad,
  ClaseProfesorEntidad,
  PlanificacionClaseEntidad,
];
