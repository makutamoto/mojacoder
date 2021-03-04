import * as cdk from '@aws-cdk/core'
import { join } from 'path';
import { GraphqlApi, MappingTemplate } from '@aws-cdk/aws-appsync';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { Bucket, HttpMethods } from '@aws-cdk/aws-s3'
import { LambdaDestination } from '@aws-cdk/aws-s3-notifications'
import { Duration } from '@aws-cdk/core';

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
                type: AttributeType.STRING,
            },
        });
        problemTable.addGlobalSecondaryIndex({
            indexName: 'status-index',
            partitionKey: {
                name: 'status',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        });
        problemTable.addGlobalSecondaryIndex({
            indexName: 'slug-index',
            partitionKey: {
                name: 'userID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'slug',
                type: AttributeType.STRING,
            },
        });
        const slugTable = new Table(this, 'slug-table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'userID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'slug',
                type: AttributeType.STRING,
            },
        });
        const likersTable = new Table(this, 'likers-table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'problemID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'userID',
                type: AttributeType.STRING,
            }
        });
        likersTable.addGlobalSecondaryIndex({
            indexName: 'datetime-index',
            partitionKey: {
                name: 'problemID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        });
        const commentTable = new Table(this, 'comment-table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'commentID',
                type: AttributeType.STRING,
            },
        });
        commentTable.addGlobalSecondaryIndex({
            indexName: 'problem-index',
            partitionKey: {
                name: 'problemID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        });
        const replyTable = new Table(this, 'reply-table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'replyID',
                type: AttributeType.STRING,
            },
        });
        replyTable.addGlobalSecondaryIndex({
            indexName: 'comment-index',
            partitionKey: {
                name: 'commentID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        });
        const postedProblems = new Bucket(this, 'postedProblems', {
            cors: [
                {
                    allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
                    allowedOrigins: ['https://mojacoder.vercel.app', 'http://localhost:3000'],
                    allowedHeaders: ['content-type'],
                }
            ]
        });
        this.testcases = new Bucket(this, 'testcases');
        const testcasesForView = new Bucket(this, 'testcases-for-view', {
            cors: [
                {
                    allowedMethods: [HttpMethods.GET],
                    allowedOrigins: ['https://mojacoder.app', 'http://localhost:3000'],
                    allowedHeaders: ['content-type'],
                }
            ],
        });
        const postedProblemsCreatedNotification = new NodejsFunction(this, 'postedProblemsCreatedNotification', {
            entry: join(__dirname, '../lambda/s3-posted-problems-created-notification/index.ts'),
            handler: 'handler',
            timeout: Duration.seconds(10),
            environment: {
                PROBLEM_TABLE_NAME: problemTable.tableName,
                SLUG_TABLE_NAME: slugTable.tableName,
                POSTED_PROBLEMS_BUCKET_NAME: postedProblems.bucketName,
                TESTCASES_BUCKET_NAME: this.testcases.bucketName,
                TESTCASES_FOR_VIEW_BUCKET_NAME: testcasesForView.bucketName,
            },
        });
        postedProblemsCreatedNotification.addToRolePolicy(new PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:GetItem'],
            resources: [postedProblems.bucketArn + '/*', this.testcases.bucketArn + '/*', testcasesForView.bucketArn + '/*', problemTable.tableArn, slugTable.tableArn],
        }))
        postedProblems.addObjectCreatedNotification(new LambdaDestination(postedProblemsCreatedNotification), {
            suffix: '.zip'
        });
        const issueProblemUploadUrlLambda = new NodejsFunction(this, 'issueProblemUploadUrl', {
            entry: join(__dirname, '../lambda/issue-problem-upload-url-resolver/index.ts'),
            handler: 'handler',
            environment: {
                POSTED_PROBLEMS_BUCKET_NAME: postedProblems.bucketName,
            },
        });
        issueProblemUploadUrlLambda.addToRolePolicy(new PolicyStatement({
            actions: ['s3:PutObject'],
            resources: [postedProblems.bucketArn + '/*'],
        }));
        const issueProblemUploadUrlLambdaDatasource = props.api.addLambdaDataSource('issueProblemUploadUrlLambda', issueProblemUploadUrlLambda);
        issueProblemUploadUrlLambdaDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'issueProblemUploadUrl',
        });
        const issueProblemDownloadUrlLambda = new NodejsFunction(this, 'issueProblemDownloadUrl', {
            entry: join(__dirname, '../lambda/issue-problem-download-url-resolver/index.ts'),
            handler: 'handler',
            environment: {
                POSTED_PROBLEMS_BUCKET_NAME: postedProblems.bucketName,
            },
        });
        issueProblemDownloadUrlLambda.addToRolePolicy(new PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [postedProblems.bucketArn + '/*'],
        }));
        const issueProblemDownloadUrlLambdaDatasource = props.api.addLambdaDataSource('issueProblemDownloadUrlLambda', issueProblemDownloadUrlLambda);
        issueProblemDownloadUrlLambdaDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'issueProblemDownloadUrl',
        });
        props.api.addNoneDataSource('testcase').createResolver({
            typeName: 'Problem',
            fieldName: 'testcase',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/testcase/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/testcase/response.vtl')),
        });
        props.api.addLambdaDataSource('testcaseInUrlLambda', new NodejsFunction(this, 'testcaseInUrl', {
            entry: join(__dirname, '../lambda/in-url-resolver/index.ts'),
            handler: 'handler',
            environment: {
                TESTCASES_FOR_VIEW: testcasesForView.bucketName,
            },
            initialPolicy: [
                new PolicyStatement({
                    actions: ['s3:GetObject'],
                    resources: [testcasesForView.bucketArn + '/*'],
                }),
            ],
        })).createResolver({
            typeName: 'Testcase',
            fieldName: 'inUrl',
        });
        props.api.addLambdaDataSource('testcaseOutUrlLambda', new NodejsFunction(this, 'testcaseOutUrl', {
            entry: join(__dirname, '../lambda/out-url-resolver/index.ts'),
            handler: 'handler',
            environment: {
                TESTCASES_FOR_VIEW: testcasesForView.bucketName,
            },
            initialPolicy: [
                new PolicyStatement({
                    actions: ['s3:GetObject'],
                    resources: [testcasesForView.bucketArn + '/*'],
                }),
            ],
        })).createResolver({
            typeName: 'Testcase',
            fieldName: 'outUrl',
        });
        const problemTableDataSource = props.api.addDynamoDbDataSource('problem_table', problemTable);
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
        problemTableDataSource.createResolver({
            typeName: 'Query',
            fieldName: 'newProblems',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/newProblems/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/newProblems/response.vtl')),
        });
        const likeProblemDatasource = props.api.addDynamoDbDataSource('likeProblem', likersTable);
        likeProblemDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['dynamodb:UpdateItem'],
            resources: [problemTable.tableArn],
        }));
        likeProblemDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'likeProblem',
            requestMappingTemplate: MappingTemplate.fromString(
                MappingTemplate.fromFile(join(__dirname, '../graphql/likeProblem/request.vtl')).renderTemplate()
                    .replace(/%LIKERS_TABLE%/g, likersTable.tableName)
                    .replace(/%PROBLEM_TABLE%/g, problemTable.tableName)
            ),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/likeProblem/response.vtl')),
        });
        const likersTableDatasource = props.api.addDynamoDbDataSource('likersTable', likersTable);
        likersTableDatasource.createResolver({
            typeName: 'Problem',
            fieldName: 'likedByMe',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/likedByMe/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/likedByMe/response.vtl')),
        });
        likersTableDatasource.createResolver({
            typeName: 'Problem',
            fieldName: 'likers',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/likers/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/likers/response.vtl')),
        });
        const postCommentDatasource = props.api.addDynamoDbDataSource('postComment', commentTable);
        postCommentDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['dynamodb:UpdateItem'],
            resources: [problemTable.tableArn],
        }))
        postCommentDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'postComment',
            requestMappingTemplate: MappingTemplate.fromString(
                MappingTemplate.fromFile(join(__dirname, '../graphql/postComment/request.vtl')).renderTemplate()
                    .replace(/%COMMENT_TABLE%/g, commentTable.tableName)
                    .replace(/%PROBLEM_TABLE%/g, problemTable.tableName)
            ),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/postComment/response.vtl')),
        });
        const commentTableDatasource = props.api.addDynamoDbDataSource('commentTable', commentTable);
        commentTableDatasource.createResolver({
            typeName: 'Problem',
            fieldName: 'comments',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/comments/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/comments/response.vtl')),
        });
        const postReplyDatasource = props.api.addDynamoDbDataSource('postReply', replyTable);
        postReplyDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['dynamodb:UpdateItem'],
            resources: [commentTable.tableArn],
        }))
        postReplyDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'postReply',
            requestMappingTemplate: MappingTemplate.fromString(
                MappingTemplate.fromFile(join(__dirname, '../graphql/postReply/request.vtl')).renderTemplate()
                    .replace(/%REPLY_TABLE%/g, replyTable.tableName)
                    .replace(/%COMMENT_TABLE%/g, commentTable.tableName)
            ),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/postReply/response.vtl')),
        });
        const replyTableDatasource = props.api.addDynamoDbDataSource('replyTable', replyTable);
        replyTableDatasource.createResolver({
            typeName: 'Comment',
            fieldName: 'replies',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/replies/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/replies/response.vtl')),
        });
        const slugTableDatasource = props.api.addDynamoDbDataSource('slugTable', slugTable);
        const deleteProblemGetItemFunction = slugTableDatasource.createFunction({
            name: 'deleteProblemGetItem',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteProblem/getItem/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteProblem/getItem/response.vtl')),
        });
        const deleteProblemDeleteItemsDatasource = props.api.addDynamoDbDataSource('deleteProblemDeleteItems', slugTable)
        deleteProblemDeleteItemsDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['dynamodb:UpdateItem'],
            resources: [problemTable.tableArn],
        }));
        const deleteProblemDeleteItemsFunction = deleteProblemDeleteItemsDatasource.createFunction({
            name: 'deleteProblemDeleteItems',
            requestMappingTemplate: MappingTemplate.fromString(
                MappingTemplate.fromFile(join(__dirname, '../graphql/deleteProblem/deleteItems/request.vtl')).renderTemplate()
                    .replace(/%SLUG_TABLE%/g, slugTable.tableName)
                    .replace(/%PROBLEM_TABLE%/g, problemTable.tableName)
            ),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteProblem/deleteItems/response.vtl')),
        });
        props.api.createResolver({
            typeName: 'Mutation',
            fieldName: 'deleteProblem',
            pipelineConfig: [deleteProblemGetItemFunction, deleteProblemDeleteItemsFunction],
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteProblem/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/deleteProblem/response.vtl')),
        });
    }
}
