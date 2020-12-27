import React, { useMemo } from 'react'

export interface DateTimeProps {
    children?: string | Date
}

const DateTime: React.FC<DateTimeProps> = (props) => {
    const datetime = useMemo(() => {
        return new Date(props.children || null)
    }, [props.children])
    return (
        <time dateTime={datetime.toISOString()}>{`${datetime.getFullYear()}-${(
            '0' +
            (datetime.getMonth() + 1)
        ).slice(-2)}-${('0' + datetime.getDate()).slice(-2)} ${(
            '0' + datetime.getHours()
        ).slice(-2)}:${('0' + datetime.getMinutes()).slice(-2)}:${(
            '0' + datetime.getSeconds()
        ).slice(-2)}`}</time>
    )
}
export default DateTime
