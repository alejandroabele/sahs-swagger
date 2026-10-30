import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Reglas de negocio: baja lógica del profesor (activo) y estados Vigente / Fue vigente,
 * que reemplazan a Validada / Cerrada (mismos id_estado, así las propuestas conservan su estado).
 */
export class ReglasDeNegocio1793404800000 implements MigrationInterface {
    name = 'ReglasDeNegocio1793404800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profesor_profesor" ADD COLUMN "activo" boolean NOT NULL DEFAULT (1)`);
        await queryRunner.query(`UPDATE "planificacion_estado_propuesta" SET "codigo" = 'VIG', "nombre" = 'Vigente' WHERE "codigo" = 'VAL'`);
        await queryRunner.query(`UPDATE "planificacion_estado_propuesta" SET "codigo" = 'FVG', "nombre" = 'Fue vigente' WHERE "codigo" = 'CER'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "planificacion_estado_propuesta" SET "codigo" = 'CER', "nombre" = 'Cerrada' WHERE "codigo" = 'FVG'`);
        await queryRunner.query(`UPDATE "planificacion_estado_propuesta" SET "codigo" = 'VAL', "nombre" = 'Validada' WHERE "codigo" = 'VIG'`);
        await queryRunner.query(`ALTER TABLE "profesor_profesor" DROP COLUMN "activo"`);
    }
}
