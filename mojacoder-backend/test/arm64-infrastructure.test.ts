jest.mock('@aws-cdk/aws-lambda-nodejs/lib/bundling', () => {
    const lambda = require('@aws-cdk/aws-lambda');
    return {
        Bundling: {
            bundle: jest.fn(() => lambda.Code.fromInline('exports.handler = async () => null;')),
        },
    };
});

import * as cdk from '@aws-cdk/core';
import { Bundling } from '@aws-cdk/aws-lambda-nodejs/lib/bundling';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MojacoderBackendStack } from '../lib/mojacoder-backend-stack';

interface CloudFormationResource {
    Type: string
    Properties: {[key: string]: any}
}

test('configures ARM64 builds and execution for application Lambdas and the judge', () => {
    const config = JSON.parse(readFileSync(join(__dirname, '../cdk.json'), 'utf8'));
    const app = new cdk.App({ context: config.context });
    const stack = new MojacoderBackendStack(app, 'TestStack');
    const assembly = app.synth().getStackByName(stack.stackName);
    const resources = Object.values(assembly.template.Resources) as CloudFormationResource[];
    const functions = resources.filter(resource =>
        resource.Type === 'AWS::Lambda::Function' && resource.Properties.Runtime === 'nodejs16.x',
    );

    expect(functions).toHaveLength(10);
    for (const fn of functions) {
        expect(fn.Properties.Architectures).toEqual(['arm64']);
    }

    // Keep NodejsFunction real so its build architecture is checked as well as CloudFormation.
    const bundleCalls = (Bundling.bundle as jest.Mock).mock.calls;
    expect(bundleCalls).toHaveLength(10);
    for (const [options] of bundleCalls) {
        expect(options.architecture.dockerPlatform).toBe('linux/arm64');
        expect(options.runtime.name).toBe('nodejs16.x');
    }

    const tasks = resources.filter(resource => resource.Type === 'AWS::ECS::TaskDefinition');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].Properties.RuntimePlatform).toEqual({
        CpuArchitecture: 'ARM64',
        OperatingSystemFamily: 'LINUX',
    });
    expect(assembly.assets.filter(asset => asset.packaging === 'container-image')).toEqual([
        expect.objectContaining({ platform: 'linux/arm64' }),
    ]);
});
