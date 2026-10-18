import {expect,it} from 'vitest'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {PIANO_SAMPLES,nearestSample} from './samples'

it('完整88键仅需30个锚点采样，最多移动一个半音',()=>{
  expect(PIANO_SAMPLES).toHaveLength(30)
  for(let midi=21;midi<=108;midi++) {
    const sample=nearestSample(midi)
    expect(Math.abs(sample.midi-midi)).toBeLessThanOrEqual(1)
    expect(sample.midi+12*Math.log2(sample.rate)).toBeCloseTo(midi)
  }
})
it('随站点分发的采样与来源校验清单一致',()=>{
  const manifest=JSON.parse(readFileSync('public/audio/salamander/manifest.json','utf8')) as {samples:{midi:number;file:string;sha256:string}[]}
  expect(manifest.samples.map(s=>s.midi)).toEqual(PIANO_SAMPLES.map(s=>s.midi))
  for(const sample of manifest.samples) {
    const bytes=readFileSync('public/audio/salamander/'+sample.file)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(sample.sha256)
  }
})
