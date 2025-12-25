import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClanMemberHistory1753632211398 implements MigrationInterface {
    name = 'AddClanMemberHistory1753632211398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clan_member_history" ("id" SERIAL NOT NULL, "clan_id" integer NOT NULL, "user_id" integer NOT NULL, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), "left_at" TIMESTAMP, CONSTRAINT "PK_b2805c38facf017cfbd3583b32b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "clan_member_history" ADD CONSTRAINT "FK_3d2d3807138c53c012fb0e72bb6" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_member_history" ADD CONSTRAINT "FK_522c84b7d7362e9de79c78e237a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clan_member_history" DROP CONSTRAINT "FK_522c84b7d7362e9de79c78e237a"`);
        await queryRunner.query(`ALTER TABLE "clan_member_history" DROP CONSTRAINT "FK_3d2d3807138c53c012fb0e72bb6"`);
        await queryRunner.query(`DROP TABLE "clan_member_history"`);
    }

}
