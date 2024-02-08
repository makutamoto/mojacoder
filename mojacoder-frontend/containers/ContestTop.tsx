import React, { useEffect, useState } from 'react'
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
import { CalendarIcon, ClockIcon, StopwatchIcon } from '@primer/octicons-react'

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
    const start = new Date(contest.startDatetime).getTime()
    const end = start + contest.duration * 1000 // s -> ms
    const contestEndtime = new Date(end).toISOString()
    const [contestTimerString, setContestTimerString] = useState('')

    useEffect(() => {
        const id = setInterval(() => {
            const nowUTC = Date.now()
            if (end <= nowUTC) {
                setContestTimerString('')
                return
            }
            let diff
            if (nowUTC < start) {
                diff = Math.floor((start - nowUTC) / 1000)
            } else {
                diff = Math.floor((end - nowUTC) / 1000)
            }
            const days = Math.floor(diff / 86400)
            const hours = Math.floor((diff % 86400) / 3600)
            const minutes = Math.floor((diff % 3600) / 60)
            const seconds = Math.floor(diff % 60)
            let timerString = `${String(hours).padStart(2, '0')}:${String(
                minutes
            ).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            if (days > 0) {
                timerString = `${days}日${timerString}`
            }
            if (nowUTC < start) {
                timerString = `開始まで ${timerString}`
            } else {
                timerString = `終了まで ${timerString}`
            }
            setContestTimerString(timerString)
        }, 1000)
        return () => clearInterval(id)
    }, [])

    return (
        <Top>
            <div className="text-center">
                <h1>{contest.name}</h1>
                <div className="my-2">
                    <div>
                        <IconWithText icon={<CalendarIcon />}>
                            <DateTime>{contest.startDatetime}</DateTime>～
                            <DateTime>{contestEndtime}</DateTime>
                        </IconWithText>
                    </div>
                    <div>
                        <IconWithText icon={<ClockIcon />}>
                            {Math.floor(contest.duration / 60)} minutes{' '}
                            {contest.duration % 60} secs
                        </IconWithText>
                    </div>
                    {contestTimerString !== '' && (
                        <div>
                            <IconWithText icon={<StopwatchIcon />}>
                                {contestTimerString}
                            </IconWithText>
                        </div>
                    )}
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
                        <Link legacyBehavior passHref href={basePath}>
                            <Nav.Link eventKey="top">{t`top`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    {detail?.contestID && (
                        <Nav.Item>
                            <Link
                                legacyBehavior
                                passHref
                                href={join(basePath, 'tasks')}
                            >
                                <Nav.Link eventKey="tasks">{t`tasks`}</Nav.Link>
                            </Link>
                        </Nav.Item>
                    )}
                    <Nav.Item>
                        <Link
                            legacyBehavior
                            passHref
                            href={join(basePath, 'standings')}
                        >
                            <Nav.Link eventKey="standings">{t`standings`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    {detail?.contestID && (
                        <Nav.Item>
                            <Link
                                legacyBehavior
                                passHref
                                href={join(basePath, 'submissions')}
                            >
                                <Nav.Link eventKey="submissions">{t`submissions`}</Nav.Link>
                            </Link>
                        </Nav.Item>
                    )}
                    {auth && auth.userID === contest.user.detail.userID && (
                        <Nav.Item>
                            <Link
                                legacyBehavior
                                passHref
                                href={join(basePath, 'edit')}
                            >
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
