import React from 'react'
import Link from 'next/link'

import { UserDetail } from '../lib/backend_types'
import UserIcon from './UserIcon'

import styles from '../css/align.module.css'

export interface UsernameProps {
    children?: UserDetail
}

const Username: React.FC<UsernameProps> = (props) => {
    return (
        <span>
            <UserIcon size={24}>{props.children}</UserIcon>{' '}
            <Link href={`/users/${props.children?.screenName}`} passHref>
                <a className={styles['align-super']}>
                    {props.children?.screenName}
                </a>
            </Link>
        </span>
    )
}
export default Username
