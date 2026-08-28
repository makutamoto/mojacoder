import { readFileSync } from 'fs';
import { join } from 'path';

const schema = readFileSync(join(__dirname, '../graphql/schema.graphql'), 'utf8');

test('requires Cognito authentication for testcase contents', () => {
    const testcaseField = schema
        .split(/\r?\n/)
        .find(line => line.includes('testcase(name:'));
    const inUrlField = schema
        .split(/\r?\n/)
        .find(line => line.includes('inUrl: AWSURL'));
    const outUrlField = schema
        .split(/\r?\n/)
        .find(line => line.includes('outUrl: AWSURL'));

    for (const field of [testcaseField, inUrlField, outUrlField]) {
        expect(field).toContain('@aws_cognito_user_pools');
        expect(field).not.toContain('@aws_api_key');
        expect(field).not.toContain('@aws_iam');
    }
});
