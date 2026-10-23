import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, type Relation } from 'typeorm';

@Entity('pago_pago')
@Index(['id_profesor', 'periodo'], { unique: true })
export class PagoEntidad {
  @PrimaryGeneratedColumn()
  id_pago!: number;

  /** Referencia a Profesor y Suplencias (sin FK). */
  @Column({ type: 'integer' })
  id_profesor!: number;

  /** Período liquidado, YYYY-MM. */
  @Column({ type: 'varchar', length: 7 })
  periodo!: string;

  @Column({ type: 'boolean', default: false })
  validado!: boolean;

  @OneToOne(() => ReciboSueldoEntidad, (r) => r.pago)
  recibo_sueldo?: Relation<ReciboSueldoEntidad>;
}

/** Único recibo de cada pago. */
@Entity('pago_recibo_sueldo')
export class ReciboSueldoEntidad {
  @PrimaryGeneratedColumn()
  id_recibo_sueldo!: number;

  @Index({ unique: true })
  @Column({ type: 'integer' })
  id_pago!: number;

  @OneToOne(() => PagoEntidad, (p) => p.recibo_sueldo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_pago' })
  pago?: PagoEntidad;

  @Index()
  @Column({ type: 'integer' })
  id_profesor!: number;

  @Column({ type: 'varchar', length: 7 })
  periodo!: string;

  @Column({ type: 'varchar', length: 10 })
  fecha_pago!: string;

  @Column({ type: 'varchar', length: 160 })
  emisor_razon_social!: string;

  @Column({ type: 'varchar', length: 20 })
  emisor_cuit!: string;

  @Column({ type: 'real' })
  total_bruto!: number;

  @Column({ type: 'real' })
  total_descuentos!: number;

  @Column({ type: 'real' })
  neto!: number;

  @Column({ type: 'integer', nullable: true })
  firma_emisor_id_usuario!: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  firma_emisor_fecha!: string | null;

  @Column({ type: 'integer', nullable: true })
  firma_receptor_id_usuario!: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  firma_receptor_fecha!: string | null;

  @OneToMany(() => ConceptoReciboEntidad, (c) => c.recibo, { cascade: true })
  conceptos?: ConceptoReciboEntidad[];
}

@Entity('pago_concepto_recibo')
export class ConceptoReciboEntidad {
  @PrimaryGeneratedColumn()
  id_concepto!: number;

  @Index()
  @Column({ type: 'integer' })
  id_recibo_sueldo!: number;

  @ManyToOne(() => ReciboSueldoEntidad, (r) => r.conceptos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_recibo_sueldo' })
  recibo?: ReciboSueldoEntidad;

  @Column({ type: 'integer', default: 0 })
  orden!: number;

  @Column({ type: 'varchar', length: 200 })
  descripcion!: string;

  @Column({ type: 'real', nullable: true })
  cantidad!: number | null;

  @Column({ type: 'real' })
  importe!: number;

  @Column({ type: 'varchar', length: 10 })
  tipo!: 'haber' | 'descuento';
}

/**
 * Parámetros de la liquidación (configuración del servicio Pago): valor de la hora
 * cátedra por período, porcentajes de antigüedad y descuentos, datos del emisor.
 * Clave → valor en texto.
 */
@Entity('pago_parametro')
export class ParametroPagoEntidad {
  @PrimaryColumn({ type: 'varchar', length: 60 })
  clave!: string;

  @Column({ type: 'varchar', length: 200 })
  valor!: string;
}

/** Valor de la hora cátedra desde un período (YYYY-MM) en adelante. */
@Entity('pago_valor_hora')
export class ValorHoraEntidad {
  @PrimaryColumn({ type: 'varchar', length: 7 })
  desde_periodo!: string;

  @Column({ type: 'real' })
  valor!: number;
}

export const ENTIDADES_PAGO = [PagoEntidad, ReciboSueldoEntidad, ConceptoReciboEntidad, ParametroPagoEntidad, ValorHoraEntidad];
