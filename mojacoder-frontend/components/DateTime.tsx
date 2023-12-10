import React, { useEffect, useState } from 'react'

export interface DateTimeProps {
    children?: string | Date
}

const DateTime: React.FC<DateTimeProps> = (props) => {
    const [datetime, setDatetime] = useState<Date | null>(null)
    const [datetimeStr, setDatetimeStr] = useState<string | null>(null)
    useEffect(() => {
        const date = new Date(props.children || null)
        setDatetime(datetime)
        setDatetimeStr(
            `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(
                -2
            )}-${('0' + date.getDate()).slice(-2)} ${(
                '0' + date.getHours()
            ).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}:${(
                '0' + date.getSeconds()
            ).slice(-2)}`
        )
    }, [props.children])
    return <time dateTime={datetime?.toISOString()}>{datetimeStr}</time>
}
export default DateTime
