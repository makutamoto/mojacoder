import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Container, Nav, Navbar } from 'react-bootstrap'

import Auth from '../lib/auth'

const Layout: React.FC = (props) => {
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
                    <Navbar.Brand as={null}>MojaCoder</Navbar.Brand>
                </Link>
                <Navbar.Toggle />
                <Navbar.Collapse>
                    <Nav className="mr-auto">
                        <Link href="/playground">
                            <Nav.Link as="span" href="#">
                                Playground
                            </Nav.Link>
                        </Link>
                    </Nav>
                    <Nav>
                        {auth ? (
                            <Link href={`/users/${auth.screenName}`}>
                                <Nav.Link as="span" href="#">
                                    {auth.screenName}
                                </Nav.Link>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={`/signup?redirect=${encodeURIComponent(
                                        router.asPath
                                    )}`}
                                >
                                    <Nav.Link as="span" href="#">
                                        Sign up
                                    </Nav.Link>
                                </Link>
                                <Link
                                    href={`/signin?redirect=${encodeURIComponent(
                                        router.asPath
                                    )}`}
                                >
                                    <Nav.Link as="span" href="#">
                                        Sign in
                                    </Nav.Link>
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
