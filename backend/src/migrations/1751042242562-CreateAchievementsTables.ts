import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAchievementsTables1751406857147 implements MigrationInterface {
    name = 'CreateAchievementsTables1751406857147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "achievements" (
                "id" SERIAL NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text NOT NULL,
                "icon_url" character varying(255),
                "is_enabled" boolean NOT NULL DEFAULT true,
                "reward_command" text,
                "conditions" jsonb NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_achievements_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "achievement_progress" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "achievement_id" integer NOT NULL,
                "progress_data" jsonb NOT NULL DEFAULT '{}',
                "is_completed" boolean NOT NULL DEFAULT false,
                "completed_at" TIMESTAMP,
                CONSTRAINT "PK_achievement_progress_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "achievement_progress"
            ADD CONSTRAINT "FK_progress_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "achievement_progress"
            ADD CONSTRAINT "FK_progress_achievement" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_user_achievement_progress" ON "achievement_progress" ("user_id", "achievement_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_user_achievement_progress"`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" DROP CONSTRAINT "FK_progress_achievement"`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" DROP CONSTRAINT "FK_progress_user"`);
        await queryRunner.query(`DROP TABLE "achievement_progress"`);
        await queryRunner.query(`DROP TABLE "achievements"`);
    }

}