import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Container, Nav, Navbar } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'

const Layout: React.FC = (props) => {
    const { t } = useI18n('layout')
    const router = useRouter()
    const { auth } = Auth.useContainer()
    return (
        <>
            <Navbar
                collapseOnSelect
                sticky="top"
                bg="dark"
                variant="dark"
                expand="sm"
            >
                <Link href="/">
                    <Navbar.Brand as={null}>{t`mojacoder`}</Navbar.Brand>
                </Link>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    <Nav className="mr-auto">
                        <Link href="/playground" passHref>
                            <Nav.Link>{t`playground`}</Nav.Link>
                        </Link>
                    </Nav>
                    <Nav>
                        <Link href="" locale="en" passHref>
                            <Nav.Link>EN</Nav.Link>
                        </Link>
                        <Link href="" locale="ja" passHref>
                            <Nav.Link>JA</Nav.Link>
                        </Link>
                        {auth ? (
                            <Link href={`/users/${auth.screenName}`} passHref>
                                <Nav.Link>{auth.screenName}</Nav.Link>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={`/signup?redirect=${encodeURIComponent(
                                        router.asPath
                                    )}`}
                                    passHref
                                >
                                    <Nav.Link>{t`signUp`}</Nav.Link>
                                </Link>
                                <Link
                                    href={`/signin?redirect=${encodeURIComponent(
                                        router.asPath
                                    )}`}
                                    passHref
                                >
                                    <Nav.Link>{t`signIn`}</Nav.Link>
                                </Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
            <Container className="py-4 bg-white shadow rounded">
                {props.children}
            </Container>
        </>
    )
}
export default Layout
