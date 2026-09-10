import React from 'react'

import ServiceTerminationAlert from '../../components/ServiceTerminationAlert'
import { I18nProvider } from '../../lib/i18n'
import { render } from '../testUtils'

const languages = {
    ja: {
        serviceTermination: {
            notice:
                'MojaCoderは2026年12月31日をもって、ジャッジシステムを含むすべてのサービスを停止します。終了後はデータの閲覧・ダウンロードができなくなるため、必要なデータはサービス終了前にダウンロードして保存してください。',
        },
    },
    en: {
        serviceTermination: {
            notice:
                'MojaCoder will shut down all services, including the judging system, on December 31, 2026. Please download and save any data you need before the service ends, as you will no longer be able to view or download it afterward.',
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
                'MojaCoderは2026年12月31日をもって、ジャッジシステムを含むすべてのサービスを停止します。終了後はデータの閲覧・ダウンロードができなくなるため、必要なデータはサービス終了前にダウンロードして保存してください。'
            )
        ).toBeTruthy()
        expect(getByRole('alert').classList.contains('alert-danger')).toBe(true)
    })

    it('shows the notice in English', () => {
        const { getByText } = renderAlert('en')

        expect(
            getByText(
                'MojaCoder will shut down all services, including the judging system, on December 31, 2026. Please download and save any data you need before the service ends, as you will no longer be able to view or download it afterward.'
            )
        ).toBeTruthy()
    })

    it('cannot be dismissed', () => {
        const { queryByRole } = renderAlert('ja')

        expect(queryByRole('button')).toBeNull()
    })
})
