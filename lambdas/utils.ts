import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommandInput,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ListObjectsV2CommandOutput,
  _Object,
} from "@aws-sdk/client-s3";
import { FileStructureDocument } from "../types";
import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

export const sendResponse = (statusCode: number, data: any) => {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": "true",
    },
    body: JSON.stringify(data),
  };
};

export const uploadToS3 = async (
  commandInput: PutObjectCommandInput,
  client: S3Client,
): Promise<boolean> => {
  try {
    const command = new PutObjectCommand(commandInput);
    await client.send(command);
  } catch {
    return false;
  }

  return true;
};

export const deleteFromS3 = async (
  commandInput: DeleteObjectCommandInput,
  client: S3Client,
): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand(commandInput);
    await client.send(command);
  } catch {
    return false;
  }
  return true;
};

export const deleteAllWithPrefix = async (
  s3: S3Client,
  bucket: string,
  prefix: string,
): Promise<boolean> => {
  try {
    let continuationToken: string | undefined = undefined;

    do {
      const listResp: ListObjectsV2CommandOutput = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const objects =
        listResp.Contents?.map((obj: _Object) => ({
          Key: obj.Key!,
        })) || [];

      if (objects.length > 0) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: objects },
          }),
        );
      }

      continuationToken = listResp.NextContinuationToken;
    } while (continuationToken);
    return true;
  } catch {
    return false;
  }
};

export const uploadToDynamo = async (
  Item: any,
  TableName: string,
  client: DynamoDBClient,
) => {
  try {
    const commandInput: PutItemCommandInput = {
      TableName,
      Item,
    };
    const command = new PutItemCommand(commandInput);
    await client.send(command);
    return true;
  } catch {
    return false;
  }
};

export const deleteFromDynamo = async (
  key: { [key: string]: any },
  TableName: string,
  client: DynamoDBClient,
): Promise<boolean> => {
  try {
    const commandInput: DeleteItemCommandInput = {
      TableName,
      Key: key,
    };
    const command = new DeleteItemCommand(commandInput);
    await client.send(command);
    return true;
  } catch {
    return false;
  }
};

export const deleteAllItemsWithParentPath = async (
  path: string,
  TableName: string,
  client: DynamoDBClient,
): Promise<any> => {
  try {
    const commandInput: QueryCommandInput = {
      TableName,
      IndexName: "byParentId",
      KeyConditionExpression: "parentPath = :parentPathValue",
      ExpressionAttributeValues: {
        ":parentPathValue": { S: path },
      },
    };

    const command = new QueryCommand(commandInput);

    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error("Error deleting items by parentPath", error);
    return error;
  }
};
