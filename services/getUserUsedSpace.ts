import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const dynamodb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodb);

const userStorageTable = process.env.userStorageTable!;

type ReturnType = {
  usedSpace: string;
  pendingSpace: string;
};

export async function getUserUsedSpace(userId: string): Promise<ReturnType> {
  const response = await docClient.send(
    new GetCommand({
      TableName: userStorageTable,
      Key: { userId },
    }),
  );

  const item = response.Item as
    | { usedSpace?: string; pendingSpace?: string }
    | undefined;
  const usedSpace = item?.usedSpace ?? "0";
  const pendingSpace = item?.pendingSpace ?? "0";

  return { usedSpace, pendingSpace };
}
