import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBanReasonColumns1752450935387 implements MigrationInterface {
    name = 'AddUserBanReasonColumns1752450935387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "ban_reason" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "ban_expires_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "ban_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "ban_reason"`);
    }

}
