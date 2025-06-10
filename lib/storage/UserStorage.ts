import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export function createUserStorageTable(stack: Stack): dynamodb.Table {
  const table = new dynamodb.Table(stack, "userStorageDB", {
    tableName: "userStorageDB",
    partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  return table;
}
