import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column()
  public name!: string;

  @Column()
  public bucket!: string;

  @Column({ type: 'timestamp' })
  public timestamp!: Date;

  @Column('text', { nullable: true })
  public description!: string;
}

export interface DumpMetadataResponse extends Omit<IDumpMetadata, 'bucket'> {
  url: string;
}
