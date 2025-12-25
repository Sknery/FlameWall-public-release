import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSettingsTable1757939462726 implements MigrationInterface {
    name = 'AddSettingsTable1757939462726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "site_settings" ("id" SERIAL NOT NULL, "site_name" character varying(100) NOT NULL DEFAULT 'FlameWall', "accent_color" character varying(7) NOT NULL DEFAULT '#FFA500', "logo_url" character varying(255), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4290e8371a166d7e066d131f6e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "site_settings"`);
    }

}
