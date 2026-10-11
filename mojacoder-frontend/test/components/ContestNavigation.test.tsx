import React from 'react'
import { useRouter } from 'next/router'

import ContestTop from '../../containers/ContestTop'
import ContestTasks from '../../pages/users/[username]/contests/[contestSlug]/tasks'
import Auth from '../../lib/auth'
import { invokeQuery } from '../../lib/backend'
import { Contest } from '../../lib/backend_types'
import { render } from '../testUtils'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('../../lib/auth', () => ({
    __esModule: true,
    default: { useContainer: jest.fn() },
}))
jest.mock('../../lib/backend', () => ({
    invokeQuery: jest.fn(),
    invokeQueryWithApiKey: jest.fn(),
}))
jest.mock('../../lib/i18n', () => ({
    useI18n: () => ({ t: (strings) => strings[0] }),
}))

const username = 'primenumber11'
const contestSlug = '76Paken-moja#4'
const basePath = '/users/primenumber11/contests/76Paken-moja%234'
const mockRouter = useRouter as jest.Mock
const mockAuth = Auth.useContainer as jest.Mock
const mockQuery = invokeQuery as jest.Mock
const contest = {
    id: 'contest-id',
    name: '76thパ研杯#4',
    startDatetime: '2022-10-07T07:30:00Z',
    duration: 3600,
    user: { detail: { userID: 'owner-id', screenName: username } },
} as Contest
const previousOrigin = process.env.ORIGIN

beforeEach(() => {
    jest.clearAllMocks()
    process.env.ORIGIN = 'https://mojacoder.example'
    mockRouter.mockReturnValue({
        query: { username, contestSlug },
        locale: 'ja',
        defaultLocale: 'ja',
    })
    mockAuth.mockReturnValue({
        auth: { userID: 'owner-id', screenName: username },
    })
})

afterAll(() => {
    if (previousOrigin === undefined) {
        delete process.env.ORIGIN
    } else {
        process.env.ORIGIN = previousOrigin
    }
})

it('preserves the slug in every contest navigation link', () => {
    const { getByRole } = render(
        <ContestTop
            contest={contest}
            detail={{ contestID: 'contest-id', joined: true }}
        />
    )

    for (const page of ['top', 'tasks', 'standings', 'submissions', 'edit']) {
        const link = getByRole('link', { name: page })
        const url = new URL(link.getAttribute('href'), process.env.ORIGIN)
        expect(url.pathname).toBe(basePath + (page === 'top' ? '' : `/${page}`))
        expect(url.hash).toBe('')
        expect(url.search).toBe('')
    }
})

it.each([
    ['ja', ''],
    ['en', '/en'],
])('shares a usable contest URL in the %s locale', (locale, prefix) => {
    mockRouter.mockReturnValue({
        query: { username, contestSlug },
        locale,
        defaultLocale: 'ja',
    })
    const { getByRole } = render(<ContestTop contest={contest} />)
    const shareUrl = new URL(
        getByRole('link', { name: 'Tweet' }).getAttribute('href')
    )
    const contestUrl = new URL(shareUrl.searchParams.get('url'))

    expect(contestUrl.pathname).toBe(prefix + basePath)
    expect(contestUrl.hash).toBe('')
})

it('opens a contest task while querying with the original slug', async () => {
    mockQuery.mockResolvedValue({
        user: {
            contest: {
                detail: {
                    contestID: 'contest-id',
                    problems: [
                        {
                            point: 100,
                            problem: {
                                detail: {
                                    id: 'task-id',
                                    title: 'A - Sample Task',
                                },
                            },
                        },
                    ],
                },
            },
        },
    })
    const { findByRole } = render(<ContestTasks contest={contest} />)
    const link = await findByRole('link', { name: 'A - Sample Task' })
    const url = new URL(link.getAttribute('href'), process.env.ORIGIN)

    expect(url.pathname).toBe(`${basePath}/tasks/1`)
    expect(url.hash).toBe('')
    expect(invokeQuery).toHaveBeenCalledWith(expect.anything(), {
        username,
        contestSlug,
    })
})
