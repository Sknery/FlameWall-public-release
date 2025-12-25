import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagsTable1760786410117 implements MigrationInterface {
    name = 'AddTagsTable1760786410117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "icon_url" character varying(255), "color" character varying(7), CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_tags" ("user_id" integer NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "PK_1383f92433abfd0fed78029375b" PRIMARY KEY ("user_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1876d8f8eff4211b216364381e" ON "user_tags" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_082dadc021168fef6e1afd42ad" ON "user_tags" ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "user_tags" ADD CONSTRAINT "FK_1876d8f8eff4211b216364381ec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_tags" ADD CONSTRAINT "FK_082dadc021168fef6e1afd42ad7" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_tags" DROP CONSTRAINT "FK_082dadc021168fef6e1afd42ad7"`);
        await queryRunner.query(`ALTER TABLE "user_tags" DROP CONSTRAINT "FK_1876d8f8eff4211b216364381ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_082dadc021168fef6e1afd42ad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1876d8f8eff4211b216364381e"`);
        await queryRunner.query(`DROP TABLE "user_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
