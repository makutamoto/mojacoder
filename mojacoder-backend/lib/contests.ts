import * as cdk from '@aws-cdk/core'
import { join } from 'path';
import { GraphqlApi, MappingTemplate } from '@aws-cdk/aws-appsync';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as lambda from '@aws-cdk/aws-lambda';

export interface ContestProps {
    api: GraphqlApi
    submissionTable: Table
}

export class Contest extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: ContestProps) {
        super(scope, id);
        const contestTable = new Table(this, 'contestTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING,
            },
        })
        contestTable.addGlobalSecondaryIndex({
            indexName: 'contest-datetime-index',
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        })
        contestTable.addGlobalSecondaryIndex({
            indexName: 'contest-slug-index',
            partitionKey: {
                name: 'userID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'slug',
                type: AttributeType.STRING,
            }
        })
        contestTable.addGlobalSecondaryIndex({
            indexName: 'contest-userID-index',
            partitionKey: {
                name: 'userID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            }
        })
        contestTable.addGlobalSecondaryIndex({
            indexName: 'contest-status-index',
            partitionKey: {
                name: 'status',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        })
        const contestTableDatasource = props.api.addDynamoDbDataSource('contestTable', contestTable)
        contestTableDatasource.createResolver({
            typeName: 'UserDetail',
            fieldName: 'contest',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contest/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contest/response.vtl')),
        })
        contestTableDatasource.createResolver({
            typeName: 'UserDetail',
            fieldName: 'contests',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contests/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contests/response.vtl')),
        })
        contestTableDatasource.createResolver({
            typeName: 'Query',
            fieldName: 'newContests',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/newContests/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/newContests/response.vtl')),
        })

        props.api.createResolver({
            typeName: 'Mutation',
            fieldName: 'updateContest',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/updateContest/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/updateContest/response.vtl')),
            pipelineConfig: [
                contestTableDatasource.createFunction({
                    name: 'updateContestQuery',
                    requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/updateContest/query/request.vtl')),
                    responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/updateContest/query/response.vtl')),
                }),
                contestTableDatasource.createFunction({
                    name: 'updateContestUpdateItem',
                    requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/updateContest/updateItem/request.vtl')),
                    responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/updateContest/updateItem/response.vtl')),
                }),
            ],
        })
        
        const contestSlugTable = new Table(this, 'contestSlugTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'userID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'slug',
                type: AttributeType.STRING,
            },
        })
        const contestantTable = new Table(this, 'contestantTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'contestID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'userID',
                type: AttributeType.STRING,
            },
        })
        const contestantTableDatasource = props.api.addDynamoDbDataSource('contestantTable', contestantTable)
        contestantTableDatasource.createResolver({
            typeName: 'Contest',
            fieldName: 'detail',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contestDetail/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contestDetail/response.vtl')),
        })
        
        const contestProblemDatasouce = props.api.addNoneDataSource('contestProblem')
        contestProblemDatasouce.createResolver({
            typeName: 'ContestDetail',
            fieldName: 'problem',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contestProblem/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contestProblem/response.vtl')),
        })

        props.api.addLambdaDataSource('standingsLambda', new NodejsFunction(this, 'standings', {
            entry: join(__dirname, '../lambda/standings-resolver/index.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_16_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(10),
            environment: {
                CONTESTANT_TABLE: contestantTable.tableName,
                SUBMISSION_TABLE: props.submissionTable.tableName,
            },
            initialPolicy: [
                new PolicyStatement({
                    actions: ['dynamodb:Query'],
                    resources: [contestantTable.tableArn],
                }),
                new PolicyStatement({
                    actions: ['dynamodb:Query'],
                    resources: [props.submissionTable.tableArn + '/index/*'],
                }),
            ]
        })).createResolver({
            typeName: 'Contest',
            fieldName: 'standings',
        })

        const createContestDatasource = props.api.addDynamoDbDataSource('createContest', contestTable)
        createContestDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['dynamodb:PutItem'],
            resources: [contestSlugTable.tableArn],
        }))
        createContestDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'createContest',
            requestMappingTemplate: MappingTemplate.fromString(MappingTemplate.fromFile(join(__dirname, '../graphql/createContest/request.vtl')).renderTemplate().replace(/%CONTEST_TABLE%/g, contestTable.tableName).replace(/%CONTEST_SLUG_TABLE%/g, contestSlugTable.tableName)),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/createContest/response.vtl')),
        })
        
        props.api.createResolver({
            typeName: 'Mutation',
            fieldName: 'joinContest',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/joinContest/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/joinContest/response.vtl')),
            pipelineConfig: [
                contestTableDatasource.createFunction({
                    name: 'joinContestGetItem',
                    requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/joinContest/GetItem/request.vtl')),
                    responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/joinContest/GetItem/response.vtl')),
                }),
                contestantTableDatasource.createFunction({
                    name: 'joinContestPutOrDeleteItem',
                    requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/joinContest/PutOrDeleteItem/request.vtl')),
                    responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/joinContest/PutOrDeleteItem/response.vtl')),
                })
            ],
        })

        const deleteContestDatasource = props.api.addDynamoDbDataSource('deleteContest', contestTable)
        deleteContestDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['dynamodb:DeleteItem'],
            resources: [contestSlugTable.tableArn],
        }))
        props.api.createResolver({
            typeName: 'Mutation',
            fieldName: 'deleteContest',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteContest/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteContest/response.vtl')),
            pipelineConfig: [
                contestTableDatasource.createFunction({
                    name: 'DeleteContestQuery',
                    requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteContest/query/request.vtl')),
                    responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteContest/query/response.vtl')),
                }),
                deleteContestDatasource.createFunction({
                    name: 'DeleteContestDeleteItems',
                    requestMappingTemplate: MappingTemplate.fromString(MappingTemplate.fromFile(join(__dirname, '../graphql/deleteContest/deleteItems/request.vtl')).renderTemplate().replace(/%CONTEST_TABLE%/g, contestTable.tableName).replace(/%CONTEST_SLUG_TABLE%/g, contestSlugTable.tableName)),
                    responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteContest/deleteItems/response.vtl')),
                }),
            ],
        })
    }
}
