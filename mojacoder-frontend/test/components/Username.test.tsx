import React from 'react'

import Username from '../../components/Username'
import { UserDetail } from '../../lib/backend_types'
import { render } from '../testUtils'

const user = {
    userID: 'user-with-an-uploaded-icon',
    screenName: 'Alice',
    icon: true,
} as UserDetail

test('does not render an icon even when the user has an uploaded icon', () => {
    const { getByRole, queryByRole } = render(<Username>{user}</Username>)

    expect(queryByRole('img')).toBeNull()
    expect(getByRole('link').textContent).toBe('Alice')
})
