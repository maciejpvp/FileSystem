import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { FileStructureDocument } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { sendResponse, uploadToDynamo } from "../utils";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamodb = new DynamoDBClient({});
const MAX_DEPTH = 5;

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;
  const tableName = process.env.DYNAMODB_NAME || "";
  const body = JSON.parse(event.body || "{}");

  const path = body.path || "";

  const segments = path === "" ? [] : path.split("/");

  if (segments.length >= MAX_DEPTH) {
    return sendResponse(400, {
      errorCode: 2,
      message: `Max folder depth of ${MAX_DEPTH} exceeded`,
    });
  }

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
    return sendResponse(500, {
      errorCode: 1,
      folderName,
      item,
      message: "Something went wrong",
    });
  }

  const newItem = unmarshall(item);

  return sendResponse(200, { message: "Folder Created", item: newItem });
};
