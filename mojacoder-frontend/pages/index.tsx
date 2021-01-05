import React from 'react'
import Image from 'next/image'
import { MarkGithubIcon, SmileyIcon } from '@primer/octicons-react'

import { useI18n } from '../lib/i18n'
import IconWithText from '../components/IconWithText'
import Layout from '../components/Layout'
import Top from '../components/Top'

const GITHUB_LINK = 'https://github.com/makutamoto/mojacoder'
const TWITTER_LINK = 'https://twitter.com/makutamoto'

export const Index: React.FC = () => {
    const { t } = useI18n('home')
    return (
        <>
            <Top>
                <div className="text-center">
                    <Image
                        width={512}
                        height={256}
                        src="/illustrations/undraw_programming_2svr.svg"
                    />
                    <h2 className="mt-4">{t`description`}</h2>
                    <div>
                        <IconWithText icon={<SmileyIcon />}>
                            <a
                                href={TWITTER_LINK}
                                target="_blank"
                                rel="noreferrer"
                            >
                                @makutamoto
                            </a>
                        </IconWithText>{' '}
                        <IconWithText icon={<MarkGithubIcon />}>
                            <a
                                href={GITHUB_LINK}
                                target="_blank"
                                rel="noreferrer"
                            >
                                makutamoto/mojacoder
                            </a>
                        </IconWithText>
                    </div>
                </div>
            </Top>
            <Layout>
                <h2>{t`timeline`}</h2>
            </Layout>
        </>
    )
}

export default Index
