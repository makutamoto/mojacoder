const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase) => {
    switch (phase) {
        case PHASE_DEVELOPMENT_SERVER:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_5mxA57Bmu',
                    USER_POOL_CLIENT_ID: '5be058lharpgggp0tivl86k3bk',
                    APPSYNC_ENDPOINT:
                        'https://oit5fxgguranhp5z5uzye43eji.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-7kns3k6kxrhc7li6f6zjnkzumy',
                    COOKIE_DOMAIN: 'localhost',
                },
            }
        default:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_5mxA57Bmu',
                    USER_POOL_CLIENT_ID: '5be058lharpgggp0tivl86k3bk',
                    APPSYNC_ENDPOINT:
                        'https://oit5fxgguranhp5z5uzye43eji.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-7kns3k6kxrhc7li6f6zjnkzumy',
                    COOKIE_DOMAIN: 'mojacoder.vercel.app',
                },
            }
    }
}
