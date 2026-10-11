import React from 'react'

import ContestsTable from '../../components/ContestsTable'
import { Contest } from '../../lib/backend_types'
import { render } from '../testUtils'

describe('ContestsTable', () => {
    it.each([
        ['spring-contest', 'spring-contest'],
        ['76Paken-moja#4', '76Paken-moja%234'],
        ['A & B?50% ＃4', 'A%20%26%20B%3F50%25%20%EF%BC%834'],
    ])('keeps the full slug in the link path: %s', (slug, encodedSlug) => {
        const contest = {
            id: 'contest-id',
            slug,
            name: '76thパ研杯#4',
            startDatetime: '2022-10-07T07:30:00Z',
            duration: 3600,
            numberOfTasks: 0,
            user: { detail: { screenName: 'primenumber11' } },
        } as Contest
        const { getByRole } = render(<ContestsTable contests={[contest]} />)
        const link = getByRole('link', { name: contest.name })
        const url = new URL(
            link.getAttribute('href'),
            'https://mojacoder.example'
        )

        expect(url.pathname).toBe(
            `/users/primenumber11/contests/${encodedSlug}`
        )
        expect(url.hash).toBe('')
        expect(url.search).toBe('')
        expect(decodeURIComponent(url.pathname.split('/').pop())).toBe(slug)
    })
})
