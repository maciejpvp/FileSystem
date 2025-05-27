import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({
        message: "failed",
        err,
      }),
    };
  }

  const item = result?.Item;

  if (!item) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({
        errorCode: 1,
        message: "Item not found",
      }),
    };
  }

  if (item.isFolder) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({
        errorCode: 2,
        message: "Cant download a folder",
      }),
    };
  }

  const fileExtension = item.fileName.split(".").pop();

  const s3Path = `${item.parentPath}${item.uuid}.${fileExtension}`;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Path,
  });

  let url;
  try {
    url = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
      signingRegion: "eu-central-1",
    });
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({
        message: "failed",
        err,
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
      result,
      s3Path,
      url,
    }),
  };
};
