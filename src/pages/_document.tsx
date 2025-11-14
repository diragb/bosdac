// Constants:
export const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const appName = 'BOSDAC - Better MOSDAC'
export const appDescription = 'BOSDAC streams MOSDAC data for india live satellite imagery, satellite view of india, and live weather insights for India and China.'
export const appKeywords = 'india weather, MOSDAC, BOSDAC, live satellite view of india, weather, india satellite image, live satellite, india, imd, satellite live, imd live, live weather china, ISRO, ISRO weather data'

// Components:
import {
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document'

// Functions:
const Document = () => (
  <Html lang='en'>
    <Head>
      {/* Primary Meta Tags */}
      <meta name='title' content={appName} />
      <meta name='description' content={appDescription} />
      <meta name='keywords' content={appKeywords} />
      <meta name='application-name' content='BOSDAC' />
      <meta name='theme-color' content='#0f172a' />
      <meta name='image' content={`${siteURL}/og-square.jpg`} />

      {/* Canonical */}
      <link rel='canonical' href={siteURL} />

      {/* Favicons */}
      <link rel='icon' href='/favicon.ico' />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content='website' />
      <meta property='og:url' content={siteURL} />
      <meta property='og:site_name' content={appName} />
      <meta property='og:title' content={appName} />
      <meta property='og:description' content={appDescription} />
      <meta property='og:image' content={`${siteURL}/og-image.jpg`} />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='630' />
      <meta property='og:image:alt' content='BOSDAC - Better MOSDAC' />
      <meta property='og:image' content={`${siteURL}/og-square.jpg`} />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='1200' />

      {/* Twitter */}
      <meta name='twitter:title' content={appName} />
      <meta name='twitter:description' content={appDescription} />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:creator' content='diragb' />
      <meta name='twitter:image' content={`${siteURL}/twitter-image.jpg`} />
      <meta name='twitter:image:alt' content='BOSDAC - Better MOSDAC' />

      {/* JSON-LD Structured Data */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'BOSDAC',
            alternateName: 'Better MOSDAC',
            url: siteURL,
            applicationCategory: 'Weather',
            operatingSystem: 'Web',
            description: appDescription,
            keywords: [
              'MOSDAC',
              'india live satellite',
              'satellite view of india',
              'live weather india',
              'live weather china',
            ],
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
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How can I view MOSDAC India live satellite imagery?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Open BOSDAC in your browser to view MOSDAC-powered india live satellite tiles with up-to-date imagery and overlays.',
                },
              },
              {
                '@type': 'Question',
                name: 'Does BOSDAC show the satellite view of India and China?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. BOSDAC offers a high-resolution satellite view of India and live weather layers that extend into neighboring regions such as China.',
                },
              },
              {
                '@type': 'Question',
                name: 'Where can I check live weather for India or China?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'The dashboard streams live weather India and live weather China layers from MOSDAC, letting you monitor storms, winds, and rainfall.',
                },
              },
            ],
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
