import React from 'react'

import AdSense from '../../components/AdSense'
import { render } from '../testUtils'

describe('AdSense', () => {
    beforeEach(() => {
        delete window.adsbygoogle
    })

    it('renders the restored ad unit and requests an ad', () => {
        const { container } = render(
            <AdSense slot="8841155425" format="fluid" layout="in-article" />
        )
        const ad = container.querySelector('ins.adsbygoogle')

        expect(ad?.getAttribute('data-ad-client')).toBe(
            'ca-pub-1558648672247263'
        )
        expect(ad?.getAttribute('data-ad-slot')).toBe('8841155425')
        expect(ad?.getAttribute('data-ad-format')).toBe('fluid')
        expect(ad?.getAttribute('data-ad-layout')).toBe('in-article')
        expect(ad?.getAttribute('data-full-width-responsive')).toBe('true')
        expect(ad?.getAttribute('data-ad-preview')).toBe('true')
        expect(ad?.textContent).toBe('広告プレビュー')
        expect(window.adsbygoogle).toEqual([{}])
    })
})
