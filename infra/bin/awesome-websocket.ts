#!/usr/bin/env node
import 'source-map-support/register';
import { App, Environment } from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';

const app = new App();

/** Automatically populated by the CDK CLI when we run commands */
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

new AppStack(app, 'AwesomeWebsocket', { env });
