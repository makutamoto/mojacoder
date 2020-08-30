import { AppProps } from 'next/app'
import Head from 'next/head'
import { Container, Navbar } from 'react-bootstrap'

import 'bootstrap/dist/css/bootstrap.min.css'

export default function ({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>MojaCoder</title>
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="/">MojaCoder</Navbar.Brand>
      </Navbar>
      <Container className="py-4">
        <Component {...pageProps} />
      </Container>
    </>
  )
}
