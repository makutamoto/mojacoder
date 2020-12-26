import * as cdk from '@aws-cdk/core'
import { UserPool, UserPoolOperation, VerificationEmailStyle } from '@aws-cdk/aws-cognito';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { AuthorizationType, GraphqlApi, MappingTemplate, Schema } from '@aws-cdk/aws-appsync';
import { join } from 'path';
import { Duration } from '@aws-cdk/core';

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
    }
}
