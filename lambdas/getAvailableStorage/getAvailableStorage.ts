import { Handler } from "aws-cdk-lib/aws-lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendResponse } from "../utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

type Item = {
  userId?: string;
  usedSpace?: string;
};

const dynamodb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodb);

const userStorageTable = process.env.userStorageTable;

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;

  let usedSpace: string;

  try {
    const response = await docClient.send(
      new GetCommand({
        TableName: userStorageTable,
        Key: { userId },
      }),
    );

    const item: Item = response.Item ? response.Item : {};

    usedSpace = item?.usedSpace ? item.usedSpace : "0";
  } catch (err) {
    return sendResponse(500, {
      success: false,
      err,
    });
  }

  return sendResponse(200, {
    success: true,
    usedSpace,
  });
};
