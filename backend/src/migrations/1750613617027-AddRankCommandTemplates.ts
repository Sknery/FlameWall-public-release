import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRankCommandTemplates1750613617027 implements MigrationInterface {
    name = 'AddRankCommandTemplates1750613617027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ranks" ADD "command_template" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "ranks" ADD "command_template_remove" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ranks" DROP COLUMN "command_template_remove"`);
        await queryRunner.query(`ALTER TABLE "ranks" DROP COLUMN "command_template"`);
    }

}
