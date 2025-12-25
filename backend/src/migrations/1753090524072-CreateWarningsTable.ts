import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWarningsTable1753090524072 implements MigrationInterface {
    name = 'CreateWarningsTable1753090524072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clan_warnings" ("id" SERIAL NOT NULL, "clan_id" integer NOT NULL, "actor_id" integer NOT NULL, "target_id" integer NOT NULL, "reason" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac0e7c18dcd5bd06bb389930e8a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "clan_warnings" ADD CONSTRAINT "FK_01758efd7b1c854dcfe25bf62ec" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_warnings" ADD CONSTRAINT "FK_ef86fa9131a3db6b344217322b0" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_warnings" ADD CONSTRAINT "FK_e2f7eb413b9c48089e5e9f0cea7" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clan_warnings" DROP CONSTRAINT "FK_e2f7eb413b9c48089e5e9f0cea7"`);
        await queryRunner.query(`ALTER TABLE "clan_warnings" DROP CONSTRAINT "FK_ef86fa9131a3db6b344217322b0"`);
        await queryRunner.query(`ALTER TABLE "clan_warnings" DROP CONSTRAINT "FK_01758efd7b1c854dcfe25bf62ec"`);
        await queryRunner.query(`DROP TABLE "clan_warnings"`);
    }

}
