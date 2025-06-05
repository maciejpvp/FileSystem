import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { deleteFromDynamo, deleteFromS3, sendResponse } from "../utils";
import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { FileType } from "../../types";
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client();
const dynamodb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodb);
const tableName = process.env.DYNAMODB_NAME;
const bucketName = process.env.BUCKET_NAME;

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;

  const body = JSON.parse(event.body || "{}");
  const fileUUID = body.uuid || "";

  let dynamoResult;

  try {
    dynamoResult = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, uuid: fileUUID },
      }),
    );
  } catch (err) {
    return sendResponse(500, {
      message: "failed",
      err,
    });
  }

  const dynamoItem = dynamoResult.Item as FileType;

  const fileExtension = dynamoItem.fileName.split(".").pop();

  let parentPath = dynamoItem.parentPath.trim();

  if (!parentPath.endsWith("/")) {
    parentPath = parentPath + "/";
  }

  const s3Path = `${parentPath}${dynamoItem.uuid}.${fileExtension}`;

  const s3Success = await deleteFromS3(
    {
      Bucket: bucketName,
      Key: s3Path,
    },
    s3Client,
  );

  if (!s3Success) {
    return sendResponse(500, {
      success: false,
    });
  }

  const dynamoSuccess = await deleteFromDynamo(
    {
      userId: { S: userId },
      uuid: { S: fileUUID },
    },
    tableName!,
    dynamodb,
  );

  if (!dynamoSuccess) {
    return sendResponse(500, {
      success: false,
    });
  }

  return sendResponse(200, {
    success: true,
    debug: {
      dynamoResult,
      s3Path,
      s3Success,
      dynamoSuccess,
    },
  });
};
