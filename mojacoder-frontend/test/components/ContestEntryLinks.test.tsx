import React from 'react'
import { useRouter } from 'next/router'

import ContestEditor from '../../containers/ContestEditor'
import UserContests from '../../pages/users/[username]/contests'
import Auth from '../../lib/auth'
import {
    invokeMutation,
    invokeQuery,
    invokeQueryWithApiKey,
} from '../../lib/backend'
import { ContestStatus, UserDetail } from '../../lib/backend_types'
import { fireEvent, render, waitFor } from '../testUtils'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('../../lib/auth', () => ({
    __esModule: true,
    default: { useContainer: jest.fn() },
}))
jest.mock('../../lib/backend', () => ({
    invokeMutation: jest.fn(),
    invokeQuery: jest.fn(),
    invokeQueryWithApiKey: jest.fn(),
}))
jest.mock('../../lib/i18n', () => ({
    useI18n: () => ({ t: (strings) => strings[0] }),
}))
jest.mock('../../components/Editor', () => () => null)
jest.mock('../../components/Markdown', () => () => null)
jest.mock('../../containers/UserPageLayout', () => ({ children }) => children)

const username = 'primenumber11'
const slug = '76Paken-moja#4'
const expectedPath = '/users/primenumber11/contests/76Paken-moja%234'
const push = jest.fn()
const mockRouter = useRouter as jest.Mock
const mockAuth = Auth.useContainer as jest.Mock
const mockMutation = invokeMutation as jest.Mock
const mockQuery = invokeQuery as jest.Mock
const mockApiKeyQuery = invokeQueryWithApiKey as jest.Mock

beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.mockReturnValue({ push })
    mockAuth.mockReturnValue({
        auth: { userID: 'owner-id', screenName: username },
    })
    mockMutation.mockResolvedValue({})
})

it.each([false, true])(
    'encodes user contest links (signed in: %s)',
    async (signedIn) => {
        if (!signedIn) {
            mockAuth.mockReturnValue({ auth: null })
        }
        const result = {
            user: {
                contests: {
                    items: [
                        {
                            slug,
                            name: '76thパ研杯#4',
                            status: ContestStatus.PUBLIC,
                        },
                    ],
                },
            },
        }
        mockQuery.mockResolvedValue(result)
        mockApiKeyQuery.mockResolvedValue(result)
        const user = { userID: 'owner-id', screenName: username } as UserDetail
        const { findByRole } = render(<UserContests user={user} />)
        const link = await findByRole('link', { name: '76thパ研杯#4' })
        const url = new URL(
            link.getAttribute('href'),
            'https://mojacoder.example'
        )

        expect(url.pathname).toBe(expectedPath)
        expect(url.hash).toBe('')
    }
)

it.each(['create', 'update'])(
    'redirects after %s without changing the stored slug',
    async (operation) => {
        const data =
            operation === 'update'
                ? {
                      slug,
                      name: '76thパ研杯#4',
                      status: ContestStatus.PUBLIC,
                      description: '',
                      startDatetime: '2022-10-07T07:30:00Z',
                      duration: 3600,
                      penaltySeconds: 300,
                      problems: [],
                  }
                : undefined
        const ui = render(<ContestEditor data={data} />)
        if (operation === 'create') {
            fireEvent.change(ui.getByPlaceholderText('a-plus-b...'), {
                target: { value: slug },
            })
            const nameInput = ui
                .getAllByPlaceholderText('Test Contest 1...')
                .find((element) => element.getAttribute('type') === 'text')
            fireEvent.change(nameInput, {
                target: { value: '76thパ研杯#4' },
            })
        }
        fireEvent.click(
            ui.getByRole('button', {
                name: operation === 'create' ? '作成' : '更新',
            })
        )

        await waitFor(() => expect(push).toHaveBeenCalledTimes(1))
        expect(push).toHaveBeenCalledWith(expectedPath)
        expect(invokeMutation).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                input: expect.objectContaining({ slug }),
            })
        )
    }
)
