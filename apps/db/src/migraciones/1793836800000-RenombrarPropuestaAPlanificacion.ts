import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Renombra "propuesta" a "planificación": tablas planificacion_propuesta, planificacion_estado_propuesta y
 * planificacion_propuesta_clase, y columnas id_propuesta y descripcion_propuesta. Conserva filas e ids.
 *
 * TypeORM nombra índices y claves foráneas con un hash del nombre de la tabla, así que se rehacen con los
 * nombres nuevos. En SQLite una clave foránea solo cambia recreando la tabla. Las clases de cada planificación
 * pasan por una tabla de respaldo sin claves foráneas: si la tabla siguiera apuntando a la de planificaciones,
 * el DROP borraría sus filas por el ON DELETE CASCADE.
 */
export class RenombrarPropuestaAPlanificacion1793836800000 implements MigrationInterface {
    name = 'RenombrarPropuestaAPlanificacion1793836800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Estados: solo cambia el nombre de la tabla y del índice.
        await queryRunner.query(`ALTER TABLE "planificacion_estado_propuesta" RENAME TO "planificacion_estado_planificacion"`);
        await queryRunner.query(`DROP INDEX "IDX_1c94c0394f6ca5fd9548ba2ab0"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97af5db05ed724e43fa409544d" ON "planificacion_estado_planificacion" ("codigo") `);

        // Clases de cada planificación: se guardan en una tabla de respaldo sin claves foráneas y se borra la
        // tabla, así nada apunta a la de planificaciones mientras se recrea.
        await queryRunner.query(`CREATE TABLE "respaldo_clases" AS SELECT "id_propuesta" AS "id", "id_clase" FROM "planificacion_propuesta_clase"`);
        await queryRunner.query(`DROP TABLE "planificacion_propuesta_clase"`);

        // Planificaciones.
        await queryRunner.query(`DROP INDEX "IDX_eeceba6868304165c85cf77b14"`);
        await queryRunner.query(`CREATE TABLE "planificacion_planificacion" ("id_planificacion" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nombre" varchar(120) NOT NULL, "descripcion_planificacion" varchar(400), "fecha_creacion" varchar(30) NOT NULL, "fecha_modificacion" varchar(30) NOT NULL, "codigo" varchar(30) NOT NULL, "id_ciclo_lectivo" integer NOT NULL, "id_estado" integer NOT NULL, CONSTRAINT "FK_8492cf277879be406a43130660f" FOREIGN KEY ("id_ciclo_lectivo") REFERENCES "planificacion_ciclo_lectivo" ("id_ciclo_lectivo") ON DELETE RESTRICT ON UPDATE NO ACTION, CONSTRAINT "FK_5ecd1c103234d9b7b3ac05213cb" FOREIGN KEY ("id_estado") REFERENCES "planificacion_estado_planificacion" ("id_estado") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "planificacion_planificacion"("id_planificacion", "nombre", "descripcion_planificacion", "fecha_creacion", "fecha_modificacion", "codigo", "id_ciclo_lectivo", "id_estado") SELECT "id_propuesta", "nombre", "descripcion_propuesta", "fecha_creacion", "fecha_modificacion", "codigo", "id_ciclo_lectivo", "id_estado" FROM "planificacion_propuesta"`);
        await queryRunner.query(`DROP TABLE "planificacion_propuesta"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9e805c87981399959681caa047" ON "planificacion_planificacion" ("codigo") `);

        await queryRunner.query(`CREATE TABLE "planificacion_planificacion_clase" ("id_planificacion" integer NOT NULL, "id_clase" integer NOT NULL, CONSTRAINT "FK_949407b7d16f16f19c490452df3" FOREIGN KEY ("id_planificacion") REFERENCES "planificacion_planificacion" ("id_planificacion") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_218407ec4b4c15aa25fff7b7214" FOREIGN KEY ("id_clase") REFERENCES "planificacion_clase" ("id_clase") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id_planificacion", "id_clase"))`);
        await queryRunner.query(`INSERT INTO "planificacion_planificacion_clase"("id_planificacion", "id_clase") SELECT "id", "id_clase" FROM "respaldo_clases"`);
        await queryRunner.query(`DROP TABLE "respaldo_clases"`);
        await queryRunner.query(`CREATE INDEX "IDX_218407ec4b4c15aa25fff7b721" ON "planificacion_planificacion_clase" ("id_clase") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "planificacion_estado_planificacion" RENAME TO "planificacion_estado_propuesta"`);
        await queryRunner.query(`DROP INDEX "IDX_97af5db05ed724e43fa409544d"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1c94c0394f6ca5fd9548ba2ab0" ON "planificacion_estado_propuesta" ("codigo") `);

        await queryRunner.query(`CREATE TABLE "respaldo_clases" AS SELECT "id_planificacion" AS "id", "id_clase" FROM "planificacion_planificacion_clase"`);
        await queryRunner.query(`DROP TABLE "planificacion_planificacion_clase"`);

        await queryRunner.query(`DROP INDEX "IDX_9e805c87981399959681caa047"`);
        await queryRunner.query(`CREATE TABLE "planificacion_propuesta" ("id_propuesta" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "nombre" varchar(120) NOT NULL, "descripcion_propuesta" varchar(400), "fecha_creacion" varchar(30) NOT NULL, "fecha_modificacion" varchar(30) NOT NULL, "codigo" varchar(30) NOT NULL, "id_ciclo_lectivo" integer NOT NULL, "id_estado" integer NOT NULL, CONSTRAINT "FK_7c886a99ff42eb12dc04b4085b3" FOREIGN KEY ("id_ciclo_lectivo") REFERENCES "planificacion_ciclo_lectivo" ("id_ciclo_lectivo") ON DELETE RESTRICT ON UPDATE NO ACTION, CONSTRAINT "FK_359def4e1dd71ed2434f634d5d2" FOREIGN KEY ("id_estado") REFERENCES "planificacion_estado_propuesta" ("id_estado") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "planificacion_propuesta"("id_propuesta", "nombre", "descripcion_propuesta", "fecha_creacion", "fecha_modificacion", "codigo", "id_ciclo_lectivo", "id_estado") SELECT "id_planificacion", "nombre", "descripcion_planificacion", "fecha_creacion", "fecha_modificacion", "codigo", "id_ciclo_lectivo", "id_estado" FROM "planificacion_planificacion"`);
        await queryRunner.query(`DROP TABLE "planificacion_planificacion"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_eeceba6868304165c85cf77b14" ON "planificacion_propuesta" ("codigo") `);

        await queryRunner.query(`CREATE TABLE "planificacion_propuesta_clase" ("id_propuesta" integer NOT NULL, "id_clase" integer NOT NULL, CONSTRAINT "FK_f5060e2f601bd329a80a32f5f8d" FOREIGN KEY ("id_propuesta") REFERENCES "planificacion_propuesta" ("id_propuesta") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_08034dd848f5d79dd58ef283239" FOREIGN KEY ("id_clase") REFERENCES "planificacion_clase" ("id_clase") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("id_propuesta", "id_clase"))`);
        await queryRunner.query(`INSERT INTO "planificacion_propuesta_clase"("id_propuesta", "id_clase") SELECT "id", "id_clase" FROM "respaldo_clases"`);
        await queryRunner.query(`DROP TABLE "respaldo_clases"`);
        await queryRunner.query(`CREATE INDEX "IDX_08034dd848f5d79dd58ef28323" ON "planificacion_propuesta_clase" ("id_clase") `);
    }
}
