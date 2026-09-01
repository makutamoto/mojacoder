import Document, { Html, Head, Main, NextScript } from 'next/document'

import { ADSENSE_CLIENT } from '../lib/adsense'

class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    {process.env.NODE_ENV === 'production' && (
                        <script
                            async
                            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
                            crossOrigin="anonymous"
                        ></script>
                    )}
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument
