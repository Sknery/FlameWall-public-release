import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailChangeFields1760866070390 implements MigrationInterface {
    name = 'AddEmailChangeFields1760866070390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pending_email" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_change_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_change_token_expires" TIMESTAMP`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b97e0c25064a213049ca818739" ON "users" ("pending_email") WHERE "pending_email" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b97e0c25064a213049ca818739"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_change_token_expires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_change_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pending_email"`);
    }

}
