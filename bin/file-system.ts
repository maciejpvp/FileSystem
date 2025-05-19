#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FileSystemStack } from "../lib/file-system-stack";

const app = new cdk.App();

new FileSystemStack(
  app,
  "FileSystemStack",
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
);

