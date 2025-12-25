import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentIdToAchievements1764531186749 implements MigrationInterface {
    name = 'AddParentIdToAchievements1764531186749'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievements" ADD "parent_id" integer`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD CONSTRAINT "FK_cf4f241a080db5f05e7fa7f023f" FOREIGN KEY ("parent_id") REFERENCES "achievements"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievements" DROP CONSTRAINT "FK_cf4f241a080db5f05e7fa7f023f"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "parent_id"`);
    }

}
