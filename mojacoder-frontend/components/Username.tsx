import React from 'react'
import Link from 'next/link'

import { UserDetail } from '../lib/backend_types'

export interface UsernameProps {
    children: UserDetail
}

const Username: React.FC<UsernameProps> = (props) => {
    return (
        <Link href={`/users/${props.children.screenName}`} passHref>
            <a>{props.children.screenName}</a>
        </Link>
    )
}
export default Username
