import React from 'react'
import Image from 'next/image'
import { ImageProps } from 'react-bootstrap'
import join from 'url-join'

import { UserDetail } from '../lib/backend_types'

export interface UserIconProps extends Omit<ImageProps, 'width' | 'height'> {
    size: number
    children?: UserDetail
}

const UserIcon: React.FC<UserIconProps> = (props) => {
    const { children, src, size, ...imageProps } = props
    return (
        <Image
            {...imageProps}
            className="border rounded-circle"
            width={size}
            height={size}
            objectPosition="center center"
            src={
                src
                    ? src
                    : children && children.icon
                    ? join(process.env.ICON_STORAGE, `${children.userID}.png`)
                    : '/images/avatar.png'
            }
        />
    )
}
export default UserIcon
