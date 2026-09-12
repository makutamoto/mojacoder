jest.mock('@aws-cdk/aws-lambda-nodejs', () => {
    const lambda = require('@aws-cdk/aws-lambda');
    return {
        NodejsFunction: class extends lambda.Function {
            constructor(scope: any, id: string, props: any) {
                super(scope, id, {
                    code: lambda.Code.fromInline('exports.handler = async () => null;'),
                    environment: props.environment,
                    handler: 'index.handler',
                    runtime: props.runtime,
                    timeout: props.timeout,
                });
            }
        },
    };
});

jest.mock('@aws-cdk/aws-ecs', () => {
    const ecs = jest.requireActual('@aws-cdk/aws-ecs');
    return {
        ...ecs,
        ContainerImage: {
            fromAsset: () => ecs.ContainerImage.fromRegistry('public.ecr.aws/amazonlinux/amazonlinux:latest'),
        },
    };
});

import * as cdk from '@aws-cdk/core';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MojacoderBackendStack } from '../lib/mojacoder-backend-stack';

interface CloudFormationResource {
    Type: string
    Properties: {[key: string]: any}
}

test('provisions the AppSync API without a WAF Web ACL or association', () => {
    const config = JSON.parse(readFileSync(join(__dirname, '../cdk.json'), 'utf8'));
    const app = new cdk.App({ context: config.context });
    const stack = new MojacoderBackendStack(app, 'TestStack');
    const resources = Object.values(
        app.synth().getStackByName(stack.stackName).template.Resources,
    ) as CloudFormationResource[];

    expect(resources.filter(resource => resource.Type.startsWith('AWS::WAF'))).toEqual([]);
    expect(resources.filter(resource => resource.Type === 'AWS::AppSync::GraphQLApi')).toEqual([
        expect.objectContaining({
            Properties: expect.objectContaining({
                Name: 'mojacoder-api',
                AuthenticationType: 'API_KEY',
                AdditionalAuthenticationProviders: expect.arrayContaining([
                    expect.objectContaining({ AuthenticationType: 'AWS_IAM' }),
                    expect.objectContaining({ AuthenticationType: 'AMAZON_COGNITO_USER_POOLS' }),
                ]),
            }),
        }),
    ]);
});
