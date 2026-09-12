import * as cdk from '@aws-cdk/core';

import { Users } from './users'
import { Problems } from './problems'
import { Judge } from './judge'
import { Contest } from './contests'

export class MojacoderBackendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const users = new Users(this, 'users')
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
