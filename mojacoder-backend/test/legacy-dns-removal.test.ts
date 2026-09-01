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
import { MojacoderBackendStack } from '../lib/mojacoder-backend-stack';

interface CloudFormationResource {
    Type: string
}

test('does not provision the legacy Route 53 zone or wildcard certificate', () => {
    const app = new cdk.App();
    const stack = new MojacoderBackendStack(app, 'TestStack');
    const resources = app.synth().getStackByName(stack.stackName).template.Resources as {
        [logicalId: string]: CloudFormationResource
    };

    expect(Object.values(resources).some(resource => resource.Type === 'AWS::Route53::HostedZone')).toBe(false);
    expect(Object.values(resources).some(resource => resource.Type === 'AWS::Route53::RecordSet')).toBe(false);
    expect(Object.values(resources).some(resource => resource.Type === 'AWS::CertificateManager::Certificate')).toBe(false);
});
