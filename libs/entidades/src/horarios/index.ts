import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('horarios_dia_lectivo')
export class DiaLectivoEntidad {
  @PrimaryGeneratedColumn()
  id_dia_lectivo!: number;

  @Column({ type: 'varchar', length: 20 })
  nombre_dia_lectivo!: string;

  /** Orden del día en la semana (1 = lunes). Sirve para ordenar las grillas. */
  @Column({ type: 'integer', default: 0 })
  orden!: number;
}

/** Una hora cátedra (o un recreo) en un día determinado. */
@Entity('horarios_franja_horaria')
export class FranjaHorariaEntidad {
  @PrimaryGeneratedColumn()
  id_franja_horaria!: number;

  @Column({ type: 'varchar', length: 5 })
  hora_inicio!: string;

  @Column({ type: 'varchar', length: 5 })
  hora_fin!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  descripcion!: string | null;

  @Column({ type: 'boolean', default: false })
  es_recreo!: boolean;

  @Column({ type: 'integer' })
  id_dia_lectivo!: number;

  @ManyToOne(() => DiaLectivoEntidad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_dia_lectivo' })
  dia_lectivo?: DiaLectivoEntidad;
}

@Entity('horarios_turno')
export class TurnoEntidad {
  @PrimaryGeneratedColumn()
  id_turno!: number;

  @Column({ type: 'varchar', length: 60 })
  nombre!: string;

  @Column({ type: 'integer' })
  cantidad_franjas_total!: number;

  @ManyToMany(() => FranjaHorariaEntidad)
  @JoinTable({
    name: 'horarios_turno_franja',
    joinColumn: { name: 'id_turno', referencedColumnName: 'id_turno' },
    inverseJoinColumn: { name: 'id_franja_horaria', referencedColumnName: 'id_franja_horaria' },
  })
  franjas_horarias!: FranjaHorariaEntidad[];
}

export const ENTIDADES_HORARIOS = [DiaLectivoEntidad, FranjaHorariaEntidad, TurnoEntidad];
