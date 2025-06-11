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
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getUserUsedSpace } from "../../services/getUserUsedSpace";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

const s3 = new S3Client();
const dynamodb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodb);

const FREE_PLAN_SPACE = 5_000_000_000; // 5 GB

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;

  const fileUUID = uuidv4();

  const bucketName = process.env.BUCKET_NAME;
  const tableName = process.env.DYNAMODB_NAME || "";
  const userStorageTable = process.env.userStorageTable;

  const body = JSON.parse(event.body || "{}");
  const filename = body.filename;
  const filesize = body.filesize;

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

  const { usedSpace, pendingSpace } = await getUserUsedSpace(userId);

  if (
    Number(usedSpace) + Number(pendingSpace) + Number(filesize) >
    FREE_PLAN_SPACE
  ) {
    return sendResponse(400, {
      errorCode: 2,
      message: "Not enough space.",
    });
  }

  const addPendingSizeCommand: UpdateCommandInput = {
    TableName: userStorageTable,
    Key: {
      userId,
    },
    UpdateExpression:
      "SET pendingSpace = if_not_exists(pendingSpace, :zero) + :size",
    ExpressionAttributeValues: {
      ":size": filesize,
      ":zero": 0,
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const result = await docClient.send(
      new UpdateCommand(addPendingSizeCommand),
    );
    console.log("Zaktualizowano:", result.Attributes);
  } catch (error) {
    console.error("Błąd aktualizacji:", error);
  }

  const { url: signedUrl, fields } = await createPresignedPost(s3, {
    Bucket: bucketName!,
    Key: s3FilePath,
    Expires: 3600,
    Conditions: [["content-length-range", 0, filesize]],
  });

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
    fields,
  });
};
