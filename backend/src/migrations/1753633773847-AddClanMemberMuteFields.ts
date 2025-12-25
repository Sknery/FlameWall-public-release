import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClanMemberMuteFields1753633773847 implements MigrationInterface {
    name = 'AddClanMemberMuteFields1753633773847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clan_members" ADD "is_muted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "clan_members" ADD "mute_expires_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clan_members" DROP COLUMN "mute_expires_at"`);
        await queryRunner.query(`ALTER TABLE "clan_members" DROP COLUMN "is_muted"`);
    }

}
