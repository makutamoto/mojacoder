import App, { AppProps, AppContext } from 'next/app'
import Head from 'next/head'
import { Amplify, withSSRContext } from 'aws-amplify'
import { AuthClass } from '@aws-amplify/auth/lib-esm/Auth'
import { CognitoUserSession } from 'amazon-cognito-identity-js'

import Auth from '../lib/auth'
import Session from '../lib/session'
import Layout from '../containers/Layout'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'codemirror/lib/codemirror.css'

import '../styles/global.css'
import '../styles/codemirror.css'

Amplify.configure({
    ssr: true,
    Auth: {
        region: process.env.AWS_REGION,
        userPoolId: process.env.USER_POOL_ID,
        userPoolWebClientId: process.env.USER_POOL_CLIENT_ID,
    },
})

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <Auth.Provider initialState={pageProps.initialAuth}>
            <Session.Provider>
                <Head>
                    <title>MojaCoder</title>
                    <link rel="manifest" href="/manifest.json" />
                </Head>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </Session.Provider>
        </Auth.Provider>
    )
}

MyApp.getInitialProps = async (appContext: AppContext) => {
    const appProps = await App.getInitialProps(appContext)
    let initialAuth: CognitoUserSession | undefined = undefined
    if (appContext.ctx.req) {
        const SSR = withSSRContext({ req: appContext.ctx.req })
        try {
            initialAuth = await (SSR.Auth as AuthClass).currentSession()
        } catch {
            initialAuth = null
        }
    }
    return { ...appProps, pageProps: { initialAuth } }
}
