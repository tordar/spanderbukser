import { makeRouteHandler } from '@keystatic/next/route-handler'
import config from '../../../../keystatic.config'

const handler = makeRouteHandler({ config })

export async function GET(request: Request, context: unknown) {
  console.log('[keystatic] GET', request.url)
  console.log('[keystatic] env check', {
    nodeEnv: process.env.NODE_ENV,
    hasClientId: !!process.env.KEYSTATIC_GITHUB_CLIENT_ID,
    clientIdPrefix: process.env.KEYSTATIC_GITHUB_CLIENT_ID?.slice(0, 4),
    hasClientSecret: !!process.env.KEYSTATIC_GITHUB_CLIENT_SECRET,
    clientSecretPrefix: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET?.slice(0, 4),
    hasSecret: !!process.env.KEYSTATIC_SECRET,
    secretPrefix: process.env.KEYSTATIC_SECRET?.slice(0, 4),
  })
  const res = await handler.GET(request, context as never)
  console.log('[keystatic] GET response status', res.status)
  return res
}

export async function POST(request: Request, context: unknown) {
  console.log('[keystatic] POST', request.url)
  const res = await handler.POST(request, context as never)
  console.log('[keystatic] POST response status', res.status)
  return res
}
