import React, { useEffect } from 'react'

import { ADSENSE_CLIENT } from '../lib/adsense'

declare global {
    interface Window {
        adsbygoogle?: Record<string, unknown>[]
    }
}

interface Props {
    slot: string
    format?: 'auto' | 'fluid'
    layout?: string
    fullWidthResponsive?: boolean
}

const AdSense: React.FC<Props> = ({
    slot,
    format = 'auto',
    layout,
    fullWidthResponsive = true,
}) => {
    const preview = process.env.NODE_ENV !== 'production'

    useEffect(() => {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
    }, [])

    return (
        <ins
            aria-label="広告"
            className="adsbygoogle my-4"
            style={{
                display: 'block',
                textAlign: 'center',
            }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={slot}
            data-ad-format={format}
            data-ad-layout={layout}
            data-ad-preview={preview ? 'true' : undefined}
            data-full-width-responsive={
                fullWidthResponsive ? 'true' : undefined
            }
        >
            {preview ? '広告プレビュー' : null}
        </ins>
    )
}

export default AdSense
