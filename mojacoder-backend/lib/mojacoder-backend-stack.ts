import * as cdk from '@aws-cdk/core';

import { Zone } from './zone'
import { Users } from './users'
import { Problems } from './problems'
import { Judge } from './judge'
import { Contest } from './contests'
import { AppSyncWaf } from './appsync-waf'
import { resolveAppSyncWafConfig } from './appsync-waf-config'

export class MojacoderBackendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const wafConfig = resolveAppSyncWafConfig({
            appsyncWafRateLimit: this.node.tryGetContext('appsyncWafRateLimit'),
            appsyncWafRateLimitAction: this.node.tryGetContext('appsyncWafRateLimitAction'),
            appsyncWafIpReputationAction: this.node.tryGetContext('appsyncWafIpReputationAction'),
        })
        const zone = new Zone(this, 'zone')
        const users = new Users(this, 'users', { certificate: zone.certificate, zone: zone.zone  })
        new AppSyncWaf(this, 'appsync-waf', {
            api: users.api,
            ...wafConfig,
        })
        const problems = new Problems(this, 'problems', {
            api: users.api,
        })
        const judge = new Judge(this, 'judge', {
            api: users.api,
            testcases: problems.testcases,
            judgeCodes: problems.judgeCodes
        })
        new Contest(this, 'contest', {
            api: users.api,
            submissionTable: judge.submissionTable,
        })
    }
}
