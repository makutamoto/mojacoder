import React from 'react'

import SearchEnginePolicy, {
    isProblemStatementPage,
    problemStatementPathname,
} from '../../components/SearchEnginePolicy'
import { render } from '../testUtils'

jest.mock('next/head', () => ({ children }) => children)

describe('SearchEnginePolicy', () => {
    it('allows the canonical problem statement page to be indexed', () => {
        const { container } = render(
            <SearchEnginePolicy pathname={problemStatementPathname} />
        )

        expect(isProblemStatementPage(problemStatementPathname)).toBe(true)
        expect(container.querySelector('meta[name="robots"]')).toBeNull()
    })

    it.each([
        '/',
        '/problems',
        '/users/[username]',
        '/users/[username]/problems/[problemSlug]/submissions',
        '/users/[username]/problems/[problemSlug]/testcases',
        '/users/[username]/problems/[problemSlug]/testcases/[testcaseName]',
        '/users/[username]/contests/[contestSlug]/tasks/[taskNumber]',
    ])('prevents indexing and link following on %s', (pathname) => {
        const { container } = render(<SearchEnginePolicy pathname={pathname} />)

        expect(isProblemStatementPage(pathname)).toBe(false)
        expect(
            container
                .querySelector('meta[name="robots"]')
                ?.getAttribute('content')
        ).toBe('noindex,nofollow')
    })
})
