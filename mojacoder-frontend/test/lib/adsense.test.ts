import { shouldShowFooterAd } from '../../lib/adsense'

describe('shouldShowFooterAd', () => {
    it.each([
        '/problems',
        '/contests',
        '/users/[username]',
        '/users/[username]/contests/[contestSlug]',
        '/users/[username]/problems/[problemSlug]/editorial',
    ])('shows an ad on public content route %s', (pathname) => {
        expect(shouldShowFooterAd(pathname)).toBe(true)
    })

    it.each([
        '/',
        '/signin',
        '/signup',
        '/settings',
        '/playground',
        '/problems/post',
        '/contests/create',
        '/users/[username]/problems/[problemSlug]',
        '/users/[username]/problems/[problemSlug]/edit',
        '/users/[username]/problems/[problemSlug]/testcases/[testcaseName]',
        '/users/[username]/problems/[problemSlug]/submissions/[submissionID]',
        '/users/[username]/contests/[contestSlug]/tasks/[taskNumber]',
    ])('keeps action-oriented route %s ad-free', (pathname) => {
        expect(shouldShowFooterAd(pathname)).toBe(false)
    })
})
