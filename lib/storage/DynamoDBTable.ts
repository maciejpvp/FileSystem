import { Stack, RemovalPolicy } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export function createFileStructureTable(stack: Stack): dynamodb.Table {
  const table = new dynamodb.Table(stack, "fileStructureDB", {
    tableName: "fileStructureDB",
    partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
    sortKey: { name: "uuid", type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  table.addGlobalSecondaryIndex({
    indexName: "byParentId",
    partitionKey: { name: "parentPath", type: dynamodb.AttributeType.STRING },
    sortKey: { name: "fileName", type: dynamodb.AttributeType.STRING },
    projectionType: dynamodb.ProjectionType.ALL,
  });

  return table;
}
