export interface DumpMetadata {
  id: string;
  name: string;
  bucket: string;
  timestamp: Date;
  description?: string;
  sequenceNumber?: number;
}

export interface DumpMetadataResponse extends Omit<DumpMetadata, 'bucket'> {
  url: string;
}

export interface DumpMetadataCreation extends Omit<DumpMetadata, 'id'> {}
