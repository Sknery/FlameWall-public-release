import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteOnlyRankColumn1759571072959 implements MigrationInterface {
    name = 'AddSiteOnlyRankColumn1759571072959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ranks" ADD "is_site_only" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ranks" DROP COLUMN "is_site_only"`);
    }

}
