#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MojacoderBackendStack } from '../lib/mojacoder-backend-stack';

const app = new cdk.App();
new MojacoderBackendStack(app, 'MojacoderBackendStack');
