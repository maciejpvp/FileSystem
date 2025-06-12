import { Stack } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Table } from "aws-cdk-lib/aws-dynamodb";

import { createUploadFileLambda } from "./UploadFileLambda";
import { createCreateFolderLambda } from "./CreateFolderLambda";
import { createGetFilesLambda } from "./GetFilesForUserLambda";
import { createDownloadFileLambda } from "./DownloadFileLambda";
import { createDeleteFileLambda } from "./DeleteFileLambda";
import { createDeleteFolderLambda } from "./DeleteFolderLambda";
import { createUpdateAvailableStorageLambda } from "./UpdateAvailableStorage";
import { createGetAvailableStorageLambda } from "./GetAvailableStorageLambda";

export function createLambdas(
  stack: Stack,
  bucket: Bucket,
  table: Table,
  userStorageTable: Table,
) {
  return {
    uploadFileLambda: createUploadFileLambda(
      stack,
      bucket,
      table,
      userStorageTable,
    ),
    createFolderLambda: createCreateFolderLambda(stack, bucket, table),
    getFilesLambda: createGetFilesLambda(stack, bucket, table),
    downloadFileLambda: createDownloadFileLambda(stack, bucket, table),
    deleteFileLambda: createDeleteFileLambda(
      stack,
      bucket,
      table,
      userStorageTable,
    ),
    deleteFolderLambda: createDeleteFolderLambda(
      stack,
      bucket,
      table,
      userStorageTable,
    ),
    updateAvailableStorage: createUpdateAvailableStorageLambda(
      stack,
      bucket,
      table,
      userStorageTable,
    ),
    getAvailableStorage: createGetAvailableStorageLambda(
      stack,
      userStorageTable,
    ),
  };
}
