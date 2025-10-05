// Components:
import {
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document'

// Functions:
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const appName = 'BOSDAC - Better MOSDAC'
const appDescription = 'Modern, user-friendly interface for viewing live satellite imagery and meteorological data from ISRO\'s MOSDAC.'

const Document = () => (
  <Html lang='en'>
    <Head>
      {/* Primary Meta Tags */}
      <meta name='title' content={appName} />
      <meta name='description' content={appDescription} />
      <meta name='application-name' content='BOSDAC' />
      <meta name='theme-color' content='#0f172a' />
      <meta name='viewport' content='width=device-width, initial-scale=1, viewport-fit=cover' />

      {/* Canonical */}
      <link rel='canonical' href={siteUrl} />

      {/* Favicons */}
      <link rel='icon' href='/favicon.ico' />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content='website' />
      <meta property='og:url' content={siteUrl} />
      <meta property='og:title' content={appName} />
      <meta property='og:description' content={appDescription} />
      <meta property='og:image' content={`${siteUrl}/og-image.jpg`} />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='630' />
      <meta property='og:image:alt' content='BOSDAC - Better MOSDAC' />
      <meta property='og:image' content={`${siteUrl}/og-square.jpg`} />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='1200' />

      {/* Twitter */}
      <meta name='twitter:title' content={appName} />
      <meta name='twitter:description' content={appDescription} />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:image' content={`${siteUrl}/twitter-image.jpg`} />
      <meta name='twitter:image:alt' content='BOSDAC - Better MOSDAC' />

      {/* JSON-LD Structured Data */}
      <script
        type='application/ld+json'
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'BOSDAC',
            alternateName: 'Better MOSDAC',
            url: siteUrl,
            applicationCategory: 'Weather',
            operatingSystem: 'Web',
            description: appDescription,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            creator: {
              '@type': 'Person',
              name: 'diragb',
              url: 'https://github.com/diragb',
            },
          }),
        }}
      />
    </Head>
    <body className='antialiased'>
      <Main />
      <NextScript />
    </body>
  </Html>
)

// Exports:
export default Document
