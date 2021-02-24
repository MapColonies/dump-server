import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BUCKET_NAME_LENGTH_LIMIT, CHARACTER_LENGTH_LIMIT } from '../../common/utils/db';

export interface IDumpMetadata {
  id: string;
  name: string;
  bucket: string;
  timestamp: Date;
  description?: string;
}

@Entity()
export class DumpMetadata implements IDumpMetadata {
  @PrimaryGeneratedColumn('uuid')
  public readonly id!: string;

  @Column({ length: CHARACTER_LENGTH_LIMIT })
  public name!: string;

  @Column({ length: BUCKET_NAME_LENGTH_LIMIT })
  public bucket!: string;

  @Index('Timestamp-idx')
  @Column()
  public timestamp!: Date;

  @Column('text', { nullable: true })
  public description!: string;
}

export interface DumpMetadataResponse extends Omit<IDumpMetadata, 'bucket'> {
  url: string;
}
