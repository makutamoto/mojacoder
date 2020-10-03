import React, { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Auth as Cognito } from 'aws-amplify'
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap'

import Auth from '../lib/auth'

const GITHUB_LINK = 'https://github.com/makutamoto/mojacoder'
const TWITTER_LINK = 'https://twitter.com/makutamoto'

const Layout: React.FC = (props) => {
    const router = useRouter()
    const { auth, setAuth } = Auth.useContainer()
    const OnClickSignOutCallback = useCallback(() => {
        Cognito.signOut()
            .then(() => setAuth(null))
            .catch((err) => console.error(err))
    }, [auth])
    return (
        <>
            <Navbar sticky="top" bg="dark" variant="dark" expand="sm">
                <Link href="/">
                    <Navbar.Brand as={null}>MojaCoder</Navbar.Brand>
                </Link>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    <Nav className="mr-auto">
                        <Link href="/playground">
                            <Nav.Link as="span">Playground</Nav.Link>
                        </Link>
                        <NavDropdown id="navbar-links-dropdown" title="Links">
                            <NavDropdown.Item
                                href={GITHUB_LINK}
                                target="_blank"
                                rel="noreferrer"
                            >
                                GitHub
                            </NavDropdown.Item>
                            <NavDropdown.Item
                                href={TWITTER_LINK}
                                target="_blank"
                                rel="noreferrer"
                            >
                                @makutamoto
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <Nav>
                        {auth ? (
                            <NavDropdown
                                id="navbar-user-dropdown"
                                title={auth.idToken.payload.preferred_username}
                            >
                                <NavDropdown.Item
                                    onClick={OnClickSignOutCallback}
                                >
                                    Sign out
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <>
                                <Link
                                    href={`/signup?redirect=${encodeURIComponent(
                                        router.asPath
                                    )}`}
                                >
                                    <Nav.Link as="span">Sign up</Nav.Link>
                                </Link>
                                <Link
                                    href={`/signin?redirect=${encodeURIComponent(
                                        router.asPath
                                    )}`}
                                >
                                    <Nav.Link as="span">Sign in</Nav.Link>
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
