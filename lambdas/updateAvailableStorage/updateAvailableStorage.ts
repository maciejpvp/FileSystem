import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { S3Event } from "aws-lambda";

const tableName = process.env.DYNAMODB_NAME;
const userStorageTable = process.env.userStorageTable;

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const eventName = record.eventName;

    // Sprawdzenie, czy to zdarzenie "ObjectCreated"
    if (!eventName.startsWith("ObjectCreated:")) {
      console.log(`Pominięto zdarzenie: ${eventName}`);
      continue;
    }

    const key = record.s3.object.key;
    const fileSize: number = record.s3.object.size;

    const userId = key.split("/").at(0);
    const uuid = key.split("/").at(-1)?.split(".").at(0);

    //Updating object of structure
    const params: UpdateCommandInput = {
      TableName: tableName,
      Key: {
        userId,
        uuid,
      },
      UpdateExpression: "SET isReady = :isReadyVal, size = :sizeVal",
      ExpressionAttributeValues: {
        ":isReadyVal": true,
        ":sizeVal": fileSize,
      },
      ReturnValues: "ALL_NEW",
    };

    try {
      const result = await docClient.send(new UpdateCommand(params));
      console.log("Zaktualizowano:", result.Attributes);
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }

    //Updating how many storage user used
    const params2: UpdateCommandInput = {
      TableName: userStorageTable,
      Key: {
        userId,
      },
      UpdateExpression:
        "SET usedSpace = if_not_exists(usedSpace, :zero) + :size",
      ExpressionAttributeValues: {
        ":size": fileSize,
        ":zero": 0,
      },
      ReturnValues: "ALL_NEW",
    };

    try {
      const result = await docClient.send(new UpdateCommand(params2));
      console.log("Zaktualizowano:", result.Attributes);
    } catch (error) {
      console.error("Błąd aktualizacji:", error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Przetwarzanie zakończone" }),
  };
};
