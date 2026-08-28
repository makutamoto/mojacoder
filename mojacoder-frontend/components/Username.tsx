import React from 'react'
import Link from 'next/link'

import { UserDetail } from '../lib/backend_types'

export interface UsernameProps {
    children?: UserDetail
}

const Username: React.FC<UsernameProps> = ({ children }) => {
    return (
        <span>
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
