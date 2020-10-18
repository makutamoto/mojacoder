const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase) => {
    switch (phase) {
        case PHASE_DEVELOPMENT_SERVER:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_v9BRY34ef',
                    USER_POOL_CLIENT_ID: '2lcpbuka7ago7r8gk2a9d58f8s',
                    APPSYNC_ENDPOINT:
                        'https://toheblmzlnfbfckl74t2nnndri.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-zf3whlcplbhorhietu4h5bfk5y',
                    COOKIE_DOMAIN: 'localhost',
                },
            }
        default:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_v9BRY34ef',
                    USER_POOL_CLIENT_ID: '2lcpbuka7ago7r8gk2a9d58f8s',
                    APPSYNC_ENDPOINT:
                        'https://toheblmzlnfbfckl74t2nnndri.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-zf3whlcplbhorhietu4h5bfk5y',
                    COOKIE_DOMAIN: 'mojacoder.vercel.app',
                },
            }
    }
}
