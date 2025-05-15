import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { FileStructureDocument } from "../../types";

export const uploadToDynamo = async (
  Item: FileStructureDocument,
  TableName: string,
  client: DynamoDBClient,
): Promise<boolean> => {
  try {
    const commandInput: PutItemCommandInput = {
      TableName,
      Item,
    };
    const command = new PutItemCommand(commandInput);
    await client.send(command);
  } catch {
    return false;
  }
  return true;
};
