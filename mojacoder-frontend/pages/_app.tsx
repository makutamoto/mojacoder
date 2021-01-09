import { AppProps } from 'next/app'
import Head from 'next/head'
import Router, { useRouter } from 'next/router'
import NProgress from 'nprogress'
import { Amplify } from 'aws-amplify'

import { I18nProvider } from '../lib/i18n'
import Auth from '../lib/auth'
import Session from '../lib/session'
import Appbar from '../containers/Appbar'
import Authenticate from '../containers/Authenticate'

import 'nprogress/nprogress.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'codemirror/lib/codemirror.css'
import 'katex/dist/katex.min.css'

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
        appbar: {
            mojacoder: 'MojaCoder',
            playground: 'Playground',
            problems: '問題',
            postProblem: '問題を投稿',
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
            settings: '設定',
        },
        problem: {
            submit: '提出',
            signInRequired: '提出するにはサインインして下さい。',
        },
        submissions: {
            signInRequired: '自分の提出をみるにはサインインして下さい。',
        },
        problemTab: {
            problem: '問題',
            submissions: '提出',
            testcases: 'テストケース',
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
        settings: {
            title: '設定',
            signInRequired: '設定を行うにはサインインしてください。',
            icon: 'アイコン',
            update: '更新',
            clearIcon: 'アイコンを解除',
            dropHereOrSelect:
                'ここにファイルをドロップするか、クリックして選択してください。',
            regulationOfIcon:
                '正方形で幅が512ピクセル以下かつサイズが1MB以下であるPNGファイルを設定できます。',
            updatedMessage: '更新が完了しました。',
            errorMessage: 'エラーが発生しました。',
        },
    },
    en: {
        appbar: {
            mojacoder: 'MojaCoder',
            playground: 'Playground',
            problems: 'Problems',
            postProblem: 'Post Problem',
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
            settings: 'Settings',
        },
        problem: {
            submit: 'Submit',
            signInRequired: 'Signing in is required to submit your code.',
        },
        submissions: {
            signInRequired: 'Signing in is required to see your submissions.',
        },
        problemTab: {
            problem: 'Problem',
            submissions: 'Submissions',
            testcases: 'Test cases',
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
        settings: {
            title: 'Settings',
            signInRequired: 'Signning in is required to perform settings.',
            icon: 'Icon',
            update: 'Update',
            clearIcon: 'Clear',
            dropHereOrSelect: 'Drop a .png file here, or click to select it.',
            regulationOfIcon:
                'The .png file must be square and its width and file size must NOT exceed 512 px and 1MB.',
            updatedMessage: 'Done.',
            errorMessage: 'Error.',
        },
    },
}

const App = ({ Component, pageProps }: AppProps) => {
    const { locale } = useRouter()
    return (
        <I18nProvider defaultLanguage="ja" lang={locale} languages={languages}>
            <Auth.Provider>
                <Authenticate />
                <Session.Provider>
                    <Head>
                        <title>MojaCoder</title>
                        <link rel="manifest" href="/manifest.json" />
                        <link
                            rel="icon"
                            href="/images/logo.svg"
                            type="image/svg+xml"
                        />
                    </Head>
                    <Appbar />
                    <Component {...pageProps} />
                </Session.Provider>
            </Auth.Provider>
        </I18nProvider>
    )
}
export default App

NProgress.configure({ showSpinner: false })
Router.events.on('routeChangeStart', () => NProgress.start())
Router.events.on('routeChangeComplete', () => NProgress.done())
Router.events.on('routeChangeError', () => NProgress.done())
