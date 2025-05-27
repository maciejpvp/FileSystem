import {
  PassthroughBehavior,
  MockIntegration,
  MethodOptions,
  IResource,
} from "aws-cdk-lib/aws-apigateway";

export function addCorsMock(resource: IResource) {
  resource.addMethod(
    "OPTIONS",
    new MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": `'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'`,
            "method.response.header.Access-Control-Allow-Origin": `' *'`,
            "method.response.header.Access-Control-Allow-Methods": `'OPTIONS,GET,POST,PUT,PATCH,DELETE'`,
          },
          responseTemplates: {
            "application/json": "",
          },
        },
      ],
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Methods": true,
          },
        },
      ],
    } as MethodOptions,
  );
}
