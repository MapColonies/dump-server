export interface DumpMetadata {
  id: string;
  name: string;
  bucket: string;
  timestamp: Date;
  description?: string;
  stateNumber?: number;
}

export interface DumpMetadataResponse extends Omit<DumpMetadata, 'bucket'> {
  url: string;
}

export interface DumpMetadataCreation extends Omit<DumpMetadata, 'id'> {}
