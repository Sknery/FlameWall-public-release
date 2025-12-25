import { MigrationInterface, QueryRunner } from "typeorm";

export class AddServerGroupTable1756918384603 implements MigrationInterface {
    name = 'AddServerGroupTable1756918384603'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "server_groups" ("name" character varying(100) NOT NULL, CONSTRAINT "PK_c21f614088b1956de48a67405f0" PRIMARY KEY ("name"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "server_groups"`);
    }

}
