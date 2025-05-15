export type FileStructureDocument = {
  userId: { S: string };
  uuid: { S: string };
  parentPath: { S: string };
  fileName: { S: string };
  isFolder: { BOOL: boolean };
};
