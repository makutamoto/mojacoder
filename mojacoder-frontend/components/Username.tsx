import React from 'react'
import Link from 'next/link'

import { UserDetail } from '../lib/backend_types'
import UserIcon from './UserIcon'

export interface UsernameProps {
    children?: UserDetail
}

const Username: React.FC<UsernameProps> = (props) => {
    return (
        <>
            <UserIcon width={24}>{props.children}</UserIcon>{' '}
            <Link href={`/users/${props.children?.screenName}`} passHref>
                <a className="align-middle">{props.children?.screenName}</a>
            </Link>
        </>
    )
}
export default Username
