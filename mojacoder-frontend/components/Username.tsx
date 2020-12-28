import React from 'react'
import Link from 'next/link'
import { Image } from 'react-bootstrap'

import { UserDetail } from '../lib/backend_types'

export interface UsernameProps {
    children?: UserDetail
}

const Username: React.FC<UsernameProps> = (props) => {
    return (
        <>
            <Image
                className="border"
                roundedCircle
                width={24}
                src="/images/avatar.png"
            />{' '}
            <Link href={`/users/${props.children?.screenName}`} passHref>
                <a className="align-middle">{props.children?.screenName}</a>
            </Link>
        </>
    )
}
export default Username
