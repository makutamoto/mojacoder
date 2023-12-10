import React from 'react'
import Image from 'next/image'

import { useI18n } from '../lib/i18n'
import Top from '../components/Top'
import Title from '../components/Title'

const Error: React.FC = () => {
    const { t } = useI18n('notFound')
    return (
        <>
            <Title>ページが存在しません</Title>
            <Top className="text-center">
                <Image
                    alt="404 image"
                    width={512}
                    height={256}
                    src="/illustrations/undraw_page_not_found_su7k.svg"
                />
                <h2 className="mt-3">{t`notFound`}</h2>
            </Top>
        </>
    )
}
export default Error
