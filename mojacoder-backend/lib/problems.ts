import * as cdk from '@aws-cdk/core'
import { join } from 'path';
import { GraphqlApi, MappingTemplate } from '@aws-cdk/aws-appsync';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { Bucket } from '@aws-cdk/aws-s3'
import { LambdaDestination } from '@aws-cdk/aws-s3-notifications'

export interface ProblemsProps {
    api: GraphqlApi
}

export class Problems extends cdk.Construct {
    public readonly testcases: Bucket
    
    constructor(scope: cdk.Construct, id: string, props: ProblemsProps) {
        super(scope, id);
        const problemTable = new Table(this, 'problem-table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING,
            },
        });
        problemTable.addGlobalSecondaryIndex({
            indexName: 'userID-index',
            partitionKey: {
                name: 'userID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.NUMBER,
            },
        });
        const postedProblems = new Bucket(this, 'postedProblems');
        this.testcases = new Bucket(this, 'testcases');
        const postedProblemsCreatedNotification = new NodejsFunction(this, 'postedProblemsCreatedNotification', {
            entry: join(__dirname, '../lambda/s3-posted-problems-created-notification/index.ts'),
            handler: 'handler',
            environment: {
                TABLE_NAME: problemTable.tableName,
                POSTED_PROBLEMS_BUCKET_NAME: postedProblems.bucketName,
                TESTCASES_BUCKET_NAME: this.testcases.bucketName,
            },
        });
        postedProblemsCreatedNotification.addToRolePolicy(new PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject', 'dynamodb:UpdateItem'],
            resources: [postedProblems.bucketArn + '/*', this.testcases.bucketArn + '/*', problemTable.tableArn],
        }))
        postedProblems.addObjectCreatedNotification(new LambdaDestination(postedProblemsCreatedNotification), {
            suffix: '.zip'
        });
        const problemTableDataSource = props.api.addDynamoDbDataSource('problem_table', problemTable);
        problemTableDataSource.createResolver({
            typeName: 'Mutation',
            fieldName: 'postProblem',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/postProblem/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/postProblem/response.vtl')),
        });
        problemTableDataSource.createResolver({
            typeName: 'UserDetail',
            fieldName: 'problem',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/problem/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/problem/response.vtl')),
        });
        problemTableDataSource.createResolver({
            typeName: 'UserDetail',
            fieldName: 'problems',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/problems/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/problems/response.vtl')),
        });
    }
}
