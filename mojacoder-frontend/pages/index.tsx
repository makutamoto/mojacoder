import React from 'react'
import { MarkGithubIcon } from '@primer/octicons-react'
import { Container, Image } from 'react-bootstrap'

import IconWithText from '../components/IconWithText'
import Layout from '../components/Layout'
import Title from '../components/Title'

const GITHUB_LINK = 'https://github.com/makutamoto/mojacoder'
const TWITTER_LINK = 'https://twitter.com/makutamoto'

export const Index: React.FC = () => {
    return (
        <>
            <Title />
            <div
                className="d-flex flex-column justify-content-center bg-dark"
                style={{ height: 'calc(100vh - 56px)' }}
            >
                <Container style={{ marginTop: '-1.5rem' }}>
                    <h1>
                        <Image src="/images/logo.svg" width={64} />{' '}
                        <span className="align-middle text-white">
                            MojaCoder
                        </span>
                    </h1>
                    <h2>
                        <span
                            style={{
                                display: 'inline-block',
                                background:
                                    'linear-gradient(to right, #DC3545, #007BFF)',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                            }}
                        >
                            解けた！を
                            <br className="d-block d-sm-none" />
                            私も作りたい。
                        </span>
                    </h2>
                </Container>
            </div>
            <div style={{ marginTop: '-1.5rem' }}>
                <Layout>
                    <h3>MojaCoderとは？</h3>
                    <p>
                        MojaCoderは競技プログラミングの新たな作問プラットフォームです。
                        <br />
                        初心者から上級者まで気軽に問題を作成して、共有できる環境を目指しています。
                    </p>
                </Layout>
                <Layout>
                    <h4>投稿に必要なのはユーザー登録のみ</h4>
                    <p>
                        MojaCoderでの作問にレートや解いた問題数は関係ありません。
                        <br />
                        競技プログラミングを初めたばかりの人もそうでない人も平等に作問に取り組むことができます。
                    </p>
                </Layout>
                <Layout>
                    <h4>シェアしよう！</h4>
                    <p>
                        作った問題はTwitterで共有してみましょう！
                        <br />
                        フォロワーのみなさんがあなたの問題を楽しんでくれるはずです！
                    </p>
                </Layout>
                <Layout>
                    <h3>寄付のお願い</h3>
                    <p>
                        MojaCoderは現在維持費として月額5000円程かかっています。
                        <br />
                        今後のジャッジサーバー増強や機能追加のためにも寄付をお願いしたいです。
                    </p>
                    <iframe
                        src="https://github.com/sponsors/makutamoto/button"
                        title="Sponsor makutamoto"
                        height="35"
                        width="116"
                        style={{ border: 0 }}
                    ></iframe>
                </Layout>
                <Layout>
                    <h3>お問い合わせ</h3>
                    <div>
                        <a href={TWITTER_LINK} target="_blank" rel="noreferrer">
                            @makutamoto
                        </a>{' '}
                        <IconWithText icon={<MarkGithubIcon />}>
                            <a
                                href={GITHUB_LINK}
                                target="_blank"
                                rel="noreferrer"
                            >
                                makutamoto/mojacoder
                            </a>
                        </IconWithText>
                    </div>
                </Layout>
                <Layout>
                    <h3>謝辞</h3>
                    <p>
                        キャッチフレーズを
                        <a
                            href="https://twitter.com/programsamisii"
                            target="_blank"
                            rel="noreferrer"
                        >
                            @programsamisii
                        </a>
                        さんからいただきました。 ありがとうございます！
                    </p>
                </Layout>
            </div>
        </>
    )
}

export default Index
