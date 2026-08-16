import { resolveAppSyncWafConfig } from '../lib/appsync-waf-config';

test('uses safe WAF defaults when context is absent', () => {
    expect(resolveAppSyncWafConfig()).toEqual({
        rateLimit: 300,
        rateLimitAction: 'count',
        ipReputationAction: 'count',
    });
});

test('accepts configured WAF values', () => {
    expect(resolveAppSyncWafConfig({
        appsyncWafRateLimit: '500',
        appsyncWafRateLimitAction: 'block',
        appsyncWafIpReputationAction: 'block',
    })).toEqual({
        rateLimit: 500,
        rateLimitAction: 'block',
        ipReputationAction: 'block',
    });
});

test.each([
    99,
    100.5,
    'not-a-number',
])('rejects invalid WAF rate limit %p', configuredRateLimit => {
    expect(() => resolveAppSyncWafConfig({
        appsyncWafRateLimit: configuredRateLimit,
    })).toThrow('appsyncWafRateLimit must be an integer greater than or equal to 100');
});

test.each([
    'appsyncWafRateLimitAction',
    'appsyncWafIpReputationAction',
] as const)('rejects an invalid %s', contextKey => {
    expect(() => resolveAppSyncWafConfig({
        [contextKey]: 'allow',
    })).toThrow(`${contextKey} must be either count or block`);
});
