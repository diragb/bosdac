// Packages:
import React, { useEffect, useState } from 'react'
import { DM_Serif_Display } from 'next/font/google'
import { cn } from '@/lib/utils'

// Assets:
import { ExternalLinkIcon } from 'lucide-react'

// Constants:
const DMSerifDisplay = DM_Serif_Display({
  weight: '400',
  style: 'italic',
  subsets: ['latin'],
})

// Components:
import Head from 'next/head'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// SEO:
const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const seoDescription = 'Experience MOSDAC\'s india live satellite stream, satellite view of India, and live weather for India and China in one modern interface.'
const seoKeywords = 'MOSDAC, india live satellite, satellite view of india, live weather india, live weather china, ISRO weather data'

// Functions:
const Landing = () => {
  // State:
  const [animateHeader, setAnimateHeader] = useState(false)

  // Effects:
  useEffect(() => {
    setAnimateHeader(true)  
  }, [])
  
  // Return:
  return (
    <>
      <Head>
        <title>BOSDAC - Better MOSDAC</title>
        <meta name='description' content={seoDescription} />
        <meta name='keywords' content={seoKeywords} />
        <link rel='canonical' href={siteURL} />
        <meta property='og:title' content='BOSDAC - Better MOSDAC' />
        <meta property='og:description' content={seoDescription} />
        <meta property='og:url' content={siteURL} />
      </Head>
      <ScrollArea className='w-screen h-screen'>
        <div className='relative flex justify-center items-center w-screen h-screen bg-black overflow-hidden'>
          <Image
            alt='Earth from Chandrayaan 1'
            src='/earth_chandrayaan-1.jpg'
            width={1706}
            height={981}
            className={cn(
              'absolute w-screen pointer-events-none scale-200 sm:scale-100 transition-all delay-100 duration-[2000ms]',
              animateHeader ? 'bottom-0 sm:-bottom-[50vh] blur-xs sm:blur-md' : 'bottom-[75px] sm:-bottom-[40vh] blur-none',
            )}
          />
          <div className='relative z-10 flex justify-center items-center flex-col gap-2 sm:gap-4'>
            <h1
              className={cn(
                `inline-block text-zinc-50 text-[88px] sm:text-[164px] leading-[72px] sm:leading-[120px] tracking-[-10px] sm:tracking-[-17px] italic ${DMSerifDisplay.className} font-sans scale-x-[1.2] -translate-x-3 transition-all delay-700 duration-1000`,
                animateHeader ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              BOSDAC
            </h1>
            <h2
              className={cn(
                'w-64 sm:w-96 text-xs sm:text-lg text-zinc-300 text-center text-wrap transition-all delay-[800ms] duration-[1100ms]',
                animateHeader ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              Modern, user-friendly interface for viewing live satellite imagery and meteorological data.
            </h2>
            <div
              className={cn(
                'flex justify-center items-center gap-0 sm:gap-2 -space-x-2.5 sm:space-x-0 sm:-mt-1 transition-all delay-[900ms] duration-[1300ms]',
                animateHeader ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <Link href='/app'>
                <Button
                  variant='secondary'
                  size='sm'
                  className='scale-85 sm:scale-100 cursor-pointer'
                >
                  Use The App
                </Button>
              </Link>
              <Link href='https://diragb.dev/blog/bosdac'>
                <Button
                  variant='default'
                  size='sm'
                  className='scale-85 sm:scale-100 cursor-pointer'
                >
                  Learn More
                  <ExternalLinkIcon />
                </Button>
              </Link>
            </div>
            <div
              className={cn(
                'flex justify-center items-center flex-col gap-2 sm:mt-2 transition-all delay-[1200ms] duration-[1400ms]',
                animateHeader ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <span className='text-xs sm:text-sm text-zinc-300'>Special Thanks</span>
              <a className='font-semibold hover:underline' href='https://www.isro.gov.in/' target='_blank'>
                <img
                  alt='ISRO'
                  src='https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Indian_Space_Research_Organisation_Logo.svg/794px-Indian_Space_Research_Organisation_Logo.svg.png'
                  width={42}
                  height={42}
                  className='scale-85 sm:scale-100'
                />
              </a>
            </div>
          </div>
        </div>
        <section className='sr-only'>
          <div className='max-w-4xl mx-auto space-y-6'>
            <h3 className='text-2xl sm:text-3xl font-semibold text-white'>
              MOSDAC data, optimized for india live satellite and live weather
            </h3>
            <p className='text-sm sm:text-base text-zinc-300 leading-relaxed'>
              BOSDAC keeps the spirit of MOSDAC alive with instant access to the india live satellite feed, a crisp satellite view of India, and neighboring overlays that include live weather India as well as live weather China. Every layer is curated for meteorologists, students, and aviation enthusiasts who want fast-loading imagery without sacrificing detail.
            </p>
            <div className='grid gap-4 sm:grid-cols-2'>
              <article className='rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4'>
                <h4 className='text-lg font-semibold text-white'>Satellite View of India</h4>
                <p className='mt-2 text-sm text-zinc-300'>
                  Navigate a high-resolution satellite view of India sourced from MOSDAC, updated frequently for lightning, storm, and cyclone tracking.
                </p>
              </article>
              <article className='rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4'>
                <h4 className='text-lg font-semibold text-white'>Live Weather India & China</h4>
                <p className='mt-2 text-sm text-zinc-300'>
                  Layer precipitation, wind, and temperature products to compare live weather India readings with adjacent live weather China insights.
                </p>
              </article>
              <article className='rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4'>
                <h4 className='text-lg font-semibold text-white'>MOSDAC Reliability</h4>
                <p className='mt-2 text-sm text-zinc-300'>
                  All imagery streams directly from MOSDAC, ensuring trustworthy india live satellite snapshots with ISRO provenance.
                </p>
              </article>
              <article className='rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4'>
                <h4 className='text-lg font-semibold text-white'>Instant Access Anywhere</h4>
                <p className='mt-2 text-sm text-zinc-300'>
                  Responsive controls, quick links, and offline-ready caching make it easy to keep BOSDAC open as your always-on MOSDAC companion.
                </p>
              </article>
            </div>
          </div>
        </section>
      </ScrollArea>
    </>
  )
}

// Exports:
export default Landing
