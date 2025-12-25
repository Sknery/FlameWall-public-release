import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShopItemTypes1759063903297 implements MigrationInterface {
    name = 'AddShopItemTypes1759063903297'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shop_items" ADD "item_type" character varying(50) NOT NULL DEFAULT 'COMMAND'`);
        await queryRunner.query(`ALTER TABLE "shop_items" ADD "cosmetic_data" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profile_frame_id" integer`);
        await queryRunner.query(`ALTER TABLE "shop_items" ALTER COLUMN "ingame_command" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f351caf0977730c9c930deab427" FOREIGN KEY ("profile_frame_id") REFERENCES "shop_items"("item_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f351caf0977730c9c930deab427"`);
        await queryRunner.query(`ALTER TABLE "shop_items" ALTER COLUMN "ingame_command" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_frame_id"`);
        await queryRunner.query(`ALTER TABLE "shop_items" DROP COLUMN "cosmetic_data"`);
        await queryRunner.query(`ALTER TABLE "shop_items" DROP COLUMN "item_type"`);
    }

}
