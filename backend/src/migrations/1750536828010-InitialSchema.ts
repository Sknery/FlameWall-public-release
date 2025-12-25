import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1750536828010 implements MigrationInterface {
    name = 'InitialSchema1750536828010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "votes" ("id" SERIAL NOT NULL, "value" integer NOT NULL, "voter_id" integer NOT NULL, "post_id" integer, "comment_id" integer, CONSTRAINT "CHK_9531a3f9e2c935050189b1bdae" CHECK (("post_id" IS NOT NULL AND "comment_id" IS NULL) OR ("post_id" IS NULL AND "comment_id" IS NOT NULL)), CONSTRAINT "PK_f3d9fd4a0af865152c3f59db8ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cebd183f3909b522b32784acf2" ON "votes" ("voter_id", "comment_id") WHERE "comment_id" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c6f5e47300a8016ff8abdb67c9" ON "votes" ("voter_id", "post_id") WHERE "post_id" IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "comments" ("id" SERIAL NOT NULL, "content" character varying(1000) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "author_id" integer, "post_id" integer NOT NULL, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" SERIAL NOT NULL, "author_id" integer, "title" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "content" text NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "news" ("id" SERIAL NOT NULL, "author_id" integer NOT NULL, "name" character varying(50) NOT NULL, "desc" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_39a43dfcb6007180f04aff2357e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."friendships_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "friendships" ("id" SERIAL NOT NULL, "requester_id" integer NOT NULL, "receiver_id" integer NOT NULL, "status" "public"."friendships_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08af97d0be72942681757f07bc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9a08c92f69d812b680e938a078" ON "friendships" ("requester_id", "receiver_id") `);
        await queryRunner.query(`CREATE TABLE "messages" ("id" SERIAL NOT NULL, "content" text NOT NULL, "sent_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "viewed_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "sender_id" integer NOT NULL, "receiver_id" integer NOT NULL, "parent_message_id" integer, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("notification_id" SERIAL NOT NULL, "user_id" integer NOT NULL, "title" character varying(100) NOT NULL, "message" character varying(255) NOT NULL, "type" character varying(50), "link" character varying(255), "read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eaedfe19f0f765d26afafa85956" PRIMARY KEY ("notification_id"))`);
        await queryRunner.query(`CREATE TABLE "shop_items" ("item_id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text, "price" integer NOT NULL, "image_url" character varying(255), "ingame_command" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "category" character varying(50) NOT NULL DEFAULT 'items', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bebbea41754288ba74c82d5c4f4" PRIMARY KEY ("item_id"))`);
        await queryRunner.query(`CREATE TABLE "purchases" ("purchase_id" SERIAL NOT NULL, "user_id" integer NOT NULL, "item_id" integer NOT NULL, "purchase_price" integer NOT NULL, "purchased_at" TIMESTAMP NOT NULL DEFAULT now(), "status" character varying(20) NOT NULL DEFAULT 'COMPLETED', CONSTRAINT "PK_b2ebfeff06ca4de4b541e52cf70" PRIMARY KEY ("purchase_id"))`);
        await queryRunner.query(`CREATE TABLE "ranks" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "system_name" character varying(50) NOT NULL, "power_level" integer NOT NULL, "display_color" character varying(7) NOT NULL DEFAULT '#808080', "is_removable" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_7620a297228c6e9ed28e9fd07e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1e525c9bb1a236277376344d89" ON "ranks" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9394a51fa9aa1405b05f9f8be8" ON "ranks" ("system_name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_764d04403bcecc31ac112f679d" ON "ranks" ("power_level") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying(50) NOT NULL, "minecraft_username" character varying(16), "profile_slug" character varying(50), "minecraft_uuid" character varying(36), "first_login" TIMESTAMP NOT NULL DEFAULT now(), "description" character varying(70), "pfp_url" character varying(100), "banner_url" character varying(100), "is_banned" boolean NOT NULL DEFAULT false, "balance" integer NOT NULL DEFAULT '0', "password_hash" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "email_verified_at" TIMESTAMP, "last_login" TIMESTAMP, "reputation_count" integer NOT NULL DEFAULT '0', "is_minecraft_online" boolean NOT NULL DEFAULT false, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "rank_id" integer, CONSTRAINT "UQ_7166d1a63d45160e5e73b692543" UNIQUE ("profile_slug"), CONSTRAINT "UQ_427ce47b56e04782619404f41cb" UNIQUE ("minecraft_uuid"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_303a4166462928f0f3b0a444e7" ON "users" ("profile_slug") WHERE "profile_slug" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4f825c33d570c3fc72458ca21f" ON "users" ("minecraft_uuid") WHERE "minecraft_uuid" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "link_codes" ("id" SERIAL NOT NULL, "code" character varying(10) NOT NULL, "user_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_8ffedf36354a3f1445282b48ac2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6e5743f84fbf9e5e34ea56170f" ON "link_codes" ("code") `);
        await queryRunner.query(`CREATE TABLE "pending_commands" ("id" SERIAL NOT NULL, "command" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_100b81018a3c8b328d6bca5e8f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_907ed58b724f8debe4200e51af3" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_18499a5b9b4cf71093f7b7f79f8" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_edd21a11cce9afc9a6b990a1be1" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "news" ADD CONSTRAINT "FK_173d93468ebf142bb3424c2fd63" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "FK_4cf3c68ed4a5a9fde8d4c2b7319" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "FK_e6f5aea2073c03cb60231b0b4e8" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_b561864743d235f44e70addc1f5" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_72ffa22d68b72a09d5700e4463f" FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_024ddf7e04177a07fcb9806a90a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchases" ADD CONSTRAINT "FK_1064c04bd5a56289865700b2403" FOREIGN KEY ("item_id") REFERENCES "shop_items"("item_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_5488721c37882b6107fe23f10be" FOREIGN KEY ("rank_id") REFERENCES "ranks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "link_codes" ADD CONSTRAINT "FK_466de43d0ca94349972dc8657d5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "link_codes" DROP CONSTRAINT "FK_466de43d0ca94349972dc8657d5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_5488721c37882b6107fe23f10be"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_1064c04bd5a56289865700b2403"`);
        await queryRunner.query(`ALTER TABLE "purchases" DROP CONSTRAINT "FK_024ddf7e04177a07fcb9806a90a"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_72ffa22d68b72a09d5700e4463f"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_b561864743d235f44e70addc1f5"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_e6f5aea2073c03cb60231b0b4e8"`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_4cf3c68ed4a5a9fde8d4c2b7319"`);
        await queryRunner.query(`ALTER TABLE "news" DROP CONSTRAINT "FK_173d93468ebf142bb3424c2fd63"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_e6d38899c31997c45d128a8973b"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_edd21a11cce9afc9a6b990a1be1"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_18499a5b9b4cf71093f7b7f79f8"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_907ed58b724f8debe4200e51af3"`);
        await queryRunner.query(`DROP TABLE "pending_commands"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e5743f84fbf9e5e34ea56170f"`);
        await queryRunner.query(`DROP TABLE "link_codes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f825c33d570c3fc72458ca21f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_303a4166462928f0f3b0a444e7"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_764d04403bcecc31ac112f679d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9394a51fa9aa1405b05f9f8be8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e525c9bb1a236277376344d89"`);
        await queryRunner.query(`DROP TABLE "ranks"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`DROP TABLE "shop_items"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9a08c92f69d812b680e938a078"`);
        await queryRunner.query(`DROP TABLE "friendships"`);
        await queryRunner.query(`DROP TYPE "public"."friendships_status_enum"`);
        await queryRunner.query(`DROP TABLE "news"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c6f5e47300a8016ff8abdb67c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cebd183f3909b522b32784acf2"`);
        await queryRunner.query(`DROP TABLE "votes"`);
    }

}
