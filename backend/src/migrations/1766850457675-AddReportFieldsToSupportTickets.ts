import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReportFieldsToSupportTickets1766850457675 implements MigrationInterface {
    name = 'AddReportFieldsToSupportTickets1766850457675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "support_tickets" 
            ADD COLUMN "report_entity_type" character varying(50),
            ADD COLUMN "report_entity_id" integer,
            ADD COLUMN "report_entity_data" text
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_support_tickets_report_entity" 
            ON "support_tickets" ("report_entity_type", "report_entity_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_support_tickets_report_entity"`);
        await queryRunner.query(`
            ALTER TABLE "support_tickets" 
            DROP COLUMN "report_entity_data",
            DROP COLUMN "report_entity_id",
            DROP COLUMN "report_entity_type"
        `);
    }
}

