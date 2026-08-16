import { GraphqlApi } from '@aws-cdk/aws-appsync';
import * as cdk from '@aws-cdk/core';
import { AppSyncWaf, WafAction } from '../lib/appsync-waf';

interface CloudFormationResource {
    Type: string
    Properties: {
        [key: string]: any
    }
}

function synthesizeWaf(
    rateLimitAction: WafAction,
    ipReputationAction: WafAction = 'count',
): {[logicalId: string]: CloudFormationResource} {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const api = GraphqlApi.fromGraphqlApiAttributes(stack, 'api', {
        graphqlApiId: 'test-api-id',
    });

    new AppSyncWaf(stack, 'appsync-waf', {
        api,
        rateLimit: 300,
        rateLimitAction,
        ipReputationAction,
    });

    return app.synth().getStackByName(stack.stackName).template.Resources;
}

function getResource(resources: {[logicalId: string]: CloudFormationResource}, type: string): CloudFormationResource {
    const resource = Object.values(resources).find(candidate => candidate.Type === type);
    if (resource === undefined) {
        throw new Error(`Resource not found: ${type}`);
    }
    return resource;
}

test.each([
    ['count', { Count: {} }],
    ['block', { Block: {} }],
] as Array<[WafAction, {[key: string]: any}]>)(
    'creates AppSync WAF with %s rate-limit action',
    (rateLimitAction, expectedAction) => {
        const resources = synthesizeWaf(rateLimitAction);
        const webAcl = getResource(resources, 'AWS::WAFv2::WebACL');
        const association = getResource(resources, 'AWS::WAFv2::WebACLAssociation');

        expect(webAcl.Properties.Scope).toBe('REGIONAL');
        expect(webAcl.Properties.DefaultAction).toEqual({ Allow: {} });
        expect(webAcl.Properties.Rules).toEqual([
            expect.objectContaining({
                Name: 'AWSManagedRulesAmazonIpReputationList',
                OverrideAction: { Count: {} },
                Priority: 0,
                Statement: {
                    ManagedRuleGroupStatement: {
                        Name: 'AWSManagedRulesAmazonIpReputationList',
                        VendorName: 'AWS',
                    },
                },
            }),
            expect.objectContaining({
                Action: expectedAction,
                Name: 'RateLimitPerIp',
                Priority: 1,
                Statement: {
                    RateBasedStatement: {
                        AggregateKeyType: 'IP',
                        Limit: 300,
                    },
                },
            }),
        ]);
        expect(association.Properties.ResourceArn).toEqual({
            'Fn::Join': ['', [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':appsync:',
                { Ref: 'AWS::Region' },
                ':',
                { Ref: 'AWS::AccountId' },
                ':apis/test-api-id',
            ]],
        });
        expect(association.Properties.WebACLArn).toEqual({
            'Fn::GetAtt': [expect.any(String), 'Arn'],
        });
    },
);

test.each([
    ['count', { Count: {} }],
    ['block', { None: {} }],
] as Array<[WafAction, {[key: string]: any}]>)(
    'creates AppSync WAF with %s IP-reputation action',
    (ipReputationAction, expectedOverrideAction) => {
        const resources = synthesizeWaf('count', ipReputationAction);
        const webAcl = getResource(resources, 'AWS::WAFv2::WebACL');
        const ipReputationRule = webAcl.Properties.Rules.find(
            (rule: {[key: string]: any}) => rule.Name === 'AWSManagedRulesAmazonIpReputationList',
        );

        expect(ipReputationRule.OverrideAction).toEqual(expectedOverrideAction);
    },
);
