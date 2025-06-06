import { Stack } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";

export function createDeleteFolderLambda(
  stack: Stack,
  bucket: Bucket,
  table: Table,
) {
  const functionName = "DeleteFolderFunction";
  const fn = new NodejsFunction(stack, "deleteFolder", {
    functionName,
    runtime: lambda.Runtime.NODEJS_22_X,
    entry: path.join(__dirname, "../../lambdas/deleteFolder/deleteFolder.ts"),
    handler: "handler",
    environment: {
      BUCKET_NAME: bucket.bucketName,
      DYNAMODB_NAME: table.tableName,
      LAMBDA_NAME: functionName,
    },
  });

  bucket.grantReadWrite(fn);
  table.grantReadWriteData(fn);

  new iam.Policy(stack, "InvokeSelfPolicy", {
    statements: [
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [fn.functionArn],
      }),
    ],
  }).attachToRole(fn.role!);

  return fn;
}
