import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { sendResponse } from "../utils";

const dynamodb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodb);

const s3Client = new S3Client({
  region: "eu-central-1",
});

const tableName = process.env.DYNAMODB_NAME;
const bucketName = process.env.BUCKET_NAME;

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;
  const uuid = event.pathParameters?.uuid || "";

  let result;

  try {
    result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, uuid },
      }),
    );
  } catch (err) {
    return sendResponse(500, {
      message: "failed",
      err,
    });
  }

  const item = result?.Item;

  if (!item) {
    return sendResponse(400, {
      errorCode: 1,
      message: "Item not found",
    });
  }

  if (item.isFolder) {
    return sendResponse(400, {
      errorCode: 2,
      message: "Cant download a folder",
    });
  }

  const fileExtension = item.fileName.split(".").pop();

  let parentPath = item.parentPath.trim();

  if (!parentPath.endsWith("/")) {
    parentPath = parentPath + "/";
  }

  const s3Path = `${parentPath}${item.uuid}.${fileExtension}`;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Path,
    ResponseContentDisposition: `attachment; filename="${item.fileName}"`,
  });

  let url;
  try {
    url = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
      signingRegion: "eu-central-1",
    });
  } catch (err) {
    return sendResponse(500, {
      message: "failed",
      err,
    });
  }

  return sendResponse(200, {
    result,
    s3Path,
    url,
  });
};
