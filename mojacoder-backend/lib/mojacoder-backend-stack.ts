import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { Queue } from '@aws-cdk/aws-sqs';
import { AuthorizationType, CfnDataSource, CfnResolver, GraphqlApi, MappingTemplate, Schema } from '@aws-cdk/aws-appsync';
import { CfnAccessKey, PolicyStatement, Role, ServicePrincipal, User } from '@aws-cdk/aws-iam';
import { QueueProcessingFargateService } from '@aws-cdk/aws-ecs-patterns';
import { ContainerImage } from '@aws-cdk/aws-ecs';
import { CfnUserPoolClient, UserPool } from '@aws-cdk/aws-cognito';

export class MojacoderBackendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const pool = new UserPool(this, 'mojacoder-users', {
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            standardAttributes: {
                preferredUsername: {
                    mutable: true,
                    required: true,
                },
            }
        });
        pool.addDomain("domain", {
            cognitoDomain: {
                domainPrefix: "mojacoder-dev",
            },
        });
        new CfnUserPoolClient(this, "mojacoder-frontend-app", {
            userPoolId: pool.userPoolId,
            allowedOAuthFlows: [
                "implicit",
            ],
            allowedOAuthFlowsUserPoolClient: true,
            allowedOAuthScopes: [
                "email", "openid", "profile",
            ],
            callbackUrLs: [
                "http://localhost:3000/token",
                "https://mojacoder.vercel.app/token",
            ],
            logoutUrLs: [
                "http://localhost:3000/",
                "https://mojacoder.vercel.app",
            ],
            supportedIdentityProviders: ["COGNITO"],
        });
        const JudgeQueue = new Queue(this, 'JudgeQueue');
        const api = new GraphqlApi(this, 'API', {
            name: 'mojacoder-api',
            schema: Schema.fromAsset(path.join(__dirname, '../graphql/schema.graphql')),
            authorizationConfig: {
                additionalAuthorizationModes: [
                    {
                        authorizationType: AuthorizationType.IAM,
                    },
                    {
                        authorizationType: AuthorizationType.USER_POOL,
                        userPoolConfig: {
                            userPool: pool,
                        },
                    }
                ]
            }
        });
        const JudgeQueueDataSourceRole = new Role(this, 'JudgeQueueDataSourceRole', {
            assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        });
        JudgeQueueDataSourceRole.addToPolicy(new PolicyStatement({
            resources: [JudgeQueue.queueArn],
            actions: ['sqs:SendMessage'],
        }));
        const JudgeQueueDataSource = new CfnDataSource(this, 'JudgeQueueDataSource',
            {
                apiId: api.apiId,
                name: 'JudgeQueue',
                serviceRoleArn: JudgeQueueDataSourceRole.roleArn,
                type: 'HTTP',
                httpConfig: {
                    endpoint: "https://sqs.ap-northeast-1.amazonaws.com",
                    authorizationConfig: {
                        authorizationType: 'AWS_IAM',
                        awsIamConfig: {
                            signingRegion: 'ap-northeast-1',
                            signingServiceName: 'sqs',
                        }
                    },
                },
            },
        );
        const runPlayground = new CfnResolver(this, 'runPlayground', {
            apiId: api.apiId,
            typeName: 'Mutation',
            dataSourceName: JudgeQueueDataSource.name,
            fieldName: 'runPlayground',
            requestMappingTemplate:
                MappingTemplate.fromFile(path.join(__dirname, '../graphql/runPlayground/request.vtl'))
                    .renderTemplate().replace(/%QUEUE_URL%/g, JudgeQueue.queueUrl),
            responseMappingTemplate:
                MappingTemplate.fromFile(path.join(__dirname, '../graphql/runPlayground/response.vtl'))
                    .renderTemplate(),
        });
        runPlayground.addDependsOn(JudgeQueueDataSource);
        const PlaygroundDataSource = api.addNoneDataSource('Playground');
        PlaygroundDataSource.createResolver({
            typeName: 'Mutation',
            fieldName: 'responsePlayground',
            requestMappingTemplate: MappingTemplate.fromFile(path.join(__dirname, '../graphql/responsePlayground/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(path.join(__dirname, '../graphql/responsePlayground/response.vtl')),
        });
        PlaygroundDataSource.createResolver({
            typeName: 'Subscription',
            fieldName: 'onResponsePlayground',
            requestMappingTemplate: MappingTemplate.fromFile(path.join(__dirname, '../graphql/onResponsePlayground/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(path.join(__dirname, '../graphql/onResponsePlayground/response.vtl')),
        });

        const JudgeUser = new User(this, 'JudgeUser');
        JudgeUser.addToPolicy(new PolicyStatement({
            resources: [api.arn + '/*'],
            actions: ['appsync:GraphQL'],
        }));
        JudgeUser.addToPolicy(new PolicyStatement({
            resources: [JudgeQueue.queueArn],
            actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage'],
        }));
        const accessKey = new CfnAccessKey(this, 'JudgeUserAccessKey', {
            userName: JudgeUser.userName,
        });
        new QueueProcessingFargateService(this, 'JudgeCluster', {
            image: ContainerImage.fromAsset(path.join(__dirname, '../judge-image')),
            environment: {
                AWS_ACCESS_KEY_ID: accessKey.ref,
                AWS_SECRET_ACCESS_KEY: accessKey.attrSecretAccessKey,
                API_ENDPOINT: api.graphqlUrl,
                JUDGEQUEUE_URL: JudgeQueue.queueUrl,
            },
            queue: JudgeQueue,
        })
    }
}
