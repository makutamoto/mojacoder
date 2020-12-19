import React from 'react'
import { Container } from 'react-bootstrap'

const Layout: React.FC = (props) => {
    return (
        <Container className="mb-4 p-4 bg-white shadow rounded">
            {props.children}
        </Container>
    )
}
export default Layout
