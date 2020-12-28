import React from 'react'
import { Container } from 'react-bootstrap'

const Layout: React.FC = (props) => {
    return (
        <>
            <Container className="p-4 bg-white shadow rounded">
                {props.children}
            </Container>
            <div className="mt-4 d-sm-block d-none" />
        </>
    )
}
export default Layout
