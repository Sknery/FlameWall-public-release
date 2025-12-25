import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAchievementGroupsAndStyles1751566836738 implements MigrationInterface {
    name = 'AddAchievementGroupsAndStyles1751566836738'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "achievement_groups" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text, "icon_url" character varying(255), "display_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_b5c5e51ba38e48888bc8fd674b3" UNIQUE ("name"), CONSTRAINT "PK_1f47b20d16ba8d5e6e8b4d4d4b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD "card_color" character varying(7) DEFAULT '#32383E'`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD "text_color" character varying(7) DEFAULT '#F0F4F8'`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD "group_id" integer`);
        await queryRunner.query(`ALTER TABLE "achievements" ADD CONSTRAINT "FK_7b1c5a005108e47601e2c24cda8" FOREIGN KEY ("group_id") REFERENCES "achievement_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "achievements" DROP CONSTRAINT "FK_7b1c5a005108e47601e2c24cda8"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "text_color"`);
        await queryRunner.query(`ALTER TABLE "achievements" DROP COLUMN "card_color"`);
        await queryRunner.query(`DROP TABLE "achievement_groups"`);
    }

}
