import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

export function createWebsiteBucket(scope: cdk.Stack) {
  const websiteBucket = new s3.Bucket(scope, "WebsiteBucket", {
    websiteIndexDocument: "index.html",
    websiteErrorDocument: "index.html",
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    publicReadAccess: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
  });

  const distribution = new cloudfront.Distribution(scope, "WebsiteCDN", {
    defaultRootObject: "index.html",
    defaultBehavior: {
      // Updated origin configuration
      origin: new origins.S3StaticWebsiteOrigin(websiteBucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
  });

  new s3deploy.BucketDeployment(scope, "DeployWebsite", {
    sources: [s3deploy.Source.asset("./websiteBuild")],
    destinationBucket: websiteBucket,
    distribution,
    distributionPaths: ["/*"],
  });

  new cdk.CfnOutput(scope, "WebsiteURL", {
    value: `https://${distribution.domainName}`,
    description: "URL of the Static Website (HTTPS via CloudFront)",
  });

  return {
    bucket: websiteBucket,
    distribution,
    websiteUrl: `https://${distribution.domainName}`,
  };
}
