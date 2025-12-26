import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnimatedAvatarAndBannerToUsers1766769870019 implements MigrationInterface {
    name = 'AddAnimatedAvatarAndBannerToUsers1766769870019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "animated_avatar_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "animated_banner_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_animated_avatar" FOREIGN KEY ("animated_avatar_id") REFERENCES "shop_items"("item_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_animated_banner" FOREIGN KEY ("animated_banner_id") REFERENCES "shop_items"("item_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_animated_banner"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_animated_avatar"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "animated_banner_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "animated_avatar_id"`);
    }
}
