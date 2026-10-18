import assert from 'node:assert/strict'

const origin = process.argv[2] || 'http://127.0.0.1:4173'
const production = process.argv.includes('--production')
const request = (path) => fetch(new URL(path,origin), {signal:AbortSignal.timeout(8000)})
const home = await request('/')
assert.equal(home.status,200,'homepage')
assert.match(home.headers.get('content-type') || '',/text\/html/)
const html=await home.text()
assert.match(html,/<title>和序 · Chordflow<\/title>/)
const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1])
assert(assets.some(path => path.endsWith('.js')),'built JS is linked')
assert(assets.some(path => path.endsWith('.css')),'built CSS is linked')
for(const path of assets) {
  const response=await request(path)
  assert.equal(response.status,200,path)
  assert.match(response.headers.get('content-type') || '',path.endsWith('.js')?/javascript/:/text\/css/)
  if(production) assert.match(response.headers.get('cache-control') || '',/max-age=31536000.*immutable/)
}
const deep=await request('/practice/saved')
assert.equal(deep.status,200,'SPA fallback')
assert.match(await deep.text(),/<title>和序 · Chordflow<\/title>/)
if(production) {
  assert.match(home.headers.get('cache-control') || '',/no-cache/)
  assert.equal(home.headers.get('x-content-type-options'),'nosniff')
  assert.match(home.headers.get('content-security-policy') || '',/default-src 'self'/)
  assert.equal((await request('/healthz')).status,200,'health check')
  assert.equal((await request('/assets/missing.js')).status,404,'missing JS must not receive HTML')
  assert.equal((await request('/audio/missing.wav')).status,404,'missing sample must not receive HTML')
}
process.stdout.write(`HTTP smoke passed: ${origin}, ${assets.length} built assets, SPA fallback${production?', production headers and health check':''}\n`)
