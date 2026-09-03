import { CfnRepository, Repository, TagStatus } from '@aws-cdk/aws-ecr';
import * as cdk from '@aws-cdk/core';

export const JUDGE_IMAGE_REPOSITORY_NAME = 'mojacoder/judge';
export const JUDGE_IMAGE_RETAIN_COUNT = 3;

export class JudgeImageRepositoryStack extends cdk.Stack {
    public readonly repository: Repository

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.repository = new Repository(this, 'repository', {
            repositoryName: JUDGE_IMAGE_REPOSITORY_NAME,
            lifecycleRules: [
                {
                    description: `Keep the ${JUDGE_IMAGE_RETAIN_COUNT} most recently pushed Judge images`,
                    maxImageCount: JUDGE_IMAGE_RETAIN_COUNT,
                    tagStatus: TagStatus.ANY,
                },
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // The CDK v1 L2 construct does not expose CloudFormation's EmptyOnDelete property.
        const cfnRepository = this.repository.node.defaultChild as CfnRepository;
        cfnRepository.addPropertyOverride('EmptyOnDelete', true);
    }
}
