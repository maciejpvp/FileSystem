import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamo from "aws-cdk-lib/aws-dynamodb";

export class FileSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /////////////////////////////////
    // Cognito
    /////////////////////////////////

    const userPool = new cognito.UserPool(this, "MyUserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
    });

    userPool.addDomain("UserPoolDomian", {
      cognitoDomain: {
        domainPrefix: "file-system-maciejpvp-nyasdads7",
      },
    });

    const userPoolClient = new cognito.UserPoolClient(
      this,
      "MyUserPoolClient",
      {
        userPool,
        generateSecret: false,
      },
    );

    /////////////////////////////////
    // S3 Bucket
    /////////////////////////////////

    const bucket = new s3.Bucket(this, "UserFilesBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    /////////////////////////////////
    // DynamoDB
    /////////////////////////////////

    const fileStructureDB = new dynamo.Table(this, "fileStructureDB", {
      tableName: "fileStructureDB",
      partitionKey: {
        name: "userId",
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: "uuid",
        type: dynamo.AttributeType.STRING,
      },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    fileStructureDB.addGlobalSecondaryIndex({
      indexName: "byParentId",
      partitionKey: {
        name: "parentPath",
        type: dynamo.AttributeType.STRING,
      },
      sortKey: {
        name: "fileName",
        type: dynamo.AttributeType.STRING,
      },
      projectionType: dynamo.ProjectionType.ALL,
    });

    /////////////////////////////////
    // Lambda
    /////////////////////////////////

    const uploadFileLambda = new NodejsFunction(this, "uploadFileLambda", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../lambdas/uploadFile/uploadFile.ts"),
      handler: "handler",
      environment: {
        BUCKET_NAME: bucket.bucketName,
        DYNAMODB_NAME: fileStructureDB.tableName,
      },
    });
    bucket.grantPut(uploadFileLambda);
    fileStructureDB.grantWriteData(uploadFileLambda);

    const getFilesForUser = new NodejsFunction(this, "getFilesForUser", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      entry: path.join(
        __dirname,
        "../lambdas/getFilesForUser/getFilesForUser.ts",
      ),
      handler: "handler",
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    bucket.grantRead(getFilesForUser);
    fileStructureDB.grantReadData(getFilesForUser);

    /////////////////////////////////
    // API Gateway
    /////////////////////////////////

    const api = new apigateway.RestApi(this, "FileApi", {
      restApiName: "File Upload Service",
      binaryMediaTypes: ["multipart/form-data"],
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "MyAuthorizer",
      {
        cognitoUserPools: [userPool],
      },
    );

    const uploadResource = api.root.addResource("upload-file");
    uploadResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(uploadFileLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      },
    );

    const getResource = api.root.addResource("get-files");
    getResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFilesForUser),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      },
    );
  }
}
