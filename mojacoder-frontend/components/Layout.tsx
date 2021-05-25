import React from 'react'
import { Container } from 'react-bootstrap'
import AdSense from 'react-adsense'

const Layout: React.FC = (props) => {
    return (
        <>
            <Container className="p-4 bg-white shadow rounded">
                <div className="mt-4">{props.children}</div>
                <AdSense.Google
                    style={{
                        display: 'block',
                        textAlign: 'center',
                    }}
                    client="ca-pub-1558648672247263"
                    slot="8841155425"
                    format="fluid"
                    layout="in-article"
                />
            </Container>
            <div className="mt-4 d-sm-block d-none" />
        </>
    )
}
export default Layout
