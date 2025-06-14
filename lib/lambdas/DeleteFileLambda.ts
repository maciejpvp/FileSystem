import { Stack } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export function createDeleteFileLambda(
  stack: Stack,
  bucket: Bucket,
  table: Table,
  userStorageTable: Table,
) {
  const fn = new NodejsFunction(stack, "deleteFileLambda", {
    runtime: lambda.Runtime.NODEJS_22_X,
    entry: path.join(__dirname, "../../lambdas/deleteFile/deleteFile.ts"),
    handler: "handler",
    environment: {
      BUCKET_NAME: bucket.bucketName,
      DYNAMODB_NAME: table.tableName,
      userStorageTable: userStorageTable.tableName,
    },
  });

  bucket.grantReadWrite(fn);
  table.grantReadWriteData(fn);
  userStorageTable.grantReadWriteData(fn);
  return fn;
}
