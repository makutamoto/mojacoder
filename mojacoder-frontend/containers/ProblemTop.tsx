import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Nav } from 'react-bootstrap'
import { join } from 'path'

import { useI18n } from '../lib/i18n'
import { Problem } from '../lib/backend_types'
import Top from '../components/Top'
import IconWithText from '../components/IconWithText'
import Username from '../components/Username'
import {
    BeakerIcon,
    ClockIcon,
    HeartIcon,
    SmileyIcon,
} from '@primer/octicons-react'

export interface ProblemTopProps {
    activeKey: 'problem' | 'submissions' | 'testcases'
    problem?: Problem
}

const ProblemTop: React.FC<ProblemTopProps> = (props) => {
    const { t } = useI18n('problemTab')
    const { query, locale } = useRouter()
    const { activeKey, problem } = props
    const basePath = join(
        '/users',
        (query.username || '') as string,
        'problems',
        (query.problemID || '') as string
    )
    return (
        <Top>
            <div className="text-center">
                <h1>{problem?.title}</h1>
                <div className="my-2">
                    <div>
                        <IconWithText icon={<ClockIcon />}>2 secs</IconWithText>{' '}
                        <IconWithText icon={<BeakerIcon />}>
                            1024 MB
                        </IconWithText>
                    </div>
                    <div>
                        <IconWithText icon={<SmileyIcon />}>
                            <Username>{problem?.user.detail}</Username>
                        </IconWithText>
                    </div>
                    <div className="mt-2">
                        <IconWithText icon={<HeartIcon />}>0</IconWithText>{' '}
                        <a
                            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                                join(process.env.ORIGIN, locale, basePath)
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
                            <Nav.Link eventKey="problem">{t`problem`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link passHref href={join(basePath, 'submissions')}>
                            <Nav.Link eventKey="submissions">{t`submissions`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link passHref href={join(basePath, 'testcases')}>
                            <Nav.Link eventKey="testcases">{t`testcases`}</Nav.Link>
                        </Link>
                    </Nav.Item>
                </Nav>
            </div>
        </Top>
    )
}
export default ProblemTop
