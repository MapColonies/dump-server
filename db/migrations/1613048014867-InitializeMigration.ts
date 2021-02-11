import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializeMigration1613048014867 implements MigrationInterface {
  public name = 'InitializeMigration1613048014867';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "dump_metadata" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "bucket" character varying NOT NULL,
                "timestamp" TIMESTAMP NOT NULL,
                "description" text,
                CONSTRAINT "PK_8184d4a89d0e62adb70bcc0f37e" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "dump_metadata"
        `);
  }
}
