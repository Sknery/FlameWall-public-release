import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRewardCoinsToAchievements1766764145000 implements MigrationInterface {
    name = 'AddRewardCoinsToAchievements1766764145000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievements" ADD "reward_coins" integer DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "reward_coins"`);
    }
}

