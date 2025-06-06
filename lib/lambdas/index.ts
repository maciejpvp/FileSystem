import { Stack } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Table } from "aws-cdk-lib/aws-dynamodb";

import { createUploadFileLambda } from "./UploadFileLambda";
import { createCreateFolderLambda } from "./CreateFolderLambda";
import { createGetFilesLambda } from "./GetFilesForUserLambda";
import { createDownloadFileLambda } from "./DownloadFileLambda";
import { createDeleteFileLambda } from "./DeleteFileLambda";
import { createDeleteFolderLambda } from "./DeleteFolderLambda";

export function createLambdas(stack: Stack, bucket: Bucket, table: Table) {
  return {
    uploadFileLambda: createUploadFileLambda(stack, bucket, table),
    createFolderLambda: createCreateFolderLambda(stack, bucket, table),
    getFilesLambda: createGetFilesLambda(stack, bucket, table),
    downloadFileLambda: createDownloadFileLambda(stack, bucket, table),
    deleteFileLambda: createDeleteFileLambda(stack, bucket, table),
    deleteFolderLambda: createDeleteFolderLambda(stack, bucket, table),
  };
}
