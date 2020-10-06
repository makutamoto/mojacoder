import React from 'react'
import { Badge, Jumbotron, Image } from 'react-bootstrap'

import styles from './index.module.css'

const GITHUB_LINK = 'https://github.com/makutamoto/mojacoder'
const TWITTER_LINK = 'https://twitter.com/makutamoto'

export const Index: React.FC = () => {
    return (
        <>
            <Jumbotron>
                <div className="text-center">
                    <Image
                        className={styles['top-image']}
                        src="/illustrations/undraw_programming_2svr.svg"
                    />
                    <h2 className="mt-4">
                        競技プログラミングの問題を投稿できるサイトです。
                    </h2>
                    <Badge
                        as="a"
                        variant="dark"
                        href={TWITTER_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Author: @makutamoto
                    </Badge>{' '}
                    <Badge
                        as="a"
                        variant="dark"
                        href={GITHUB_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >
                        GitHub: makutamoto/mojacoder
                    </Badge>
                </div>
            </Jumbotron>
            <h2>タイムライン</h2>
        </>
    )
}

export default Index
