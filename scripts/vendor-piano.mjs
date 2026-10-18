import { mkdir,writeFile,readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const directory=fileURLToPath(new URL('../public/audio/salamander/',import.meta.url))
const notes=[{midi:21,file:'A0.mp3'}]
for(let octave=1;octave<=7;octave++)for(const [name,pc] of [['C',0],['Ds',3],['Fs',6],['A',9]])notes.push({midi:(octave+1)*12+pc,file:`${name}${octave}.mp3`})
notes.push({midi:108,file:'C8.mp3'})
await mkdir(directory,{recursive:true})
const entries=[]
async function download(sample) {
  const source=`https://tonejs.github.io/audio/salamander/${sample.file}`
  let bytes
  try {bytes=await readFile(new URL(`../public/audio/salamander/${sample.file}`,import.meta.url))}catch { /* Not vendored yet. */ }
  if(!bytes) {
    let error
    for(let attempt=0;attempt<3;attempt++)try {
      const response=await fetch(source,{signal:AbortSignal.timeout(25000)})
      if(!response.ok)throw new Error(`${source}: ${response.status}`)
      bytes=Buffer.from(await response.arrayBuffer())
      if(bytes.length<1000 || !((bytes[0]===73&&bytes[1]===68&&bytes[2]===51) || bytes[0]===255))throw new Error(`${source}: not MP3`)
      break
    }catch(e){error=e}
    if(!bytes)throw error
    await writeFile(new URL(`../public/audio/salamander/${sample.file}`,import.meta.url),bytes)
  }
  entries.push({...sample,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),source})
  process.stdout.write(`${sample.file} ${bytes.length} bytes\n`)
}
for(let i=0;i<notes.length;i+=4)await Promise.all(notes.slice(i,i+4).map(download))
entries.sort((a,b)=>a.midi-b.midi)
await writeFile(new URL('../public/audio/salamander/manifest.json',import.meta.url),JSON.stringify({instrument:'Salamander Grand Piano',author:'Alexander Holm',license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',source:'https://tonejs.github.io/audio/salamander/',samples:entries},null,2)+'\n')
process.stdout.write(`Vendored ${entries.length} samples, ${(entries.reduce((n,s)=>n+s.bytes,0)/1048576).toFixed(2)} MiB\n`)
