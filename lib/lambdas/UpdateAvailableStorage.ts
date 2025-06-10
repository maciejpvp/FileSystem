import { Stack } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export function createUpdateAvailableStorageLambda(
  stack: Stack,
  bucket: Bucket,
  table: Table,
  userStorageTable: Table,
) {
  const fn = new NodejsFunction(stack, "updateAvailableStorage", {
    runtime: lambda.Runtime.NODEJS_22_X,
    entry: path.join(
      __dirname,
      "../../lambdas/updateAvailableStorage/updateAvailableStorage.ts",
    ),
    handler: "handler",
    environment: {
      BUCKET_NAME: bucket.bucketName,
      DYNAMODB_NAME: table.tableName,
      userStorageTable: userStorageTable.tableName,
    },
  });

  table.grantReadWriteData(fn);
  userStorageTable.grantReadWriteData(fn);

  bucket.grantReadWrite(fn);

  bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3n.LambdaDestination(fn),
  );

  return fn;
}
