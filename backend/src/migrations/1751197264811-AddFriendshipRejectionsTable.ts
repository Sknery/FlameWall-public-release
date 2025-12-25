import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFriendshipRejectionsTable1751197264811 implements MigrationInterface {
    name = 'AddFriendshipRejectionsTable1751197264811'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "friendship_rejections" ("id" SERIAL NOT NULL, "rejector_id" integer NOT NULL, "requester_id" integer NOT NULL, "rejected_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e99ebcdb83d323c264a0d3ae88f" UNIQUE ("rejector_id", "requester_id"), CONSTRAINT "PK_e95bd4fc5bd43bf44f390ffaf54" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "friendship_rejections" ADD CONSTRAINT "FK_7ad009e59ce68f0cb20803b04a9" FOREIGN KEY ("rejector_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendship_rejections" ADD CONSTRAINT "FK_3093972da9eaaa26c4e75674bfd" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "friendship_rejections" DROP CONSTRAINT "FK_3093972da9eaaa26c4e75674bfd"`);
        await queryRunner.query(`ALTER TABLE "friendship_rejections" DROP CONSTRAINT "FK_7ad009e59ce68f0cb20803b04a9"`);
        await queryRunner.query(`DROP TABLE "friendship_rejections"`);
    }

}