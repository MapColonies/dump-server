import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedStateNumber1663069946601 implements MigrationInterface {
  public name = 'AddedStateNumber1663069946601';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "dump_server"."dump_metadata"
            ADD "state_number" integer
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "dump_server"."dump_metadata" DROP COLUMN "state_number"
        `);
  }
}
