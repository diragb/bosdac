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
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from "@vercel/speed-insights/next"
import AnimationFrameGenerator from '@/components/AnimationFrameGenerator'

// Context:
import { UtilitiesContextProvider } from '@/context/UtilitiesContext'
import { GlobalAnimationContextProvider } from '@/context/GlobalAnimationContext'
import { AnimationContextProvider } from '@/context/AnimationContext'
import { MapContextProvider } from '@/context/MapContext'
import { LayersContextProvider } from '@/context/LayersContext'

// Functions:
const App = ({ Component, pageProps }: AppProps) => (
  <>
    <Head>
      <meta charSet='utf-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1, viewport-fit=cover' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='mobile-web-app-capable' content='yes' />
    </Head>
    <main className={`${geistSans.className} font-sans`}>
      <UtilitiesContextProvider>
        <GlobalAnimationContextProvider>
          <MapContextProvider>
            <AnimationContextProvider>
              <LayersContextProvider>
                <AnimationFrameGenerator />
                <Component {...pageProps} />
              </LayersContextProvider>
            </AnimationContextProvider>
          </MapContextProvider>
        </GlobalAnimationContextProvider>
      </UtilitiesContextProvider>
      <Toaster />
      <Analytics />
      <SpeedInsights />
    </main>
  </>
)

// Exports:
export default App
