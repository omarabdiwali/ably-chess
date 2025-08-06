import '@/styles/globals.css'
import Head from 'next/head'
import { AblyProvider } from '@/utils/ably/AblyProvider'
import { Analytics } from "@vercel/analytics/react"

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PlayChess</title>
        {/* Favicon creted by https://www.flaticon.com/authors/bqlqn. */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="google-site-verification" content="AFBrxKgnj1l1SuZP7euHyl2zmEnTh5kGcTZgsZZ7bMc" />
      </Head>
      <AblyProvider>
        <Component {...pageProps} />
      </AblyProvider>
      <Analytics />
    </>
  )
}
