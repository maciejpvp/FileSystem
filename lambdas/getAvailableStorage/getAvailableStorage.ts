import { Handler } from "aws-cdk-lib/aws-lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendResponse } from "../utils";
import { getUserUsedSpace } from "../../services/getUserUsedSpace";

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext.authorizer?.claims.sub;

  const { usedSpace } = await getUserUsedSpace(userId);

  return sendResponse(200, {
    success: true,
    usedSpace,
  });
};
