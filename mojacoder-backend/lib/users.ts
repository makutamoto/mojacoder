import * as cdk from '@aws-cdk/core'
import { UserPool, UserPoolOperation, VerificationEmailStyle } from '@aws-cdk/aws-cognito';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { AuthorizationType, GraphqlApi, MappingTemplate, Schema } from '@aws-cdk/aws-appsync';
import { Rule, Schedule } from '@aws-cdk/aws-events'
import { LambdaFunction } from '@aws-cdk/aws-events-targets'
import { join } from 'path';
import { Duration } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';

export class Users extends cdk.Construct {
    public readonly pool: UserPool
    public readonly userTable: Table
    public readonly api: GraphqlApi

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        this.pool = new UserPool(this, 'user-pool', {
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            standardAttributes: {
                preferredUsername: {
                    mutable: false,
                    required: true,
                },
            },
            userVerification: {
                emailStyle: VerificationEmailStyle.LINK,
            },
        });
        this.pool.addClient("frontend", {
            refreshTokenValidity: Duration.days(365),
        });
        this.pool.addDomain('domain', {
            cognitoDomain: {
                domainPrefix: 'mojacoder',
            }
        });
        this.api = new GraphqlApi(this, 'api', {
            name: 'mojacoder-api',
            schema: Schema.fromAsset(join(__dirname, '../graphql/schema.graphql')),
            authorizationConfig: {
                additionalAuthorizationModes: [
                    {
                        authorizationType: AuthorizationType.IAM,
                    },
                    {
                        authorizationType: AuthorizationType.USER_POOL,
                        userPoolConfig: {
                            userPool: this.pool,
                        },
                    }
                ]
            }
        });
        const updateApiKeyLambda = new NodejsFunction(this, 'update-api-key', {
            entry: join(__dirname, '../lambda/update-api-key/index.ts'),
            handler: 'handler',
            environment: {
                APPSYNC_API_ID: this.api.apiId,
                APPSYNC_API_KEY: this.api.apiKey!,
            },
        });
        updateApiKeyLambda.addToRolePolicy(new PolicyStatement({
            actions: ['appsync:UpdateApiKey'],
            resources: ['*'],
        }));
        const updateApiKeyTarget = new LambdaFunction(updateApiKeyLambda)
        new Rule(this, 'update-api-key-cron', {
            schedule: Schedule.cron({ weekDay: 'MON', hour: '0', minute: '0' }),
            targets: [updateApiKeyTarget],
        });
        this.userTable = new Table(this, 'user-table', {
            billingMode: BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'username',
                type: AttributeType.STRING,
            }
        });
        this.userTable.addGlobalSecondaryIndex({
            indexName: 'idIndex',
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING,
            }
        });
        const signupTrigger = new NodejsFunction(this, 'signup-trigger', {
            entry: join(__dirname, '../lambda/cognito-pre-signup-trigger/index.ts'),
            handler: 'handler',
            environment: {
                TABLE_NAME: this.userTable.tableName,
            },
        });
        this.pool.addTrigger(UserPoolOperation.PRE_SIGN_UP, signupTrigger);
        signupTrigger.addToRolePolicy(new PolicyStatement({
            resources: [this.userTable.tableArn],
            actions: ['dynamodb:PutItem'],
        }));
        const postConfirmationTrigger = new NodejsFunction(this, 'post-confirmation-trigger', {
            entry: join(__dirname, '../lambda/cognito-post-confirmation-trigger/index.ts'),
            handler: 'handler',
            environment: {
                TABLE_NAME: this.userTable.tableName,
            },
        });
        this.pool.addTrigger(UserPoolOperation.POST_CONFIRMATION, postConfirmationTrigger);
        postConfirmationTrigger.addToRolePolicy(new PolicyStatement({
            resources: [this.userTable.tableArn],
            actions: ['dynamodb:PutItem'],
        }));
        const userTableDataSource = this.api.addDynamoDbDataSource('userTable', this.userTable);
        userTableDataSource.createResolver({
            typeName: 'Query',
            fieldName: 'user',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/userDetail/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/userDetail/response.vtl')),
        });
        userTableDataSource.createResolver({
            typeName: 'User',
            fieldName: 'detail',
            requestMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/userDetail/request.vtl')),
            responseMappingTemplate: MappingTemplate.fromFile(join(__dirname, '../graphql/userDetail/response.vtl')),
        });
        const userIconBucket = new Bucket(this, 'userIconBucket', {
            publicReadAccess: true,
        });
        const setUserIconLambda = new NodejsFunction(this, 'setUserIcon', {
            entry: join(__dirname, '../lambda/set-user-icon/index.ts'),
            handler: 'handler',
            environment: {
                USER_ICON_BUCKET_NAME: userIconBucket.bucketName,
                USER_TABLE_NAME: this.userTable.tableName,
            },
        });
        setUserIconLambda.addToRolePolicy(new PolicyStatement({
            actions: ['s3:PutObject', 's3:DeleteObject', 'dynamodb:UpdateItem', 'dynamodb:Query'],
            resources: [userIconBucket.bucketArn + '/*', this.userTable.tableArn],
        }));
        const setUserIconLambdaDatasource = this.api.addLambdaDataSource('setUserIconLambda', setUserIconLambda);
        setUserIconLambdaDatasource.createResolver({
            typeName: 'Mutation',
            fieldName: 'setUserIcon',
        })
    }
}
