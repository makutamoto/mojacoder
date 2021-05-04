import React from 'react'
import Link from 'next/link'

import { UserDetail } from '../lib/backend_types'
import UserIcon from './UserIcon'

import styles from '../css/align.module.css'

export interface UsernameProps {
    children?: UserDetail
}

const Username: React.FC<UsernameProps> = ({ children }) => {
    return (
        <span>
            <UserIcon size={24}>{children}</UserIcon>{' '}
            {children === null ? (
                <span className={styles['align-super']}>Guest</span>
            ) : (
                <Link href={`/users/${children?.screenName}`} passHref>
                    <a className={styles['align-super']}>
                        {children?.screenName}
                    </a>
                </Link>
            )}
        </span>
    )
}
export default Username
