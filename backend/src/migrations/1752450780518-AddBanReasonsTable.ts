import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBanReasonsTable1752450780518 implements MigrationInterface {
    name = 'AddBanReasonsTable1752450780518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ban_reasons" ("id" SERIAL NOT NULL, "reason" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f8935679d475f4ba96f6fad12bd" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ban_reasons"`);
    }

}
