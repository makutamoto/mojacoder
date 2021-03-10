const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

const common = {
    i18n: {
        locales: ['en', 'ja'],
        defaultLocale: 'ja',
    },
    images: {
        domains: ['icon.mojacoder.app'],
    },
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
                        'https://e3qj5jz4cbezbkndppo5jb43wm.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-4utm5h73obduvbxmmgxdn3b4oe',
                    ICON_STORAGE: 'https://icon.mojacoder.app',
                    COOKIE_DOMAIN: 'localhost',
                    ORIGIN: 'http://localhost:3000',
                },
                ...common,
            }
        default:
            return {
                env: {
                    AWS_REGION: 'ap-northeast-1',
                    USER_POOL_ID: 'ap-northeast-1_rPJ5fZCy0',
                    USER_POOL_CLIENT_ID: '1iebksqvkjmo3jbmnq7h16688c',
                    APPSYNC_ENDPOINT:
                        'https://e3qj5jz4cbezbkndppo5jb43wm.appsync-api.ap-northeast-1.amazonaws.com/graphql',
                    APPSYNC_APIKEY: 'da2-4utm5h73obduvbxmmgxdn3b4oe',
                    ICON_STORAGE: 'https://icon.mojacoder.app',
                    COOKIE_DOMAIN: 'mojacoder.app',
                    ORIGIN: 'https://mojacoder.app',
                },
                ...common,
            }
    }
}
