// Typescript:
import type { NextApiRequest, NextApiResponse } from 'next'

// Functions:
const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const content = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n')

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.status(200).send(content)
}

// Exports:
export default handler


