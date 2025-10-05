// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

// Functions:
const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const pages = [
    '',
  ]

  const urls = pages
    .map(path => `${siteUrl}/${path}`.replace(/\/$\//, '/'))
    .map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.8</priority>\n  </url>`) // minimal set
    .join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.status(200).send(sitemap)
}

// Exports:
export default handler

