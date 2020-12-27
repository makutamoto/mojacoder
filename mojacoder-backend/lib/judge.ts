import * as cdk from '@aws-cdk/core'
import { Queue } from '@aws-cdk/aws-sqs';
import { CfnAccessKey, PolicyStatement, User } from '@aws-cdk/aws-iam';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { SubnetType, Vpc } from '@aws-cdk/aws-ec2';
import { AwsLogDriver, Cluster, ContainerImage, FargateService, FargateTaskDefinition } from '@aws-cdk/aws-ecs';
import { Bucket } from '@aws-cdk/aws-s3'
import { GraphqlApi, MappingTemplate } from '@aws-cdk/aws-appsync';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { join } from 'path';

export interface JudgeProps {
    api: GraphqlApi
    testcases: Bucket
}

export class Judge extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: JudgeProps) {
        super(scope, id);
        const JudgeQueueDeadLetterQueue = new Queue(this, 'JudgeQueueDeadLetterQueue');
        const JudgeQueue = new Queue(this, 'JudgeQueue', {
            deadLetterQueue: {
                queue: JudgeQueueDeadLetterQueue,
                maxReceiveCount: 4,
            }
        });
        const submissionTable = new Table(this, 'submissionTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING,
            },
        });
        submissionTable.addGlobalSecondaryIndex({
            indexName: 'problemID-index',
            partitionKey: {
                name: 'problemID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        });
        const submittedCodeBucket = new Bucket(this, 'submittedCodeBucket');
        const playgroundCodeBucket = new Bucket(this, 'playgroundCodeBucket');
        const vpc = new Vpc(this, 'vpc', {
            natGateways: 0,
            subnetConfiguration: [
                {
                    name: 'judge-subnet',
                    subnetType: SubnetType.PUBLIC,
                }
            ],
        });
        const JudgeUser = new User(this, 'JudgeUser');
        JudgeUser.addToPolicy(new PolicyStatement({
            resources: [props.api.arn + '/*'],
            actions: ['appsync:GraphQL'],
        }));
        JudgeUser.addToPolicy(new PolicyStatement({
            resources: [JudgeQueue.queueArn],
            actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage'],
        }));
        JudgeUser.addToPolicy(new PolicyStatement({
            resources: [submissionTable.tableArn],
            actions: ['dynamodb:UpdateItem'],
        }));
        JudgeUser.addToPolicy(new PolicyStatement({
            resources: [playgroundCodeBucket.bucketArn + '/*'],
            actions: ['s3:GetObject', 's3:DeleteObject'],
        }));
        JudgeUser.addToPolicy(new PolicyStatement({
            resources: [submittedCodeBucket.bucketArn + '/*', props.testcases.bucketArn + '/*'],
            actions: ['s3:GetObject'],
        }));
        const accessKey = new CfnAccessKey(this, 'JudgeUserAccessKey', {
            userName: JudgeUser.userName,
        });
        const approximateNumberOfMessagesVisible = JudgeQueue.metricApproximateNumberOfMessagesVisible();
        const judgeCluster = new Cluster(this, 'judge-cluster', {
            vpc,
        });
        const judgeTask = new FargateTaskDefinition(this, 'judge-task');
        judgeTask.addContainer('judge-container', {
            image: ContainerImage.fromAsset(join(__dirname, '../judge-image')),
            logging: new AwsLogDriver({
                streamPrefix: 'judge-container',
            }),
            environment: {
                AWS_ACCESS_KEY_ID: accessKey.ref,
                AWS_SECRET_ACCESS_KEY: accessKey.attrSecretAccessKey,
                API_ENDPOINT: props.api.graphqlUrl,
                JUDGEQUEUE_URL: JudgeQueue.queueUrl,
                SUBMISSION_TABLE_NAME: submissionTable.tableName,
                PLAYGROUND_CODE_BUCKET_NAME: playgroundCodeBucket.bucketName,
                SUBMITTED_CODE_BUCKET_NAME: submittedCodeBucket.bucketName,
                TESTCASES_BUCKET_NAME: props.testcases.bucketName,
            },
        });
        judgeTask.addToExecutionRolePolicy(new PolicyStatement({
            resources: ['*'],
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        }))
        const judgeService = new FargateService(this, 'judge-service', {
            cluster: judgeCluster,
            taskDefinition: judgeTask,
            assignPublicIp: true,
        });
        const judgeScale = judgeService.autoScaleTaskCount({
            maxCapacity: 2,
        });
        judgeScale.scaleOnMetric('judge-scale-by-queue', {
            metric: approximateNumberOfMessagesVisible,
            scalingSteps: [
                {
                    upper: 0,
                    change: -1,
                },
                {
                    lower: 100,
                    change: 1,
                },
            ],
        });
        const submitCodeResolverLambda = new NodejsFunction(this, 'submitCodeResolverLambda', {
            entry: join(__dirname, '../lambda/submit-code-resolver/index.ts'),
            handler: 'handler',
            environment: {
                SUBMISSION_TABLE_NAME: submissionTable.tableName,
                SUBMITTED_CODE_BUCKET_NAME: submittedCodeBucket.bucketName,
                JUDGEQUEUE_URL: JudgeQueue.queueUrl,
            },
        });
        submitCodeResolverLambda.addToRolePolicy(new PolicyStatement({
            resources: [submissionTable.tableArn, submittedCodeBucket.bucketArn + '/*', JudgeQueue.queueArn],
            actions: ['dynamodb:PutItem', 's3:PutObject', 'sqs:SendMessage'],
        }));
        const submitCodeResolverLambdaDatasource = props.api.addLambdaDataSource('submitCodeResolverLambda', submitCodeResolverLambda);
        submitCodeResolverLambdaDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'submitCode',
        });
        const runPlaygroundResolverLambda = new NodejsFunction(this, 'runPlaygroundResolverLambda', {
            entry: join(__dirname, '../lambda/run-playground-resolver/index.ts'),
            handler: 'handler',
            environment: {
                PLAYGROUND_CODE_BUCKET_NAME: playgroundCodeBucket.bucketName,
                JUDGEQUEUE_URL: JudgeQueue.queueUrl,
            },
        })
        runPlaygroundResolverLambda.addToRolePolicy(new PolicyStatement({
            resources: [playgroundCodeBucket.bucketArn + '/*', JudgeQueue.queueArn],
            actions: ['s3:PutObject', 'sqs:SendMessage'],
        }));
        const runPlaygroundResolverLambdaDataSource = props.api.addLambdaDataSource('runPlaygroundResolverLambdaDataSource', runPlaygroundResolverLambda)
        runPlaygroundResolverLambdaDataSource.createResolver({
            typeName: 'Mutation',
            fieldName: 'runPlayground',
        })
        const submittedCodeBucketDatasource = props.api.addHttpDataSource('submittedCodeBucket', submittedCodeBucket.bucketWebsiteUrl, {
            authorizationConfig: {
                signingRegion: 'ap-northeast-1',
                signingServiceName: 's3',
            },
        });
        submittedCodeBucketDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [submittedCodeBucket.bucketArn + '/*'],
        }))
        submittedCodeBucketDatasource.createResolver({
            typeName: 'Submission',
            fieldName: 'code',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/code/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/code/response.vtl')),
        })
        const PlaygroundDataSource = props.api.addNoneDataSource('Playground');
        PlaygroundDataSource.createResolver({
            typeName: 'Mutation',
            fieldName: 'responsePlayground',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/responsePlayground/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/responsePlayground/response.vtl')),
        });
        PlaygroundDataSource.createResolver({
            typeName: 'Subscription',
            fieldName: 'onResponsePlayground',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/onResponsePlayground/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/onResponsePlayground/response.vtl')),
        });
        const submissionTableDataSource = props.api.addDynamoDbDataSource('submission_table', submissionTable);
        submissionTableDataSource.createResolver({
            typeName: 'Problem',
            fieldName: 'submission',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submission/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submission/response.vtl')),
        });
        submissionTableDataSource.createResolver({
            typeName: 'Problem',
            fieldName: 'submissions',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submissions/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submissions/response.vtl')),
        });
        submissionTableDataSource.createResolver({
            typeName: 'Mutation',
            fieldName: 'updateSubmission',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/updateSubmission/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/updateSubmission/response.vtl')),
        });
    }
}
