import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGlobalMessagesTable1751480209762 implements MigrationInterface {
    name = 'CreateGlobalMessagesTable1751480209762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "global_messages" ("id" SERIAL NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "author_id" integer, "parent_id" integer, CONSTRAINT "PK_bb059798a1864bfa4c2a19249d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "global_messages" ADD CONSTRAINT "FK_ceedd1fdba70417ccecd4fb22e3" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "global_messages" ADD CONSTRAINT "FK_46deb36bb3ee16df54e4f36901e" FOREIGN KEY ("parent_id") REFERENCES "global_messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "global_messages" DROP CONSTRAINT "FK_46deb36bb3ee16df54e4f36901e"`);
        await queryRunner.query(`ALTER TABLE "global_messages" DROP CONSTRAINT "FK_ceedd1fdba70417ccecd4fb22e3"`);
        await queryRunner.query(`DROP TABLE "global_messages"`);
    }

}
