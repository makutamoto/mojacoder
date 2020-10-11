const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase) => {
    switch (phase) {
        case PHASE_DEVELOPMENT_SERVER:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_cibn5Pakq',
                    USER_POOL_CLIENT_ID: '766u7cc3hlck8t2acaa7lirko3',
                    APPSYNC_ENDPOINT:
                        'https://x3uhhpo7m5a5rhwjsqb5bwhyqe.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-tslyq7foqjfbpluwmt4nfbxrrm',
                    COOKIE_DOMAIN: 'localhost',
                },
            }
        default:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_cibn5Pakq',
                    USER_POOL_CLIENT_ID: '766u7cc3hlck8t2acaa7lirko3',
                    APPSYNC_ENDPOINT:
                        'https://x3uhhpo7m5a5rhwjsqb5bwhyqe.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-tslyq7foqjfbpluwmt4nfbxrrm',
                    COOKIE_DOMAIN: 'mojacoder.vercel.app',
                },
            }
    }
}
