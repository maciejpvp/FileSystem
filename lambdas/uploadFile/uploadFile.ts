import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import * as parser from "lambda-multipart-parser-v2";
import { uploadToDynamo, uploadToS3 } from "./utils";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { FileStructureDocument } from "../../types";

const s3 = new S3Client();
const dynamodb = new DynamoDBClient({});

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const result = await parser.parse(event);

  const userId = event.requestContext.authorizer?.claims.sub;

  const fileUUID = uuidv4();

  const bucketName = process.env.BUCKET_NAME;
  const tableName = process.env.DYNAMODB_NAME || "";

  const file = result.files[0];
  const fileExtension = file.filename.split(".").pop();
  const path = result.path;

  let s3FilePath;

  if (path) {
    s3FilePath = `${userId}/${path}/${fileUUID}`;
  } else {
    s3FilePath = `${userId}/${fileUUID}.${fileExtension}`;
  }

  const s3CommandInput: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: s3FilePath,
    Body: file.content,
    ContentType: file.contentType,
  };

  const isS3UploadSuccess = await uploadToS3(s3CommandInput, s3);

  if (!isS3UploadSuccess) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        errorCode: 1,
        message: "Something went wrong",
      }),
    };
  }

  const item: FileStructureDocument = {
    userId: { S: userId },
    uuid: { S: fileUUID },
    parentPath: { S: "/" },
    fileName: { S: file.filename },
    isFolder: { BOOL: false },
  };

  const isDynamoUploadSuccess = await uploadToDynamo(item, tableName, dynamodb);

  if (!isDynamoUploadSuccess) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        errorCode: 1,
        message: "Something went wrong",
      }),
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Successfully uploaded file",
      tableName,
      isDynamoUploadSuccess,
      item,
      fileContentType: file.contentType,
    }),
  };
};
