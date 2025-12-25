import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFaviconToSettings1759579849620 implements MigrationInterface {
    name = 'AddFaviconToSettings1759579849620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site_settings" ADD "favicon_url" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site_settings" DROP COLUMN "favicon_url"`);
    }

}
