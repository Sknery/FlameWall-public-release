import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClanMessages1753081920198 implements MigrationInterface {
    name = 'AddClanMessages1753081920198'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."clan_messages_channel_enum" AS ENUM('general', 'admin')`);
        await queryRunner.query(`CREATE TABLE "clan_messages" ("id" SERIAL NOT NULL, "clan_id" integer NOT NULL, "author_id" integer, "content" text NOT NULL, "channel" "public"."clan_messages_channel_enum" NOT NULL DEFAULT 'general', "parent_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c492b2bd82c120d2f8b4ccbb4fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "clan_messages" ADD CONSTRAINT "FK_5266161defadf6313568d2b2cc2" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_messages" ADD CONSTRAINT "FK_cfcd2701c684d0299cfb963b271" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_messages" ADD CONSTRAINT "FK_a2d91eb4f9d584ccb3538040d05" FOREIGN KEY ("parent_id") REFERENCES "clan_messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clan_messages" DROP CONSTRAINT "FK_a2d91eb4f9d584ccb3538040d05"`);
        await queryRunner.query(`ALTER TABLE "clan_messages" DROP CONSTRAINT "FK_cfcd2701c684d0299cfb963b271"`);
        await queryRunner.query(`ALTER TABLE "clan_messages" DROP CONSTRAINT "FK_5266161defadf6313568d2b2cc2"`);
        await queryRunner.query(`DROP TABLE "clan_messages"`);
        await queryRunner.query(`DROP TYPE "public"."clan_messages_channel_enum"`);
    }

}
