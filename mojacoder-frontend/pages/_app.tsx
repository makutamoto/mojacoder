import App, { AppProps, AppContext } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Amplify, withSSRContext } from 'aws-amplify'
import { AuthClass } from '@aws-amplify/auth/lib-esm/Auth'

import { I18nProvider } from '../lib/i18n'
import Auth, { AuthSession, genAuthSession } from '../lib/auth'
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
        cookieStorage: {
            domain: process.env.COOKIE_DOMAIN,
            secure: process.env.COOKIE_DOMAIN != 'localhost',
        },
    },
})

const languages = {
    ja: {
        layout: {
            mojacoder: 'MojaCoder',
            playground: 'Playground',
            signUp: '登録',
            signIn: 'サインイン',
        },
        notFound: {
            notFound: '存在しないページです。',
        },
        home: {
            description: '競技プログラミングの問題を投稿できるサイトです。',
            timeline: 'タイムライン',
        },
        playground: {
            title: 'Playground',
            description:
                'PlaygroundではMojaCoderのジャッジ上でコードの動作を確認することができます。',
            signInRequired: 'Playgroundを実行するにはサインインして下さい。',
            stdin: '標準入力',
            run: '実行',
            runningCode: 'コードを実行中です。しばらくお待ち下さい。',
            exitCode: '終了コード',
            time: '実行時間',
            memory: 'メモリ',
            stdout: '標準出力',
            stderr: '標準エラー出力',
        },
        user: {
            userNotFound: 'ユーザーが存在しません。',
            signOut: 'サインアウト',
            problem: '問題',
            problemName: '問題名',
        },
        problem: {
            submit: '提出',
        },
        signIn: {
            title: 'サインイン',
            confirmationMailSent:
                '確認メールを送信しました。メール内のリンクにアクセスすることで登録が完了します。',
            signedIn: 'サインインが完了しました。',
            error: 'エラーが発生しました。',
            invalidUsernameOrPassword:
                '無効なユーザー名もしくはパスワードです。',
            email: 'メールアドレス',
            enterEmail: 'メールアドレスを入力して下さい。',
            password: 'パスワード',
            enterPassword: 'パスワードを入力して下さい。',
            signIn: 'サインイン',
        },
        signUp: {
            title: '新規登録',
            passwordConstraintsMessage:
                'パスワードは半角英文字大文字小文字・数字・記号をそれぞれ一文字以上かつ８文字以上128文字以内である必要があります。',
            userAlreadyExists: 'ユーザーがすでに存在します。',
            error: 'エラーが発生しました。',
            username: 'ユーザー名',
            email: 'メールアドレス',
            password: 'パスワード',
            passwordConfirmation: 'パスワードの確認',
            passwordNotMatch: 'パスワードが一致しません。',
            signUp: '登録',
        },
    },
    en: {
        layout: {
            mojacoder: 'MojaCoder',
            playground: 'Playground',
            signUp: 'Sign up',
            signIn: 'Sign in',
        },
        notFound: {
            notFound: 'Page not Found.',
        },
        home: {
            description:
                'You can post your competitive programing problems here.',
            timeline: 'Timeline',
        },
        playground: {
            title: 'Playground',
            description:
                "You can test your code on the Mojacoder's Judge in the Playground page.",
            signInRequired: 'Signing in is required to run your code.',
            stdin: 'Standard Input',
            run: 'Run',
            runningCode: 'Running your code...',
            exitCode: 'Exit Code',
            time: 'Time',
            memory: 'Memory',
            stdout: 'Standard Output',
            stderr: 'Standard Error Output',
        },
        user: {
            userNotFound: 'User not found.',
            signOut: 'Sign out',
            problem: 'Problems',
            problemName: 'Problem Name',
        },
        problem: {
            submit: 'Submit',
        },
        signIn: {
            title: 'Sign in',
            confirmationMailSent: 'Confirmation mail sent.',
            signedIn: 'Signed in.',
            error: 'Error.',
            invalidUsernameOrPassword: 'Invalid username or password.',
            email: 'Email',
            enterEmail: 'Enter your email.',
            password: 'password',
            enterPassword: 'Enter your password',
            signIn: 'Sign in',
        },
        signUp: {
            title: 'Sign up',
            userAlreadyExists: 'User already exists.',
            error: 'Error',
            username: 'Username',
            email: 'Email',
            password: 'Password',
            passwordConstraintsMessage:
                'Your password must contain at least one upper and lower case letter, number, and symbol each, and must be at least 8 but no more than 128 characters long.',
            passwordConfirmation: 'Password Confirmation',
            passwordNotMatch: 'Passswords does not match.',
            signUp: 'Sign up',
        },
    },
}

export default function MyApp({ Component, pageProps }: AppProps) {
    const { locale } = useRouter()
    return (
        <I18nProvider defaultLanguage="ja" lang={locale} languages={languages}>
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
        </I18nProvider>
    )
}

MyApp.getInitialProps = async (appContext: AppContext) => {
    const appProps = await App.getInitialProps(appContext)
    let initialAuth: AuthSession | undefined = undefined
    if (appContext.ctx.req) {
        const SSR = withSSRContext({ req: appContext.ctx.req })
        try {
            const session = await (SSR.Auth as AuthClass).currentSession()
            initialAuth = await genAuthSession(session)
        } catch {
            initialAuth = null
        }
    }
    return { ...appProps, pageProps: { initialAuth } }
}
