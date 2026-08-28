import { createRobotsTxt, getServerSideProps } from '../../pages/robots.txt'

interface RobotsRule {
    allow: boolean
    path: string
}

const parseRules = (robotsTxt: string): RobotsRule[] =>
    robotsTxt
        .split('\n')
        .map((line) => /^(Allow|Disallow): (.+)$/.exec(line))
        .filter((match): match is RegExpExecArray => match !== null)
        .map((match) => ({
            allow: match[1] === 'Allow',
            path: match[2],
        }))

const pathPatternToRegExp = (pathPattern: string): RegExp => {
    const matchesEnd = pathPattern.endsWith('$')
    const pattern = matchesEnd ? pathPattern.slice(0, -1) : pathPattern
    const source = pattern
        .split('*')
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*')
    return new RegExp(`^${source}${matchesEnd ? '$' : ''}`)
}

const isCrawlAllowed = (robotsTxt: string, pathname: string): boolean => {
    const matchingRules = parseRules(robotsTxt).filter((rule) =>
        pathPatternToRegExp(rule.path).test(pathname)
    )
    if (matchingRules.length === 0) {
        return true
    }
    const longestPath = Math.max(
        ...matchingRules.map((rule) => rule.path.replace(/[*$]/g, '').length)
    )
    return matchingRules
        .filter((rule) => rule.path.replace(/[*$]/g, '').length === longestPath)
        .some((rule) => rule.allow)
}

describe('robots.txt', () => {
    const robotsTxt = createRobotsTxt('https://mojacoder.example')

    it.each([
        '/users/alice/problems/a-plus-b',
        '/en/users/alice/problems/a-plus-b',
        '/users/alice/problems/a-plus-b?source=search',
    ])('allows crawling a canonical problem statement URL: %s', (pathname) => {
        expect(isCrawlAllowed(robotsTxt, pathname)).toBe(true)
    })

    it.each([
        '/',
        '/problems',
        '/users/alice',
        '/users/alice/problems/a-plus-b/submissions',
        '/users/alice/problems/a-plus-b/submissions/123',
        '/users/alice/problems/a-plus-b/testcases',
        '/users/alice/problems/a-plus-b/testcases/sample-1',
        '/users/alice/problems/a-plus-b/editorial',
        '/en/users/alice/problems/a-plus-b/submissions',
        '/users/alice/contests/spring/tasks/1',
        '/images/logo.svg',
    ])('disallows crawling a non-problem-statement URL: %s', (pathname) => {
        expect(isCrawlAllowed(robotsTxt, pathname)).toBe(false)
    })

    it.each(['/sitemap.xml', '/_next/static/chunks/main.js'])(
        'allows a resource needed for discovery or rendering: %s',
        (pathname) => {
            expect(isCrawlAllowed(robotsTxt, pathname)).toBe(true)
        }
    )

    it('serves the policy as plain text without changing the sitemap URL', async () => {
        const previousOrigin = process.env.ORIGIN
        process.env.ORIGIN = 'https://mojacoder.example'
        const setHeader = jest.fn()
        const end = jest.fn()

        try {
            await getServerSideProps({
                res: { setHeader, end },
            } as any)
        } finally {
            if (previousOrigin === undefined) {
                delete process.env.ORIGIN
            } else {
                process.env.ORIGIN = previousOrigin
            }
        }

        expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain')
        expect(end).toHaveBeenCalledWith(robotsTxt)
        expect(robotsTxt).toContain(
            'Sitemap: https://mojacoder.example/sitemap.xml\n'
        )
    })
})
