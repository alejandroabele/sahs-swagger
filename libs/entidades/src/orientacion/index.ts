import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('orientacion_orientacion')
export class OrientacionEntidad {
  @PrimaryGeneratedColumn()
  id_orientacion!: number;

  @Column({ type: 'varchar', length: 120 })
  nombre_orientacion!: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  descripcion_orientacion!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  codigo!: string;

  @OneToMany(() => OrientacionCursoEntidad, (c) => c.orientacion)
  cursos?: OrientacionCursoEntidad[];
}

/**
 * Orientación de cada curso. Orientación es el dueño de este dato: Planificación lo
 * registra al crear el curso (asignar_curso_a_orientacion) y lo lee de acá.
 * id_curso referencia a Planificación (sin FK).
 */
@Entity('orientacion_curso')
export class OrientacionCursoEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_curso!: number;

  @Index()
  @Column({ type: 'integer' })
  id_orientacion!: number;

  @ManyToOne(() => OrientacionEntidad, (o) => o.cursos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_orientacion' })
  orientacion?: OrientacionEntidad;
}

@Entity('orientacion_area')
export class AreaEntidad {
  @PrimaryGeneratedColumn()
  id_area!: number;

  @Column({ type: 'varchar', length: 120 })
  nombre_area!: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  descripcion_area!: string | null;

  /** Referencia a Profesor y Suplencias (sin FK). */
  @Index()
  @Column({ type: 'integer', nullable: true })
  id_profesor_coordinador!: number | null;
}

@Entity('orientacion_materia')
export class MateriaEntidad {
  @PrimaryGeneratedColumn()
  id_materia!: number;

  @Column({ type: 'varchar', length: 120 })
  nombre_materia!: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  descripcion_materia!: string | null;

  @Column({ type: 'integer' })
  horas_semanales!: number;

  @Column({ type: 'integer', nullable: true })
  id_area!: number | null;

  @ManyToOne(() => AreaEntidad, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_area' })
  area?: AreaEntidad | null;

  @Column({ type: 'integer' })
  id_orientacion!: number;

  @ManyToOne(() => OrientacionEntidad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_orientacion' })
  orientacion?: OrientacionEntidad;

  /** Referencia a Planificación (sin FK). */
  @Index()
  @Column({ type: 'integer', nullable: true })
  id_anio_academico!: number | null;

  @OneToMany(() => MateriaClaseEntidad, (c) => c.materia)
  clases?: MateriaClaseEntidad[];
}

/** Clases de cada materia (ids_clases). id_clase referencia a Planificación (sin FK). */
@Entity('orientacion_materia_clase')
export class MateriaClaseEntidad {
  @PrimaryColumn({ type: 'integer' })
  id_clase!: number;

  @Index()
  @Column({ type: 'integer' })
  id_materia!: number;

  @ManyToOne(() => MateriaEntidad, (m) => m.clases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_materia' })
  materia?: MateriaEntidad;
}

export const ENTIDADES_ORIENTACION = [OrientacionEntidad, OrientacionCursoEntidad, AreaEntidad, MateriaEntidad, MateriaClaseEntidad];
