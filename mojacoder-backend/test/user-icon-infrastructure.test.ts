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

import * as cdk from '@aws-cdk/core';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Users } from '../lib/users';

interface CloudFormationResource {
    Type: string
    Properties: {
        [key: string]: any
    }
    DeletionPolicy?: string
    UpdateReplacePolicy?: string
}

function synthesizeUsers(): {[logicalId: string]: CloudFormationResource} {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new Users(stack, 'users');

    return app.synth().getStackByName(stack.stackName).template.Resources;
}

function getResource(
    resources: {[logicalId: string]: CloudFormationResource},
    type: string,
): [string, CloudFormationResource] {
    const entry = Object.entries(resources).find(([, resource]) => resource.Type === type);
    if (entry === undefined) {
        throw new Error(`Resource not found: ${type}`);
    }
    return entry;
}

test('retains a private user icon bucket without a public endpoint', () => {
    const resources = synthesizeUsers();
    const [, bucket] = getResource(resources, 'AWS::S3::Bucket');

    expect(bucket.DeletionPolicy).toBe('Retain');
    expect(bucket.UpdateReplacePolicy).toBe('Retain');
    expect(bucket.Properties.AccessControl).toBeUndefined();
    expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
    });
    expect(Object.values(resources).some(resource => resource.Type === 'AWS::S3::BucketPolicy')).toBe(false);
    expect(Object.values(resources).some(resource => resource.Type === 'AWS::CloudFront::Distribution')).toBe(false);
    expect(Object.values(resources).some(resource => resource.Type === 'AWS::CloudFront::CachePolicy')).toBe(false);
    expect(
        Object.values(resources).some(
            resource => resource.Type === 'AWS::CloudFront::CloudFrontOriginAccessIdentity',
        ),
    ).toBe(false);
    expect(Object.values(resources).some(resource => resource.Type === 'AWS::Route53::RecordSet')).toBe(false);
});

test('removes the user icon write API while retaining its infrastructure', () => {
    const resources = synthesizeUsers();
    const schema = readFileSync(join(__dirname, '../graphql/schema.graphql'), 'utf8');

    const setUserIconLambda = Object.entries(resources).find(([logicalId, resource]) =>
        resource.Type === 'AWS::Lambda::Function' && /setUserIcon/i.test(logicalId),
    );
    const setUserIconResolver = Object.values(resources).find(resource =>
        resource.Type === 'AWS::AppSync::Resolver'
        && resource.Properties.TypeName === 'Mutation'
        && resource.Properties.FieldName === 'setUserIcon',
    );

    expect(setUserIconLambda).toBeUndefined();
    expect(setUserIconResolver).toBeUndefined();
    expect(schema).not.toContain('setUserIcon');
    expect(schema).not.toContain('SetUserIconInput');
    expect(existsSync(join(__dirname, '../lambda/set-user-icon/index.ts'))).toBe(false);
});
