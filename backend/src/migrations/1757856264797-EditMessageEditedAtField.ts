import { MigrationInterface, QueryRunner } from "typeorm";

export class EditMessageEditedAtField1757856264797 implements MigrationInterface {
    name = 'EditMessageEditedAtField1757856264797'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievement_progress" DROP CONSTRAINT "FK_progress_achievement"`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" DROP CONSTRAINT "FK_progress_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_achievement_progress"`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" ADD CONSTRAINT "UQ_38ec5b8a201eca471f667e7bb99" UNIQUE ("user_id", "achievement_id")`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" ADD CONSTRAINT "FK_b615f4d226f61db44ab1a852be1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" ADD CONSTRAINT "FK_a836013769846c7e14c8cb3689a" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievement_progress" DROP CONSTRAINT "FK_a836013769846c7e14c8cb3689a"`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" DROP CONSTRAINT "FK_b615f4d226f61db44ab1a852be1"`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" DROP CONSTRAINT "UQ_38ec5b8a201eca471f667e7bb99"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_achievement_progress" ON "achievement_progress" ("user_id", "achievement_id") `);
        await queryRunner.query(`ALTER TABLE "achievement_progress" ADD CONSTRAINT "FK_progress_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "achievement_progress" ADD CONSTRAINT "FK_progress_achievement" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
