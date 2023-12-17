import React from 'react'
import { Container } from 'react-bootstrap'

const Layout: React.FC = (props) => {
    return (
        <>
            <Container className="p-4 bg-white shadow rounded">
                {props.children}
            </Container>
            <div className="mt-2 mb-2 d-sm-block text-center text-muted">
                MojaCoder version 2023.12.18
            </div>
        </>
    )
}
export default Layout
