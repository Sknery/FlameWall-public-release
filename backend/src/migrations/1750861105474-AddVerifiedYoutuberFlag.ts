import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVerifiedYoutuberFlag1750861105474 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_verified_youtuber" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_verified_youtuber"`);
    }

}
