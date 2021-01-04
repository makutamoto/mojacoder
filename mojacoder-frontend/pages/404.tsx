import React from 'react'
import { Image } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'
import Top from '../components/Top'

import styles from '../css/image.module.css'

const Error: React.FC = () => {
    const { t } = useI18n('notFound')
    return (
        <Top className="text-center">
            <Image
                className={styles['top-image']}
                src="/illustrations/undraw_page_not_found_su7k.svg"
            />
            <h2 className="mt-3">{t`notFound`}</h2>
        </Top>
    )
}
export default Error
