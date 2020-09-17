const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase) => {
    switch (phase) {
        case PHASE_DEVELOPMENT_SERVER:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    IDP_DOMAIN:
                        'mojacoder-dev.auth.ap-northeast-1.amazoncognito.com',
                    USER_POOL_ID: 'ap-northeast-1_LcfdLiPKX',
                    USER_POOL_CLIENT_ID: '6imo836n994qb9536tv8332din',
                    REDIRECT_SIGN_IN: 'http://localhost:3000/token',
                    REDIRECT_SIGN_OUT: 'http://localhost:3000',
                    AUTH_COOKIE_DOMAIN: 'localhost',
                    APPSYNC_ENDPOINT:
                        'https://abtbgepvxzdefhsaiu6hx6zeja.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                },
            }
        default:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    IDP_DOMAIN:
                        'mojacoder-dev.auth.ap-northeast-1.amazoncognito.com',
                    USER_POOL_ID: 'ap-northeast-1_LcfdLiPKX',
                    USER_POOL_CLIENT_ID: '6imo836n994qb9536tv8332din',
                    REDIRECT_SIGN_IN: process.env.VERCEL_URL + '/token',
                    REDIRECT_SIGN_OUT: process.env.VERCEL_URL,
                    AUTH_COOKIE_DOMAIN: new URL(process.env.VERCEL_URL).host,
                    APPSYNC_ENDPOINT:
                        'https://abtbgepvxzdefhsaiu6hx6zeja.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                },
            }
    }
}
