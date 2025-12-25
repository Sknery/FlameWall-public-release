import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvitationsTable1753088070454 implements MigrationInterface {
    name = 'AddInvitationsTable1753088070454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."clan_invitations_status_enum" AS ENUM('pending', 'accepted', 'declined', 'expired')`);
        await queryRunner.query(`CREATE TABLE "clan_invitations" ("id" SERIAL NOT NULL, "clan_id" integer NOT NULL, "inviter_id" integer NOT NULL, "invitee_id" integer NOT NULL, "status" "public"."clan_invitations_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_d99e3478bd15015c379e94b6344" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_05f01d7b58bd00cedf927dfa46" ON "clan_invitations" ("clan_id", "invitee_id") WHERE status = 'pending'`);
        await queryRunner.query(`ALTER TABLE "clan_invitations" ADD CONSTRAINT "FK_c5698803569430ca9fbe189c776" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_invitations" ADD CONSTRAINT "FK_9fca0b3dcc0b06c1fb8992c6db2" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clan_invitations" ADD CONSTRAINT "FK_3c0a763d4435853a99bc91cf1a4" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clan_invitations" DROP CONSTRAINT "FK_3c0a763d4435853a99bc91cf1a4"`);
        await queryRunner.query(`ALTER TABLE "clan_invitations" DROP CONSTRAINT "FK_9fca0b3dcc0b06c1fb8992c6db2"`);
        await queryRunner.query(`ALTER TABLE "clan_invitations" DROP CONSTRAINT "FK_c5698803569430ca9fbe189c776"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_05f01d7b58bd00cedf927dfa46"`);
        await queryRunner.query(`DROP TABLE "clan_invitations"`);
        await queryRunner.query(`DROP TYPE "public"."clan_invitations_status_enum"`);
    }

}
