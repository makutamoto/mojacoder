import * as cdk from '@aws-cdk/core'
import { Queue } from '@aws-cdk/aws-sqs';
import { CfnAccessKey, PolicyStatement, User } from '@aws-cdk/aws-iam';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { SubnetType, Vpc } from '@aws-cdk/aws-ec2';
import { AwsLogDriver, Cluster, ContainerImage, FargateService, FargateTaskDefinition } from '@aws-cdk/aws-ecs';
import { Bucket } from '@aws-cdk/aws-s3'
import { GraphqlApi, MappingTemplate } from '@aws-cdk/aws-appsync';
import { join } from 'path';

export interface JudgeProps {
    api: GraphqlApi
    testcases: Bucket
}

export class Judge extends cdk.Construct {
    public readonly submissionTable: Table
    
    constructor(scope: cdk.Construct, id: string, props: JudgeProps) {
        super(scope, id);
        const JudgeQueueDeadLetterQueue = new Queue(this, 'JudgeQueueDeadLetterQueue');
        const JudgeQueue = new Queue(this, 'JudgeQueue', {
            deadLetterQueue: {
                queue: JudgeQueueDeadLetterQueue,
                maxReceiveCount: 4,
            }
        });
        this.submissionTable = new Table(this, 'submissionTable', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING,
            },
        });
        this.submissionTable.addGlobalSecondaryIndex({
            indexName: 'problemID-index',
            partitionKey: {
                name: 'problemID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        })
        this.submissionTable.addGlobalSecondaryIndex({
            indexName: 'submission-contestID-index',
            partitionKey: {
                name: 'contestID',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'datetime',
                type: AttributeType.STRING,
            },
        })
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
            resources: [this.submissionTable.tableArn],
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
            capacityProviders: ["FARGATE_SPOT"],
            vpc,
        });
        const judgeTask = new FargateTaskDefinition(this, 'judge-task', {
            cpu: 1024,
            memoryLimitMiB: 2048,
        });
        judgeTask.addContainer('judge-container', {
            image: ContainerImage.fromAsset(join(__dirname, '../judge-image')),
            logging: new AwsLogDriver({
                streamPrefix: 'judge-container',
            }),
            healthCheck: {
                command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
            },
            environment: {
                AWS_ACCESS_KEY_ID: accessKey.ref,
                AWS_SECRET_ACCESS_KEY: accessKey.attrSecretAccessKey,
                API_ENDPOINT: props.api.graphqlUrl,
                JUDGEQUEUE_URL: JudgeQueue.queueUrl,
                SUBMISSION_TABLE_NAME: this.submissionTable.tableName,
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
            capacityProviderStrategies: [
                {
                    capacityProvider: "FARGATE_SPOT",
                    base: 1,
                    weight: 1,
                },
            ],
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
        const judgeQueueDatasource = props.api.addHttpDataSource('judgeQueue', 'https://ap-northeast-1.queue.amazonaws.com', {
            authorizationConfig: {
                signingRegion: 'ap-northeast-1',
                signingServiceName: 'sqs',
            },
        });
        judgeQueueDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['sqs:SendMessage'],
            resources: [JudgeQueue.queueArn],
        }));
        const submittedCodeBucketDatasource = props.api.addHttpDataSource('submittedCodeBucket', 'https://' + submittedCodeBucket.bucketRegionalDomainName, {
            authorizationConfig: {
                signingRegion: 'ap-northeast-1',
                signingServiceName: 's3',
            },
        });
        submittedCodeBucketDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject'],
            resources: [submittedCodeBucket.bucketArn + '/*'],
        }))
        submittedCodeBucketDatasource.createResolver({
            typeName: 'Submission',
            fieldName: 'code',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/code/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/code/response.vtl')),
        })
        const submissionTableDataSource = props.api.addDynamoDbDataSource('submission_table', this.submissionTable);
        const submitCodePutItemFunction = submissionTableDataSource.createFunction({
            name: 'submitCodePutItem',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submitCode/putItem/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submitCode/putItem/response.vtl')),
        });
        const submitCodePutObjectFunction = submittedCodeBucketDatasource.createFunction({
            name: 'submitCodePutObject',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submitCode/putObject/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submitCode/putObject/response.vtl')),
        });
        const submitCodeSendMessageFunction = judgeQueueDatasource.createFunction({
            name: 'submitCodeSendMessage',
            requestMappingTemplate: MappingTemplate.fromString(
                MappingTemplate.fromFile(join(__dirname, '../graphql/submitCode/sendMessage/request.vtl')).renderTemplate()
                    .replace(/%QUEUE_URL%/g, JudgeQueue.queueUrl)
            ),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submitCode/sendMessage/response.vtl')),
        });
        props.api.createResolver({
            typeName: 'Mutation',
            fieldName: 'submitCode',
            pipelineConfig: [submitCodePutItemFunction, submitCodePutObjectFunction, submitCodeSendMessageFunction],
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submitCode/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submitCode/response.vtl')),
        });
        submissionTableDataSource.createResolver({
            typeName: 'ContestDetail',
            fieldName: 'submissions',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contestSubmissions/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contestSubmissions/response.vtl')),
        })
        submissionTableDataSource.createResolver({
            typeName: 'ContestDetail',
            fieldName: 'submission',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contestSubmission/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/contestSubmission/response.vtl')),
        })
        const playgroundCodeBucketDatasource = props.api.addHttpDataSource('playgroundCodeBucket', 'https://' + playgroundCodeBucket.bucketRegionalDomainName, {
            authorizationConfig: {
                signingRegion: 'ap-northeast-1',
                signingServiceName: 's3',
            },
        });
        playgroundCodeBucketDatasource.grantPrincipal.addToPrincipalPolicy(new PolicyStatement({
            actions: ['s3:PutObject'],
            resources: [playgroundCodeBucket.bucketArn + '/*'],
        }));
        const runPlaygroundPutObjectFunction = playgroundCodeBucketDatasource.createFunction({
            name: 'runPlaygroundPutObject',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/runPlayground/putObject/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/runPlayground/putObject/response.vtl')),
        });
        const runPlaygroundSendMessageFunction = judgeQueueDatasource.createFunction({
            name: 'runPlaygroundSendMessage',
            requestMappingTemplate: MappingTemplate.fromString(
                MappingTemplate.fromFile(join(__dirname, '../graphql/runPlayground/sendMessage/request.vtl')).renderTemplate()
                    .replace(/%QUEUE_URL%/g, JudgeQueue.queueUrl)
            ),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/runPlayground/sendMessage/response.vtl')),
        });
        props.api.createResolver({
            typeName: 'Mutation',
            fieldName: 'runPlayground',
            pipelineConfig: [runPlaygroundPutObjectFunction, runPlaygroundSendMessageFunction],
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/runPlayground/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/runPlayground/response.vtl')),
        });
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
        submissionTableDataSource.createResolver({
            typeName: 'ProblemDetail',
            fieldName: 'submission',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submission/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/submission/response.vtl')),
        });
        submissionTableDataSource.createResolver({
            typeName: 'ProblemDetail',
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
