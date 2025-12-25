import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordResetFields1764531200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('users', new TableColumn({
            name: 'password_reset_token',
            type: 'varchar',
            isNullable: true,
        }));

        await queryRunner.addColumn('users', new TableColumn({
            name: 'password_reset_token_expires',
            type: 'timestamp',
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'password_reset_token_expires');
        await queryRunner.dropColumn('users', 'password_reset_token');
    }
}

