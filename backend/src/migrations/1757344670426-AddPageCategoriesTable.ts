import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPageCategoriesTable1757344670426 implements MigrationInterface {
    name = 'AddPageCategoriesTable1757344670426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "page_categories" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "display_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_6304b9ee5d066110091b447756c" UNIQUE ("name"), CONSTRAINT "PK_ccf177738677d7a2794b83fdb71" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "custom_pages" ADD "category_id" integer`);
        await queryRunner.query(`ALTER TABLE "custom_pages" ADD CONSTRAINT "FK_5131dab0250aa991a4b0399334a" FOREIGN KEY ("category_id") REFERENCES "page_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custom_pages" DROP CONSTRAINT "FK_5131dab0250aa991a4b0399334a"`);
        await queryRunner.query(`ALTER TABLE "custom_pages" DROP COLUMN "category_id"`);
        await queryRunner.query(`DROP TABLE "page_categories"`);
    }

}
