import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedTimestampIndex1613566030377 implements MigrationInterface {
  public name = 'AddedTimestampIndex1613566030377';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX "Timestamp-idx" ON "dump_metadata" ("timestamp")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "Timestamp-idx"
        `);
  }
}
