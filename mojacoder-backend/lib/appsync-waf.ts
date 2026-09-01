import { IGraphqlApi } from '@aws-cdk/aws-appsync';
import * as cdk from '@aws-cdk/core';
import { CfnWebACL, CfnWebACLAssociation } from '@aws-cdk/aws-wafv2';

export type WafAction = 'count' | 'block';

export interface AppSyncWafProps {
    api: IGraphqlApi
    geoRestrictionAction: WafAction
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
            description: 'Protects the MojaCoder AppSync API from non-Japanese traffic, known threats, and excessive requests.',
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'mojacoder-appsync-waf',
                sampledRequestsEnabled: true,
            },
            rules: [
                {
                    name: 'RestrictAccessToJapan',
                    priority: 0,
                    action: props.geoRestrictionAction === 'block' ? {
                        block: {},
                    } : {
                        count: {},
                    },
                    statement: {
                        notStatement: {
                            statement: {
                                geoMatchStatement: {
                                    countryCodes: ['JP'],
                                },
                            },
                        },
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'restrict-access-to-japan',
                        sampledRequestsEnabled: true,
                    },
                },
                {
                    name: 'AWSManagedRulesAmazonIpReputationList',
                    priority: 1,
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
                    priority: 2,
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
