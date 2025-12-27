import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReportsAndSupportTickets1766847386686 implements MigrationInterface {
    name = 'CreateReportsAndSupportTickets1766847386686'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create reports table
        await queryRunner.query(`
            CREATE TABLE "reports" (
                "id" SERIAL NOT NULL,
                "type" character varying NOT NULL,
                "target_id" integer NOT NULL,
                "reporter_id" integer NOT NULL,
                "reason" character varying NOT NULL,
                "description" text,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "reviewer_id" integer,
                "admin_notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "resolved_at" TIMESTAMP,
                CONSTRAINT "PK_reports" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_reports_type" ON "reports" ("type")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_reports_status" ON "reports" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_reports_reporter" ON "reports" ("reporter_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_reports_target" ON "reports" ("type", "target_id")
        `);

        await queryRunner.query(`
            ALTER TABLE "reports" 
            ADD CONSTRAINT "FK_reports_reporter" 
            FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reports" 
            ADD CONSTRAINT "FK_reports_reviewer" 
            FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create support_tickets table
        await queryRunner.query(`
            CREATE TABLE "support_tickets" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "subject" character varying(200) NOT NULL,
                "message" text NOT NULL,
                "category" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'OPEN',
                "priority" character varying NOT NULL DEFAULT 'MEDIUM',
                "assigned_to_id" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "resolved_at" TIMESTAMP,
                CONSTRAINT "PK_support_tickets" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_support_tickets_user" ON "support_tickets" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_support_tickets_status" ON "support_tickets" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_support_tickets_category" ON "support_tickets" ("category")
        `);

        await queryRunner.query(`
            ALTER TABLE "support_tickets" 
            ADD CONSTRAINT "FK_support_tickets_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "support_tickets" 
            ADD CONSTRAINT "FK_support_tickets_assigned" 
            FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create support_ticket_replies table
        await queryRunner.query(`
            CREATE TABLE "support_ticket_replies" (
                "id" SERIAL NOT NULL,
                "ticket_id" integer NOT NULL,
                "user_id" integer NOT NULL,
                "message" text NOT NULL,
                "is_internal" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_support_ticket_replies" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_support_ticket_replies_ticket" ON "support_ticket_replies" ("ticket_id")
        `);

        await queryRunner.query(`
            ALTER TABLE "support_ticket_replies" 
            ADD CONSTRAINT "FK_support_ticket_replies_ticket" 
            FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "support_ticket_replies" 
            ADD CONSTRAINT "FK_support_ticket_replies_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support_ticket_replies" DROP CONSTRAINT "FK_support_ticket_replies_user"`);
        await queryRunner.query(`ALTER TABLE "support_ticket_replies" DROP CONSTRAINT "FK_support_ticket_replies_ticket"`);
        await queryRunner.query(`DROP INDEX "IDX_support_ticket_replies_ticket"`);
        await queryRunner.query(`DROP TABLE "support_ticket_replies"`);
        
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_support_tickets_assigned"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_support_tickets_user"`);
        await queryRunner.query(`DROP INDEX "IDX_support_tickets_category"`);
        await queryRunner.query(`DROP INDEX "IDX_support_tickets_status"`);
        await queryRunner.query(`DROP INDEX "IDX_support_tickets_user"`);
        await queryRunner.query(`DROP TABLE "support_tickets"`);
        
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reviewer"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reporter"`);
        await queryRunner.query(`DROP INDEX "IDX_reports_target"`);
        await queryRunner.query(`DROP INDEX "IDX_reports_reporter"`);
        await queryRunner.query(`DROP INDEX "IDX_reports_status"`);
        await queryRunner.query(`DROP INDEX "IDX_reports_type"`);
        await queryRunner.query(`DROP TABLE "reports"`);
    }
}

