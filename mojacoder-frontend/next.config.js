const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

const i18n = {
    locales: ['en', 'ja'],
    defaultLocale: 'ja',
}

module.exports = (phase) => {
    switch (phase) {
        case PHASE_DEVELOPMENT_SERVER:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_rPJ5fZCy0',
                    USER_POOL_CLIENT_ID: '1iebksqvkjmo3jbmnq7h16688c',
                    APPSYNC_ENDPOINT:
                        'https://zbw5rgbp6nbplmvbddkkwm7m3a.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-eyze5l444jd45o2oooqjcjrkaa',
                    ICON_STORAGE:
                        'https://mojacoderbackendstack-usersusericonbucketc1cb90e3-7m318sricpf1.s3-ap-northeast-1.amazonaws.com',
                    COOKIE_DOMAIN: 'localhost',
                    ORIGIN: 'http://localhost:3000',
                },
                i18n,
            }
        default:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_rPJ5fZCy0',
                    USER_POOL_CLIENT_ID: '1iebksqvkjmo3jbmnq7h16688c',
                    APPSYNC_ENDPOINT:
                        'https://zbw5rgbp6nbplmvbddkkwm7m3a.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-eyze5l444jd45o2oooqjcjrkaa',
                    ICON_STORAGE:
                        'https://mojacoderbackendstack-usersusericonbucketc1cb90e3-7m318sricpf1.s3-ap-northeast-1.amazonaws.com',
                    COOKIE_DOMAIN: 'mojacoder.vercel.app',
                    ORIGIN: 'https://mojacoder.vercel.app',
                },
                i18n,
            }
    }
}
