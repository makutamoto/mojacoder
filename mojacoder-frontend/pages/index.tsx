import React from 'react'
import { Badge, Jumbotron, Image } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'

import styles from './index.module.css'

const GITHUB_LINK = 'https://github.com/makutamoto/mojacoder'
const TWITTER_LINK = 'https://twitter.com/makutamoto'

export const Index: React.FC = () => {
    const { t } = useI18n('home')
    return (
        <>
            <Jumbotron>
                <div className="text-center">
                    <Image
                        className={styles['top-image']}
                        src="/illustrations/undraw_programming_2svr.svg"
                    />
                    <h2 className="mt-4">{t`description`}</h2>
                    <Badge
                        as="a"
                        variant="dark"
                        href={TWITTER_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Author: @makutamoto
                    </Badge>{' '}
                    <Badge
                        as="a"
                        variant="dark"
                        href={GITHUB_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >
                        GitHub: makutamoto/mojacoder
                    </Badge>
                </div>
            </Jumbotron>
            <h2>{t`timeline`}</h2>
        </>
    )
}

export default Index
