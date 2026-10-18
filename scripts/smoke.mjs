import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'

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
const fontsResponse=await request('/fonts/manifest.json')
assert.equal(fontsResponse.status,200,'local font manifest')
assert.match(fontsResponse.headers.get('content-type') || '',/application\/json/)
const fontAssets=await fontsResponse.json()
assert.equal(fontAssets.length,3,'two local fonts and outlined wordmark')
for(const asset of fontAssets) {
  const response=await request(`/fonts/${asset.file}`)
  assert.equal(response.status,200,asset.file)
  assert.match(response.headers.get('content-type') || '',asset.file.endsWith('.woff2')?/font\/woff2/:/image\/svg\+xml/)
  const sha256=createHash('sha256').update(new Uint8Array(await response.arrayBuffer())).digest('hex')
  assert.equal(sha256,asset.sha256,`font/wordmark hash ${asset.file}`)
}
for(const path of ['/brand-mark.svg','/favicon.svg']) {
  const response=await request(path)
  assert.equal(response.status,200,path)
  assert.match(response.headers.get('content-type') || '',/image\/svg\+xml/)
}
for(const name of ['geist','noto-sans-sc','smiley-sans']) {
  const response=await request(`/fonts/${name}-OFL.txt`)
  assert.equal(response.status,200,`${name} attribution`)
  assert.match(await response.text(),/SIL OPEN FONT LICENSE/i)
}
const manifestResponse=await request('/audio/salamander/manifest.json')
assert.equal(manifestResponse.status,200,'local piano manifest')
const manifest=await manifestResponse.json()
assert.equal(manifest.samples.length,30,'piano sample count')
for(let i=0;i<manifest.samples.length;i+=5)await Promise.all(manifest.samples.slice(i,i+5).map(async sample=>{
  assert.match(sample.file,/^(?:A|C|Ds|Fs)[0-8]\.mp3$/)
  const response=await request(`/audio/salamander/${sample.file}`)
  assert.equal(response.status,200,sample.file)
  assert.match(response.headers.get('content-type') || '',/audio\/(?:mpeg|mp3)/)
  const sha256=createHash('sha256').update(new Uint8Array(await response.arrayBuffer())).digest('hex')
  assert.equal(sha256,sample.sha256,`sample hash ${sample.file}`)
}))
const license=await request('/audio/salamander/LICENSE.txt')
assert.equal(license.status,200,'sample attribution')
assert.match(await license.text(),/Alexander Holm/)
if(production) {
  assert.match(home.headers.get('cache-control') || '',/no-cache/)
  assert.equal(home.headers.get('x-content-type-options'),'nosniff')
  assert.match(home.headers.get('content-security-policy') || '',/default-src 'self'/)
  assert.equal((await request('/healthz')).status,200,'health check')
  assert.equal((await request('/assets/missing.js')).status,404,'missing JS must not receive HTML')
  assert.equal((await request('/audio/missing.wav')).status,404,'missing sample must not receive HTML')
  assert.equal((await request('/fonts/missing.woff2')).status,404,'missing font must not receive HTML')
}
process.stdout.write(`HTTP smoke passed: ${origin}, ${assets.length} built assets, local fonts and wordmark (MIME + SHA-256), brand icons, 30 local MP3 samples (MIME + SHA-256), attribution, SPA fallback${production?', production headers and health check':''}\n`)
