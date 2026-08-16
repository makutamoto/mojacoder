import { readFileSync } from 'fs';
import { join } from 'path';

const schema = readFileSync(join(__dirname, '../graphql/schema.graphql'), 'utf8');

test('requires Cognito authentication for runPlayground', () => {
    const runPlaygroundField = schema
        .split(/\r?\n/)
        .find(line => line.includes('runPlayground(input:'));

    expect(runPlaygroundField).toContain('@aws_cognito_user_pools');
    expect(runPlaygroundField).not.toContain('@aws_api_key');

    const requestTemplate = readFileSync(
        join(__dirname, '../graphql/runPlayground/request.vtl'),
        'utf8',
    );

    expect(requestTemplate).toContain('$util.isNull($context.identity.sub)');
    expect(requestTemplate).toContain('$util.unauthorized()');
});

test('requires Cognito authentication for playground subscriptions', () => {
    const subscriptionField = schema
        .split(/\r?\n/)
        .find(line => line.includes('onResponsePlayground(sessionID:'));

    expect(subscriptionField).toContain('userID: ID!');
    expect(subscriptionField).toContain('@aws_cognito_user_pools');
    expect(subscriptionField).not.toContain('@aws_api_key');
});

test('continues to allow API key authentication for submitCode', () => {
    const submitCodeField = schema
        .split(/\r?\n/)
        .find(line => line.includes('submitCode(input:'));

    expect(submitCodeField).toContain('@aws_api_key');
    expect(submitCodeField).toContain('@aws_cognito_user_pools');
});
