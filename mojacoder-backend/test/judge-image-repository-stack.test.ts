import * as cdk from '@aws-cdk/core';
import {
    JUDGE_IMAGE_REPOSITORY_NAME,
    JudgeImageRepositoryStack,
} from '../lib/judge-image-repository-stack';

interface CloudFormationResource {
    Type: string
    Properties: {
        [key: string]: any
    }
    DeletionPolicy?: string
    UpdateReplacePolicy?: string
}

test('creates a disposable Judge image repository with bounded image history', () => {
    const app = new cdk.App();
    const stack = new JudgeImageRepositoryStack(app, 'TestStack');
    const resources = app.synth().getStackByName(stack.stackName).template.Resources as {
        [logicalId: string]: CloudFormationResource
    };
    const repositories = Object.values(resources).filter(resource => resource.Type === 'AWS::ECR::Repository');

    expect(repositories).toHaveLength(1);

    const repository = repositories[0];
    expect(repository.Properties.RepositoryName).toBe(JUDGE_IMAGE_REPOSITORY_NAME);
    expect(repository.Properties.EmptyOnDelete).toBe(true);
    expect(repository.DeletionPolicy).toBe('Delete');
    expect(repository.UpdateReplacePolicy).toBe('Delete');
    expect(JSON.parse(repository.Properties.LifecyclePolicy.LifecyclePolicyText)).toEqual({
        rules: [
            {
                rulePriority: 1,
                description: 'Keep the 3 most recently pushed Judge images',
                selection: {
                    tagStatus: 'any',
                    countType: 'imageCountMoreThan',
                    countNumber: 3,
                },
                action: {
                    type: 'expire',
                },
            },
        ],
    });
});
