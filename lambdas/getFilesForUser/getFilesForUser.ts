import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

const dynamodb = new DynamoDBClient({});

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userUuid = event.requestContext.authorizer?.claims.sub;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "test",
    }),
  };
};
