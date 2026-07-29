import React from 'react'

import ServiceTerminationAlert from '../../components/ServiceTerminationAlert'
import { I18nProvider } from '../../lib/i18n'
import { render } from '../testUtils'

const languages = {
    ja: {
        serviceTermination: {
            notice:
                'MojaCoderは2026年12月31日をもってサービスを終了し、ジャッジシステムを停止します。',
        },
    },
    en: {
        serviceTermination: {
            notice:
                'MojaCoder will discontinue its service and shut down the judging system on December 31, 2026.',
        },
    },
}

const renderAlert = (lang: string) =>
    render(
        <I18nProvider defaultLanguage="ja" lang={lang} languages={languages}>
            <ServiceTerminationAlert />
        </I18nProvider>
    )

describe('ServiceTerminationAlert', () => {
    it('shows the notice in Japanese', () => {
        const { getByRole, getByText } = renderAlert('ja')

        expect(
            getByText(
                'MojaCoderは2026年12月31日をもってサービスを終了し、ジャッジシステムを停止します。'
            )
        ).toBeTruthy()
        expect(getByRole('alert').classList.contains('alert-danger')).toBe(true)
    })

    it('shows the notice in English', () => {
        const { getByText } = renderAlert('en')

        expect(
            getByText(
                'MojaCoder will discontinue its service and shut down the judging system on December 31, 2026.'
            )
        ).toBeTruthy()
    })

    it('cannot be dismissed', () => {
        const { queryByRole } = renderAlert('ja')

        expect(queryByRole('button')).toBeNull()
    })
})
