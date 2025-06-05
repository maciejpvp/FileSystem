import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { deleteAllWithPrefix, deleteFromDynamo, sendResponse } from "../utils";
import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { FileType } from "../../types";
import { S3Client } from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const s3Client = new S3Client();
const dynamodb = new DynamoDBClient({});
const lambdaClient = new LambdaClient({});
const docClient = DynamoDBDocumentClient.from(dynamodb);
const tableName = process.env.DYNAMODB_NAME;
const bucketName = process.env.BUCKET_NAME;
const lambdaName = process.env.LAMBDA_NAME;

export const deleteFiles = async (
  path: string,
  userId: string,
  depth: number,
) => {
  const commandInput: QueryCommandInput = {
    TableName: tableName,
    IndexName: "byParentId",
    KeyConditionExpression: "parentPath = :parentPathValue",
    ExpressionAttributeValues: {
      ":parentPathValue": { S: path },
    },
  };

  const command = new QueryCommand(commandInput);
  const response = await dynamodb.send(command);
  const items = response.Items;

  if (!items) return true;

  let foundedFolders = [];

  for (const item of items) {
    const isAFolder = item.isFolder.BOOL;
    if (isAFolder) {
      foundedFolders.push(item);
      const payload = {
        uuid: item.uuid.S,
        depth: depth + 1,
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaName,
        InvocationType: "Event", // async
        Payload: Buffer.from(
          JSON.stringify({
            body: JSON.stringify(payload),
            requestContext: {
              authorizer: {
                claims: {
                  sub: userId,
                },
              },
            },
          }),
        ),
      });

      await lambdaClient.send(invokeCommand);
      continue;
    }

    await deleteFromDynamo(
      {
        userId: item.userId,
        uuid: item.uuid,
      },
      tableName!,
      dynamodb,
    );
  }

  return foundedFolders;
};

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;

  const body = JSON.parse(event.body || "{}");
  const depth = body.depth || 0;

  if (depth > 2) return sendResponse(500, { message: "Depth" });

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

  const folder = dynamoResult.Item as FileType;

  let parentPath = folder.parentPath.trim();

  if (!parentPath.endsWith("/")) {
    parentPath = parentPath + "/";
  }

  const path = `${parentPath}${folder.fileName}`;

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
  //Delete all files inside this folder

  const items = await deleteFiles(path, userId, depth);

  //Delete all files from s3
  const s3Success = await deleteAllWithPrefix(s3Client, bucketName!, path);

  if (!s3Success) {
    return sendResponse(500, {
      success: false,
    });
  }

  return sendResponse(200, {
    success: true,
    debug: {
      tableName,
      path,
      items,
    },
  });
};
