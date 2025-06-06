import { Stack } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { addCorsMock } from "../../utils/cors";

export function configureApiGateway(
  stack: Stack,
  userPool: cognito.UserPool,
  lambdas: any,
) {
  const api = new apigateway.RestApi(stack, "FileApi", {
    restApiName: "File Upload Service",
    binaryMediaTypes: ["multipart/form-data"],
  });

  const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
    stack,
    "MyAuthorizer",
    {
      cognitoUserPools: [userPool],
    },
  );

  const secureRoute = (
    name: string,
    method: string,
    lambda: any,
    resourcePath: string | string[],
  ) => {
    const parts = Array.isArray(resourcePath) ? resourcePath : [resourcePath];
    let current = api.root;
    for (const part of parts) {
      current = current.addResource(part);
      addCorsMock(current);
    }

    current.addMethod(method, new apigateway.LambdaIntegration(lambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      operationName: name,
    });
  };

  secureRoute("UploadFile", "POST", lambdas.uploadFileLambda, "upload-file");
  secureRoute("GetFiles", "POST", lambdas.getFilesLambda, "get-files");
  secureRoute("DownloadFile", "GET", lambdas.downloadFileLambda, [
    "download",
    "{uuid}",
  ]);
  secureRoute(
    "CreateFolder",
    "POST",
    lambdas.createFolderLambda,
    "create-folder",
  );
  secureRoute("DeleteFile", "DELETE", lambdas.deleteFileLambda, "delete-file");
  secureRoute(
    "DeleteFolder",
    "DELETE",
    lambdas.deleteFolderLambda,
    "delete-folder",
  );
}
