import {
  S3Client,
  PutObjectCommandInput,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { FileStructureDocument } from "../../types";
import { sendResponse, uploadToDynamo, uploadToS3 } from "../utils";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client();
const dynamodb = new DynamoDBClient({});

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;

  const fileUUID = uuidv4();

  const bucketName = process.env.BUCKET_NAME;
  const tableName = process.env.DYNAMODB_NAME || "";

  const body = JSON.parse(event.body || "{}");
  const filename = body.filename;

  if (!filename)
    return sendResponse(400, {
      errorCode: 2,
      message: "Filename is required.",
    });

  const fileExtension = filename.split(".").pop();
  const path = body.path;

  let s3FilePath;

  if (path) {
    s3FilePath = `${userId}/${path}/${fileUUID}.${fileExtension}`;
  } else {
    s3FilePath = `${userId}/${fileUUID}.${fileExtension}`;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3FilePath,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  const item: FileStructureDocument = {
    userId: { S: userId },
    uuid: { S: fileUUID },
    parentPath: { S: `${userId}/${path ? path : ""}` },
    fileName: { S: filename },
    isFolder: { BOOL: false },
    isReady: { BOOL: false },
  };

  const isDynamoUploadSuccess = await uploadToDynamo(item, tableName, dynamodb);

  if (!isDynamoUploadSuccess) {
    return sendResponse(500, {
      errorCode: 1,
      message: "Something went wrong",
    });
  }

  const newItem = unmarshall(item);

  return sendResponse(201, {
    message: "Successfully uploaded file",
    signedUrl,
    isDynamoUploadSuccess,
    item: newItem,
  });
};
