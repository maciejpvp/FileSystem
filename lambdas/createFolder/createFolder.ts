import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { FileStructureDocument } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { uploadToDynamo } from "./utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({});

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;
  const tableName = process.env.DYNAMODB_NAME || "";
  const body = JSON.parse(event.body || "{}");

  const path = body.path || "";
  const folderName = body.name;
  const uuid = uuidv4();

  const item: FileStructureDocument = {
    userId: { S: userId },
    uuid: { S: uuid },
    parentPath: { S: `${userId}/${path}` },
    fileName: { S: folderName },
    isFolder: { BOOL: true },
  };

  const isDynamoUploadSuccess = await uploadToDynamo(item, tableName, dynamodb);

  if (!isDynamoUploadSuccess) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({
        errorCode: 1,
        folderName,
        item,
        message: "Something went wrong",
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
    },
    body: JSON.stringify({
      message: "Folder Created",
    }),
  };
};
