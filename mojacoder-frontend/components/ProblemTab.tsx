import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Nav } from 'react-bootstrap'
import { join } from 'path'

import { useI18n } from '../lib/i18n'

interface Props {
    activeKey: 'problem' | 'submissions'
}

const ProblemTab: React.FC<Props> = (props) => {
    const { t } = useI18n('problemTab')
    const { query } = useRouter()
    const basePath = join(
        '/users',
        query.username as string,
        'problems',
        query.id as string
    )
    return (
        <Nav className="mb-3" variant="tabs" activeKey={props.activeKey}>
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
        </Nav>
    )
}
export default ProblemTab
