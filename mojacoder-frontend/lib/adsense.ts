export const ADSENSE_CLIENT = 'ca-pub-1558648672247263'

export const ADSENSE_SLOTS = {
    footer: '8841155425',
    problem: '8232681143',
} as const

const FOOTER_AD_ROUTES = new Set([
    '/problems',
    '/contests',
    '/users/[username]',
    '/users/[username]/contests',
    '/users/[username]/contests/[contestSlug]',
    '/users/[username]/contests/[contestSlug]/standings',
    '/users/[username]/problems/[problemSlug]/comments',
    '/users/[username]/problems/[problemSlug]/editorial',
    '/users/[username]/problems/[problemSlug]/likers',
])

export const shouldShowFooterAd = (pathname: string) =>
    FOOTER_AD_ROUTES.has(pathname)
