import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Container, Nav, Navbar } from 'react-bootstrap'

import { useI18n } from '../lib/i18n'
import Auth from '../lib/auth'

const Layout: React.FC = (props) => {
    const { t } = useI18n('layout')
    const { asPath, locale, pathname } = useRouter()
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
                <Link href="/" passHref>
                    <Navbar.Brand>{t`mojacoder`}</Navbar.Brand>
                </Link>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    <Nav className="mr-auto">
                        <Link href="/playground" passHref>
                            <Nav.Link
                                active={pathname === '/playground'}
                            >{t`playground`}</Nav.Link>
                        </Link>
                    </Nav>
                    <Nav>
                        <Link href={asPath} locale="en" passHref>
                            <Nav.Link active={locale === 'en'}>EN</Nav.Link>
                        </Link>
                        <Link href={asPath} locale="ja" passHref>
                            <Nav.Link active={locale === 'ja'}>JA</Nav.Link>
                        </Link>
                        {auth ? (
                            <Link href={`/users/${auth.screenName}`} passHref>
                                <Nav.Link
                                    active={pathname === '/users/[username]'}
                                >
                                    {auth.screenName}
                                </Nav.Link>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={`/signup?redirect=${encodeURIComponent(
                                        asPath
                                    )}`}
                                    passHref
                                >
                                    <Nav.Link
                                        active={pathname === '/signup'}
                                    >{t`signUp`}</Nav.Link>
                                </Link>
                                <Link
                                    href={`/signin?redirect=${encodeURIComponent(
                                        asPath
                                    )}`}
                                    passHref
                                >
                                    <Nav.Link
                                        active={pathname === '/signin'}
                                    >{t`signIn`}</Nav.Link>
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
