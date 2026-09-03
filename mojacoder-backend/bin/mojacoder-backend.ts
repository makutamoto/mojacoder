#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { JudgeImageRepositoryStack } from '../lib/judge-image-repository-stack';
import { MojacoderBackendStack } from '../lib/mojacoder-backend-stack';

const app = new cdk.App();
const judgeImageRepositoryStack = new JudgeImageRepositoryStack(app, 'JudgeImageRepositoryStack');
const backendStack = new MojacoderBackendStack(app, 'MojacoderBackendStack');
backendStack.addDependency(judgeImageRepositoryStack);
