import React from 'react'
import Link from 'next/link'

import { UserDetail } from '../lib/backend_types'
import UserIcon from './UserIcon'

export interface UsernameProps {
    children?: UserDetail
}

const Username: React.FC<UsernameProps> = ({ children }) => {
    return (
        <span>
            <UserIcon size={24}>{children}</UserIcon>{' '}
            {children === null ? (
                <span>Guest</span>
            ) : (
                <Link href={`/users/${children?.screenName}`}>
                    {children?.screenName}
                </Link>
            )}
        </span>
    )
}
export default Username
