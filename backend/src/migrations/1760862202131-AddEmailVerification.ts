import { MigrationInterface, QueryRunner } from "typeorm";

export class FileName1760862202131 implements MigrationInterface {
    name = 'FileName1760862202131'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_token_expires" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_token_expires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_token"`);
    }

}
