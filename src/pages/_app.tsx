// Packages:
import { Geist } from 'next/font/google'

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

// Functions:
const App = ({ Component, pageProps }: AppProps) => (
  <main className={`${geistSans.className} font-sans`}>
    <Component {...pageProps} />
  </main>
)

// Exports:
export default App
