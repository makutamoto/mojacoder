import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Nav } from 'react-bootstrap'
import join from 'url-join'

import { useI18n } from '../lib/i18n'
import { Contest, ContestDetail } from '../lib/backend_types'
import Auth from '../lib/auth'
import Top from '../components/Top'
import IconWithText from '../components/IconWithText'
import Username from '../components/Username'
import DateTime from '../components/DateTime'
import { CalendarIcon, ClockIcon } from '@primer/octicons-react'

export interface ContestTopProps {
    activeKey?: 'top' | 'tasks' | 'standings' | 'submissions' | 'edit'
    contest: Contest
    detail?: ContestDetail
}

const ContestTop: React.FC<ContestTopProps> = ({
    activeKey,
    contest,
    detail,
}) => {
    const { t } = useI18n('contestTop')
    const { auth } = Auth.useContainer()
    const { query, defaultLocale, locale } = useRouter()
    const basePath = join(
        '/users',
        (query.username || '') as string,
        'contests',
        (query.contestSlug || '') as string
    )
    return (
        <Top>
            <div className="text-center">
                <h1>{contest.name}</h1>
                <div className="my-2">
                    <div>
                        <IconWithText icon={<CalendarIcon />}>
                            <DateTime>{contest.startDatetime}</DateTime>
                        </IconWithText>
                    </div>
                    <div>
                        <IconWithText icon={<ClockIcon />}>
                            {Math.floor(contest.duration / 60)} minutes{' '}
                            {contest.duration % 60} secs
                        </IconWithText>
                    </div>
                    <div>
                        <Username>{contest.user.detail}</Username>
                    </div>
                    <div className="my-2">
                        <a
                            href={`https://twitter.com/intent/tweet?hashtags=MojaCoder&url=${encodeURIComponent(
                                join(
                                    process.env.ORIGIN,
                                    locale === defaultLocale ? '' : locale,
                                    basePath
                                )
                            )}`}
                        >
                            Tweet
                        </a>
                    </div>
                </div>
                <Nav
                    className="mb-3 justify-content-center"
                    variant="pills"
                    activeKey={activeKey}
                >
                    <Nav.Item>
                        <Link passHref href={basePath}>
                            <Nav.Link eventKey="top">{t`top`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    {detail?.contestID && (
                        <Nav.Item>
                            <Link passHref href={join(basePath, 'tasks')}>
                                <Nav.Link eventKey="tasks">{t`tasks`}</Nav.Link>
                            </Link>
                        </Nav.Item>
                    )}
                    <Nav.Item>
                        <Link passHref href={join(basePath, 'standings')}>
                            <Nav.Link eventKey="standings">{t`standings`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    {detail?.contestID && (
                        <Nav.Item>
                            <Link passHref href={join(basePath, 'submissions')}>
                                <Nav.Link eventKey="submissions">{t`submissions`}</Nav.Link>
                            </Link>
                        </Nav.Item>
                    )}
                    {auth && auth.userID === contest.user.detail.userID && (
                        <Nav.Item>
                            <Link passHref href={join(basePath, 'edit')}>
                                <Nav.Link eventKey="edit">{t`edit`}</Nav.Link>
                            </Link>
                        </Nav.Item>
                    )}
                </Nav>
            </div>
        </Top>
    )
}
export default ContestTop
