import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { sendResponse } from "../utils";

const dynamodb = new DynamoDBClient({});

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const tableName = process.env.DYNAMODB_NAME;
  const userId = event.requestContext.authorizer?.claims.sub;
  const body = JSON.parse(event.body || "{}");
  const path = body.path || "";

  const parentPath = `${userId}/${path}`;

  const commandInput: QueryCommandInput = {
    TableName: tableName,
    IndexName: "byParentId",
    KeyConditionExpression: "parentPath = :parentPathValue",
    ExpressionAttributeValues: {
      ":parentPathValue": { S: parentPath },
    },
  };

  const command = new QueryCommand(commandInput);

  const response = await dynamodb.send(command);

  const files = response.Items?.map((item) => unmarshall(item)) ?? [];

  return sendResponse(200, {
    message: "Successfully got files",
    files,
    response,
  });
};
