import { IGraphqlApi } from '@aws-cdk/aws-appsync';
import * as cdk from '@aws-cdk/core';
import { CfnWebACL, CfnWebACLAssociation } from '@aws-cdk/aws-wafv2';

export type WafAction = 'count' | 'block';

export interface AppSyncWafProps {
    api: IGraphqlApi
    rateLimit: number
    rateLimitAction: WafAction
    ipReputationAction: WafAction
}

export class AppSyncWaf extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: AppSyncWafProps) {
        super(scope, id);

        const webAcl = new CfnWebACL(this, 'web-acl', {
            defaultAction: {
                allow: {},
            },
            description: 'Protects the MojaCoder AppSync API from known threats and excessive requests.',
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'mojacoder-appsync-waf',
                sampledRequestsEnabled: true,
            },
            rules: [
                {
                    name: 'AWSManagedRulesAmazonIpReputationList',
                    priority: 0,
                    overrideAction: props.ipReputationAction === 'block' ? {
                        none: {},
                    } : {
                        count: {},
                    },
                    statement: {
                        managedRuleGroupStatement: {
                            name: 'AWSManagedRulesAmazonIpReputationList',
                            vendorName: 'AWS',
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'amazon-ip-reputation-list',
                        sampledRequestsEnabled: true,
                    },
                },
                {
                    name: 'RateLimitPerIp',
                    priority: 1,
                    action: props.rateLimitAction === 'block' ? {
                        block: {},
                    } : {
                        count: {},
                    },
                    statement: {
                        rateBasedStatement: {
                            aggregateKeyType: 'IP',
                            limit: props.rateLimit,
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'rate-limit-per-ip',
                        sampledRequestsEnabled: true,
                    },
                },
            ],
        });

        new CfnWebACLAssociation(this, 'api-association', {
            resourceArn: props.api.arn,
            webAclArn: webAcl.attrArn,
        });
    }
}
