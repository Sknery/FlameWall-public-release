import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePagesTable1750691690126 implements MigrationInterface {
    name = 'CreatePagesTable1750691690126'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "custom_pages" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "content" text NOT NULL, "is_published" boolean NOT NULL DEFAULT false, "author_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_24ff72a94da2290c8a791a030ef" UNIQUE ("slug"), CONSTRAINT "PK_9bbf7c05420c7434f117c934345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_24ff72a94da2290c8a791a030e" ON "custom_pages" ("slug") `);
        await queryRunner.query(`ALTER TABLE "custom_pages" ADD CONSTRAINT "FK_6e6edd09635b73b1326136f3f1a" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custom_pages" DROP CONSTRAINT "FK_6e6edd09635b73b1326136f3f1a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_24ff72a94da2290c8a791a030e"`);
        await queryRunner.query(`DROP TABLE "custom_pages"`);
    }

}
