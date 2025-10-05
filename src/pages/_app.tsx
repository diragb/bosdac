// Packages:
import { Geist } from 'next/font/google'
import Head from 'next/head'

// Typescript:
import type { AppProps } from 'next/app'

// Assets:
import '@/styles/globals.css'
import 'leaflet/dist/leaflet.css'

// Constants:
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

// Components:
import { Toaster } from '@/components/ui/sonner'

// Functions:
const App = ({ Component, pageProps }: AppProps) => (
  <>
    <Head>
      <meta name='viewport' content='width=device-width, initial-scale=1, viewport-fit=cover' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='mobile-web-app-capable' content='yes' />
    </Head>
    <main className={`${geistSans.className} font-sans`}>
      <Component {...pageProps} />
      <Toaster />
    </main>
  </>
)

// Exports:
export default App
