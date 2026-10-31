import assert from 'node:assert/strict'
import { test } from 'node:test'
import config from '../vercel.json' with { type: 'json' }
import middleware, { config as shareMiddleware } from '../middleware.js'

const SHARE_SHELL = `<!doctype html>
<html><head>
<!-- share-meta:start -->
<title>TCD Five-a-side</title>
<!-- share-meta:end -->
</head><body><div id="root"></div></body></html>`

// Vercel compiles rewrite sources with path-to-regexp@6.1.0 (strict, sensitive).
// Filesystem routes run before this rewrite, so a real file such as
// /favicon.ico is still served even though the pattern matches it.
const SPA_SOURCE = '/((?!api/|assets/).*)'
const SPA_PATH = /^(?:\/((?!api\/|assets\/).*))$/

test('client routes rewrite to the SPA shell', () => {
  assert.equal(config.routes, undefined)
  assert.deepEqual(config.rewrites, [
    { source: SPA_SOURCE, destination: '/index.html' },
  ])
  for (const path of [
    '/',
    '/teams',
    '/tables',
    '/tournament',
    '/results',
    '/week/5',
    '/teams/git-gud-division-7',
  ]) {
    assert.equal(SPA_PATH.test(path), true, path)
  }
})

test('api routes and built assets stay outside the spa rewrite', () => {
  for (const path of [
    '/api/fixtures',
    '/api/og',
    '/assets/index-1ltYV2Co.js',
    '/assets/index-0Hm7Wk2S.css',
  ]) {
    assert.equal(SPA_PATH.test(path), false, path)
  }
  assert.match(config.functions['api/og.js'].includeFiles, /seed-payload\.json/)
  assert.match(config.functions['middleware.js'].includeFiles, /seed-payload\.json/)
})

test('share preview middleware still matches team and week routes', () => {
  assert.deepEqual(shareMiddleware.matcher, [
    '/',
    '/week/:path*',
    '/tables',
    '/tournament',
    '/teams/:path*',
  ])
})

test('browsers fall through so the spa rewrite can serve the shell', async () => {
  const response = await middleware(
    new Request('https://fiveside.vercel.app/teams/git-gud-division-7', {
      headers: { 'user-agent': 'Mozilla/5.0' },
    }),
  )
  assert.equal(response.headers.get('x-middleware-next'), '1')
  assert.equal(response.headers.get('x-middleware-rewrite'), null)
})

test('preview bots still receive share html for team links', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async (url) => {
    const href = String(url)
    if (href.includes('/index.html')) {
      return new Response(SHARE_SHELL, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }
    throw new Error(`offline ${href}`)
  }
  try {
    const response = await middleware(
      new Request('https://fiveside.vercel.app/teams/git-gud-division-7', {
        headers: { 'user-agent': 'WhatsApp/2.23.20.0' },
      }),
    )
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /text\/html/)
    assert.match(response.headers.get('cache-control'), /s-maxage=120/)
    const html = await response.text()
    assert.match(html, /<div id="root">/)
    assert.match(html, /property="og:title"/)
    assert.match(html, /\/api\/og\?team=git-gud-division-7/)
  } finally {
    globalThis.fetch = original
  }
})
