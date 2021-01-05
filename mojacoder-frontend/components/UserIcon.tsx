import React from 'react'
import Image, { ImageProps } from 'next/image'
import join from 'url-join'

import { UserDetail } from '../lib/backend_types'

export interface UserIconProps
    extends Omit<ImageProps, 'width' | 'height' | 'src'> {
    size: number
    src?: string
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
            layout="fixed"
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
