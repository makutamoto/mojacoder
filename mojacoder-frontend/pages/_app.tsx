import { useCallback, useMemo } from 'react'
import App, { AppProps, AppContext } from 'next/app'
import Link from 'next/link'
import Head from 'next/head'
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap'
import Amplify from '@aws-amplify/core'
import Auth from '@aws-amplify/auth'
import { v4 as uuid } from 'uuid'

import {
    AuthTokens,
    useAuth,
    useAuthFunctions,
    getServerSideAuth,
} from '../lib/auth'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'codemirror/lib/codemirror.css'

import '../styles/global.css'
import '../styles/codemirror.css'

const GITHUB_LINK = 'https://github.com/makutamoto/mojacoder'
const TWITTER_LINK = 'https://twitter.com/makutamoto'

Amplify.configure({
    Auth: {
        region: process.env.AWS_REGION,
        userPoolId: process.env.USER_POOL_ID,
        userPoolWebClientId: process.env.USER_POOL_CLIENT_ID,
        cookieStorage: {
            // REQUIRED - Cookie domain
            // This should be the subdomain in production as
            // the cookie should only be present for the current site
            domain: process.env.AUTH_COOKIE_DOMAIN,
            // OPTIONAL - Cookie path
            path: '/',
            // OPTIONAL - Cookie expiration in days
            expires: 7,
            // OPTIONAL - Cookie secure flag
            // Either true or false, indicating whether the cookie
            // transmission requires a secure protocol (https).
            // The cookie should be set to secure in production.
            secure: false,
        },
    },
})

Auth.configure({
    oauth: {
        domain: process.env.IDP_DOMAIN,
        scope: ['email', 'openid', 'profile'],
        redirectSignIn: process.env.REDIRECT_SIGN_IN,
        redirectSignOut: process.env.REDIRECT_SIGN_OUT,
        responseType: 'token',
    },
})

export default function MyApp({ Component, pageProps }: AppProps) {
    const sessionID = useMemo(() => uuid(), [])
    const auth = useAuth(pageProps.initialAuth)
    const { login, logout } = useAuthFunctions()
    const OnClickSignInCallback = useCallback(() => login(), [login])
    const OnClickSignOutCallback = useCallback(() => logout(), [logout])
    return (
        <>
            <Head>
                <title>MojaCoder</title>
                <link rel="manifest" href="/manifest.json" />
            </Head>
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
                                title={
                                    (auth.idTokenData as any).preferred_username
                                }
                            >
                                <NavDropdown.Item
                                    onClick={OnClickSignOutCallback}
                                >
                                    Sign out
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <Nav.Link onClick={OnClickSignInCallback}>
                                Sign in
                            </Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
            <Container className="py-4 bg-white shadow rounded">
                <Component
                    {...pageProps}
                    sessionID={sessionID}
                    accessTokenData={
                        auth === null ? null : auth.accessTokenData
                    }
                    login={auth === null ? false : true}
                />
            </Container>
        </>
    )
}

MyApp.getInitialProps = async (appContext: AppContext) => {
    const appProps = await App.getInitialProps(appContext)
    let initialAuth: AuthTokens | null = null
    if (appContext.ctx.req) initialAuth = getServerSideAuth(appContext.ctx.req)
    return { ...appProps, pageProps: { initialAuth } }
}
