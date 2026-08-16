import { WafAction } from './appsync-waf';

const DEFAULT_RATE_LIMIT = 300;
const DEFAULT_RATE_LIMIT_ACTION: WafAction = 'count';
const DEFAULT_IP_REPUTATION_ACTION: WafAction = 'count';

export interface AppSyncWafContext {
    appsyncWafRateLimit?: unknown
    appsyncWafRateLimitAction?: unknown
    appsyncWafIpReputationAction?: unknown
}

export interface AppSyncWafConfig {
    rateLimit: number
    rateLimitAction: WafAction
    ipReputationAction: WafAction
}

export function resolveAppSyncWafConfig(context: AppSyncWafContext = {}): AppSyncWafConfig {
    return {
        rateLimit: resolveRateLimit(context.appsyncWafRateLimit),
        rateLimitAction: resolveAction(
            'appsyncWafRateLimitAction',
            context.appsyncWafRateLimitAction,
            DEFAULT_RATE_LIMIT_ACTION,
        ),
        ipReputationAction: resolveAction(
            'appsyncWafIpReputationAction',
            context.appsyncWafIpReputationAction,
            DEFAULT_IP_REPUTATION_ACTION,
        ),
    };
}

function resolveRateLimit(configuredRateLimit: unknown): number {
    if (configuredRateLimit === undefined) {
        return DEFAULT_RATE_LIMIT;
    }

    const rateLimit = Number(configuredRateLimit);
    if (!Number.isInteger(rateLimit) || rateLimit < 100) {
        throw new Error('appsyncWafRateLimit must be an integer greater than or equal to 100');
    }
    return rateLimit;
}

function resolveAction(contextKey: string, configuredAction: unknown, defaultAction: WafAction): WafAction {
    if (configuredAction === undefined) {
        return defaultAction;
    }
    if (configuredAction !== 'count' && configuredAction !== 'block') {
        throw new Error(`${contextKey} must be either count or block`);
    }
    return configuredAction;
}
