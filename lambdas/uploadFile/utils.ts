import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";

import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { FileStructureDocument } from "../../types";

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

export const uploadToDynamo = async (
  Item: FileStructureDocument,
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
  return true;
};
