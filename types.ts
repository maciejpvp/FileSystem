export type FileStructureDocument = {
  userId: { S: string };
  uuid: { S: string };
  parentPath: { S: string };
  fileName: { S: string };
  isFolder: { BOOL: boolean };
  isReady?: { BOOL: boolean };
  size?: { N: string };
};

export type FileType = {
  userId: string;
  uuid: string;
  parentPath: string;
  fileName: string;
  isFolder: boolean;
  isReady?: boolean;
  size?: string;
};
