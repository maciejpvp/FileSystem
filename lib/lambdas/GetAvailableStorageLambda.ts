import { Stack } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export function createGetAvailableStorageLambda(
  stack: Stack,
  userStorageTable: Table,
) {
  const fn = new NodejsFunction(stack, "getAvailableStorage", {
    runtime: lambda.Runtime.NODEJS_22_X,
    entry: path.join(
      __dirname,
      "../../lambdas/getAvailableStorage/getAvailableStorage.ts",
    ),
    handler: "handler",
    environment: {
      userStorageTable: userStorageTable.tableName,
    },
  });

  userStorageTable.grantReadData(fn);
  return fn;
}
