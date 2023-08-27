import '@/styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Chess</title>
        <meta name="google-site-verification" content="I8lDd4E2396ERE7e2VqqxppEraRzY_InsjQyuqZRsqI" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
