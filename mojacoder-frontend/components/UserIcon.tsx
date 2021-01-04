import React from 'react'
import { Image, ImageProps } from 'react-bootstrap'
import join from 'url-join'

import { UserDetail } from '../lib/backend_types'

export interface UserIconProps extends ImageProps {
    children?: UserDetail
}

const UserIcon: React.FC<UserIconProps> = (props) => {
    const { children, src, ...imageProps } = props
    return (
        <Image
            {...imageProps}
            className="border"
            roundedCircle
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
