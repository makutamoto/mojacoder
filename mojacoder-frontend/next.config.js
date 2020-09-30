const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase) => {
    switch (phase) {
        case PHASE_DEVELOPMENT_SERVER:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_LcfdLiPKX',
                    USER_POOL_CLIENT_ID: '40otuecqohjj8ka86vp7bujvdl',
                    APPSYNC_ENDPOINT:
                        'https://abtbgepvxzdefhsaiu6hx6zeja.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                },
            }
        default:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_LcfdLiPKX',
                    USER_POOL_CLIENT_ID: '40otuecqohjj8ka86vp7bujvdl',
                    APPSYNC_ENDPOINT:
                        'https://abtbgepvxzdefhsaiu6hx6zeja.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                },
            }
    }
}
