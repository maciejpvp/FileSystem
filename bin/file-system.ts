#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FileSystemStack } from "../lib/file-system-stack";

const app = new cdk.App();

new FileSystemStack(
  app,
  "FileSystemStack",
  {
    env: {
      account: "445567075183",
      region: "eu-central-1",
    },
  },
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
);
