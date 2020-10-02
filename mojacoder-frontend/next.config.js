const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase) => {
    switch (phase) {
        case PHASE_DEVELOPMENT_SERVER:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_zq64GnG1I',
                    USER_POOL_CLIENT_ID: '1b46nkj8gq1ofjm8qel9r8di8p',
                    APPSYNC_ENDPOINT:
                        'https://pazmbdtwqjczppdcbo3zlue6eq.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                },
            }
        default:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_zq64GnG1I',
                    USER_POOL_CLIENT_ID: '1b46nkj8gq1ofjm8qel9r8di8p',
                    APPSYNC_ENDPOINT:
                        'https://pazmbdtwqjczppdcbo3zlue6eq.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                },
            }
    }
}
