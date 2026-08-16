import * as cdk from '@aws-cdk/core';

import { Zone } from './zone'
import { Users } from './users'
import { Problems } from './problems'
import { Judge } from './judge'
import { Contest } from './contests'
import { AppSyncWaf, RateLimitAction } from './appsync-waf'

const DEFAULT_APPSYNC_WAF_RATE_LIMIT = 300
const DEFAULT_APPSYNC_WAF_RATE_LIMIT_ACTION: RateLimitAction = 'count'

export class MojacoderBackendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const zone = new Zone(this, 'zone')
        const users = new Users(this, 'users', { certificate: zone.certificate, zone: zone.zone  })
        const wafRateLimit = this.getWafRateLimit()
        const wafRateLimitAction = this.getWafRateLimitAction()
        new AppSyncWaf(this, 'appsync-waf', {
            api: users.api,
            rateLimit: wafRateLimit,
            rateLimitAction: wafRateLimitAction,
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

    private getWafRateLimit(): number {
        const configuredRateLimit = this.node.tryGetContext('appsyncWafRateLimit')
        if (configuredRateLimit === undefined) {
            return DEFAULT_APPSYNC_WAF_RATE_LIMIT
        }

        const rateLimit = Number(configuredRateLimit)
        if (!Number.isInteger(rateLimit) || rateLimit < 100) {
            throw new Error('appsyncWafRateLimit must be an integer greater than or equal to 100')
        }
        return rateLimit
    }

    private getWafRateLimitAction(): RateLimitAction {
        const configuredAction = this.node.tryGetContext('appsyncWafRateLimitAction')
        if (configuredAction === undefined) {
            return DEFAULT_APPSYNC_WAF_RATE_LIMIT_ACTION
        }
        if (configuredAction !== 'count' && configuredAction !== 'block') {
            throw new Error('appsyncWafRateLimitAction must be either count or block')
        }
        return configuredAction
    }
}
