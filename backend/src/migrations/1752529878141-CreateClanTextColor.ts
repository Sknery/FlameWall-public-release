import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClanTextColor1752529878141 implements MigrationInterface {
    name = 'CreateClanTextColor1752529878141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clans" ADD "text_color" character varying(7) DEFAULT '#F0F4F8'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clans" DROP COLUMN "text_color"`);
    }

}
