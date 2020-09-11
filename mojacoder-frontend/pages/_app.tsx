import { useCallback } from 'react'
import App, { AppProps, AppContext } from 'next/app'
import Head from 'next/head'
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap'
import Amplify from '@aws-amplify/core'
import Auth from '@aws-amplify/auth'

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

Amplify.configure({
  API: {
    aws_appsync_graphqlEndpoint: process.env.APPSYNC_ENDPOINT,
    aws_appsync_region: process.env.AWS_REGION,
    aws_appsync_authenticationType: 'API_KEY',
    aws_appsync_apiKey: process.env.APPSYNC_API_KEY,
  },
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
        <Navbar.Brand href="/">MojaCoder</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            {auth ? (
              <NavDropdown
                id="navbar-user-dropdown"
                title={(auth.idTokenData as any).preferred_username}
              >
                <NavDropdown.Item onClick={OnClickSignOutCallback}>
                  Sign out
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link onClick={OnClickSignInCallback}>Sign in</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Container className="py-4 bg-white shadow rounded">
        <Component {...pageProps} login={auth === null ? false : true} />
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
