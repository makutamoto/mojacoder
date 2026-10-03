import { GraphqlApi, Schema } from '@aws-cdk/aws-appsync';
import { Bucket } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JUDGE_IMAGE_REPOSITORY_NAME } from '../lib/judge-image-repository-stack';
import { Judge } from '../lib/judge';

interface CloudFormationResource {
    Type: string
    Properties: {[key: string]: any}
}

function synthesizeJudge() {
    const cdkConfig = JSON.parse(readFileSync(join(__dirname, '../cdk.json'), 'utf8'));
    const app = new cdk.App({ context: cdkConfig.context });
    const stack = new cdk.Stack(app, 'TestStack');
    new Judge(stack, 'judge', {
        api: new GraphqlApi(stack, 'api', {
            name: 'test-api',
            schema: Schema.fromAsset(join(__dirname, '../graphql/schema.graphql')),
        }),
        testcases: new Bucket(stack, 'testcases'),
        judgeCodes: new Bucket(stack, 'judgeCodes'),
    });

    return app.synth().getStackByName(stack.stackName);
}

test('runs the native ARM64 Judge image on Linux Fargate Spot 1.4.0', () => {
    const assembly = synthesizeJudge();
    const resources = Object.values(assembly.template.Resources) as CloudFormationResource[];
    const task = resources.find(resource => resource.Type === 'AWS::ECS::TaskDefinition');

    expect(task).toBeDefined();
    expect(task!.Properties).toMatchObject({
        Cpu: '1024',
        Memory: '2048',
        RuntimePlatform: {
            CpuArchitecture: 'ARM64',
            OperatingSystemFamily: 'LINUX',
        },
    });
    expect(JSON.stringify(task!.Properties.ContainerDefinitions[0].Image)).toContain(
        `/${JUDGE_IMAGE_REPOSITORY_NAME}:`,
    );
    expect(assembly.assets.filter(asset => asset.packaging === 'container-image')).toEqual([
        expect.objectContaining({
            platform: 'linux/arm64',
            repositoryName: JUDGE_IMAGE_REPOSITORY_NAME,
        }),
    ]);
    const service = resources.find(resource => resource.Type === 'AWS::ECS::Service');
    expect(service!.Properties).toMatchObject({
        PlatformVersion: '1.4.0',
        CapacityProviderStrategy: [{ CapacityProvider: 'FARGATE_SPOT', Base: 1, Weight: 1 }],
    });
    const scaling = resources.find(resource => resource.Type === 'AWS::ApplicationAutoScaling::ScalableTarget');
    expect(scaling!.Properties).toMatchObject({ MaxCapacity: 2, MinCapacity: 1 });
});
