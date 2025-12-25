import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClansTables1752529581090 implements MigrationInterface {
    name = 'CreateClansTables1752529581090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clan_roles" ("id" SERIAL NOT NULL, "clan_id" integer NOT NULL, "name" character varying(50) NOT NULL, "color" character varying(7) NOT NULL DEFAULT '#AAAAAA', "power_level" integer NOT NULL DEFAULT '1', "permissions" jsonb NOT NULL, "is_system_role" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_a4b28d7f90fe291f7d8e9961439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clan_members" ("id" SERIAL NOT NULL, "clan_id" integer NOT NULL, "user_id" integer NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "PK_a51c6deb1b012f6f16bf32d3b41" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_574909eed356a3556372596422" ON "clan_members" ("clan_id", "user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."clans_join_type_enum" AS ENUM('open', 'application', 'closed')`);
        await queryRunner.query(`CREATE TABLE "clans" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "tag" character varying(50) NOT NULL, "description" text, "card_image_url" character varying(255), "card_icon_url" character varying(255), "card_color" character varying(7) NOT NULL DEFAULT '#32383E', "join_type" "public"."clans_join_type_enum" NOT NULL DEFAULT 'closed', "application_template" jsonb, "owner_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_85f2eda0c8fa3a77863c2efca7c" UNIQUE ("tag"), CONSTRAINT "PK_d198f00cf9d1743a58fc23d420e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_85f2eda0c8fa3a77863c2efca7" ON "clans" ("tag") `);
        await queryRunner.query(`CREATE TABLE "clan_reviews" ("id" SERIAL NOT NULL, "clan_id" integer NOT NULL, "author_id" integer, "rating" smallint NOT NULL, "text" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4119393ea3dae1d129690f2a78e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."clan_applications_status_enum" AS ENUM('pending', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "clan_applications" ("id" SERIAL NOT NULL, "clan_id" integer NOT NULL, "user_id" integer NOT NULL, "answers" jsonb NOT NULL, "status" "public"."clan_applications_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ea6e29ac00dec5cb43b5c23b777" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_975a5ac3a6a5fcf9f8c5fbc887" ON "clan_applications" ("clan_id", "user_id") WHERE status = 'pending'`);
        await queryRunner.query(`ALTER TABLE "clan_roles" ADD CONSTRAINT "FK_e3ab9f042d0be71e52a855d2a2f" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_members" ADD CONSTRAINT "FK_fb010fb2f806c38346c9f11d48a" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_members" ADD CONSTRAINT "FK_0bd6ad2583e2e011c8233e48122" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_members" ADD CONSTRAINT "FK_11e3f3a86f6b30fc661d8d0464c" FOREIGN KEY ("role_id") REFERENCES "clan_roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clans" ADD CONSTRAINT "FK_9637bf34a57c1999a9dd6fdd239" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_reviews" ADD CONSTRAINT "FK_7ca53bf8509fd8d0be42d713787" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_reviews" ADD CONSTRAINT "FK_6f5f8e16f7f0b71f90508d2de07" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_applications" ADD CONSTRAINT "FK_34c806f5f440ab33ea4dc11c46f" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_applications" ADD CONSTRAINT "FK_b76fa4b3d999c712d7d1f9390b1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clan_applications" DROP CONSTRAINT "FK_b76fa4b3d999c712d7d1f9390b1"`);
        await queryRunner.query(`ALTER TABLE "clan_applications" DROP CONSTRAINT "FK_34c806f5f440ab33ea4dc11c46f"`);
        await queryRunner.query(`ALTER TABLE "clan_reviews" DROP CONSTRAINT "FK_6f5f8e16f7f0b71f90508d2de07"`);
        await queryRunner.query(`ALTER TABLE "clan_reviews" DROP CONSTRAINT "FK_7ca53bf8509fd8d0be42d713787"`);
        await queryRunner.query(`ALTER TABLE "clans" DROP CONSTRAINT "FK_9637bf34a57c1999a9dd6fdd239"`);
        await queryRunner.query(`ALTER TABLE "clan_members" DROP CONSTRAINT "FK_11e3f3a86f6b30fc661d8d0464c"`);
        await queryRunner.query(`ALTER TABLE "clan_members" DROP CONSTRAINT "FK_0bd6ad2583e2e011c8233e48122"`);
        await queryRunner.query(`ALTER TABLE "clan_members" DROP CONSTRAINT "FK_fb010fb2f806c38346c9f11d48a"`);
        await queryRunner.query(`ALTER TABLE "clan_roles" DROP CONSTRAINT "FK_e3ab9f042d0be71e52a855d2a2f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_975a5ac3a6a5fcf9f8c5fbc887"`);
        await queryRunner.query(`DROP TABLE "clan_applications"`);
        await queryRunner.query(`DROP TYPE "public"."clan_applications_status_enum"`);
        await queryRunner.query(`DROP TABLE "clan_reviews"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_85f2eda0c8fa3a77863c2efca7"`);
        await queryRunner.query(`DROP TABLE "clans"`);
        await queryRunner.query(`DROP TYPE "public"."clans_join_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_574909eed356a3556372596422"`);
        await queryRunner.query(`DROP TABLE "clan_members"`);
        await queryRunner.query(`DROP TABLE "clan_roles"`);
    }

}
