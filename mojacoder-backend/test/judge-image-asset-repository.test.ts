import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JUDGE_IMAGE_REPOSITORY_NAME } from '../lib/judge-image-repository-stack';

interface CloudFormationResource {
    Type: string
    Properties: {
        ContainerDefinitions: Array<{
            Image: any
        }>
    }
}

test('publishes the Judge image asset to its dedicated repository', () => {
    const cdkConfig = JSON.parse(readFileSync(join(__dirname, '../cdk.json'), 'utf8'));
    const app = new cdk.App({ context: cdkConfig.context });
    const stack = new cdk.Stack(app, 'TestStack');
    const taskDefinition = new ecs.FargateTaskDefinition(stack, 'task');
    taskDefinition.addContainer('judge', {
        image: ecs.ContainerImage.fromAsset(join(__dirname, '../judge-image')),
    });

    const resources = app.synth().getStackByName(stack.stackName).template.Resources as {
        [logicalId: string]: CloudFormationResource
    };
    const task = Object.values(resources).find(resource => resource.Type === 'AWS::ECS::TaskDefinition');

    expect(task).toBeDefined();
    expect(JSON.stringify(task!.Properties.ContainerDefinitions[0].Image)).toContain(
        `/${JUDGE_IMAGE_REPOSITORY_NAME}:`,
    );
});
