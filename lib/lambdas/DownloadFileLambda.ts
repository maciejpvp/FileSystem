import { Stack } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export function createDownloadFileLambda(
  stack: Stack,
  bucket: Bucket,
  table: Table,
) {
  const fn = new NodejsFunction(stack, "downloadFileLambda", {
    runtime: lambda.Runtime.NODEJS_22_X,
    entry: path.join(__dirname, "../../lambdas/downloadFile/downloadFile.ts"),
    handler: "handler",
    environment: {
      BUCKET_NAME: bucket.bucketName,
      DYNAMODB_NAME: table.tableName,
    },
  });

  bucket.grantRead(fn);
  table.grantReadData(fn);
  return fn;
}
