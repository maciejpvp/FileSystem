import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { createAuthResources } from "./auth/CognitoResources";
import { createUserFilesBucket } from "./storage/S3Bucket";
import { createFileStructureTable } from "./storage/DynamoDBTable";
import { createLambdas } from "./lambdas";
import { configureApiGateway } from "./api/ApiGatewayResources";
import { createWebsiteBucket } from "./website";

export class FileSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { websiteUrl } = createWebsiteBucket(this);
    const { userPool } = createAuthResources(this, websiteUrl);
    const bucket = createUserFilesBucket(this);
    const fileStructureDB = createFileStructureTable(this);

    const lambdas = createLambdas(this, bucket, fileStructureDB);
    configureApiGateway(this, userPool, lambdas);
  }
}
