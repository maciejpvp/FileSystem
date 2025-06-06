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
  // const fileUUID = body.uuid || "";
  const filesToDelete = body.uuids || [];

  let successfullyDeleted = [];
  let failedToDelete = [];

  for (const fileUUID of filesToDelete) {
    let dynamoResult;

    try {
      dynamoResult = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { userId, uuid: fileUUID },
        }),
      );
    } catch (err) {
      failedToDelete.push(fileUUID);
      continue;
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
      failedToDelete.push(fileUUID);
      continue;
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
      failedToDelete.push(fileUUID);
      continue;
    }
    successfullyDeleted.push(fileUUID);
  }

  if (successfullyDeleted.length === 0) {
    return sendResponse(500, {
      success: false,
      successfullyDeleted,
    });
  }

  if (successfullyDeleted.length < filesToDelete.length) {
    return sendResponse(200, {
      success: true,
      notAll: failedToDelete, // INFO for frontend so not all files got successfully deleted
      successfullyDeleted,
    });
  }

  return sendResponse(200, {
    success: true,
    successfullyDeleted,
    debug: {},
  });
};
