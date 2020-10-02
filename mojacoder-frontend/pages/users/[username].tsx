import React from 'react'
import { Image, Jumbotron } from 'react-bootstrap'

const UserPage: React.FC = () => {
    return (
        <>
            <h1>ユーザーページ</h1>
            <hr />
            <Jumbotron>
                <div className="text-center">
                    <Image
                        roundedCircle
                        height={256}
                        src="https://pbs.twimg.com/profile_images/1263491082517544963/i-EWkDsJ_400x400.jpg"
                    />
                    <h2>Makutamoto</h2>
                </div>
            </Jumbotron>
            <h1>作問した問題</h1>
            <hr />
        </>
    )
}

export default UserPage
