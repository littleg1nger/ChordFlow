import {expect,it} from 'vitest'
import {demoRange,manualRange} from './keyboard-range'
import {parseChord,leftBass,voicing} from './theory'
import {CHORD_TYPES,ROOTS} from '../data/chords'

it('按实际配置自动选择三八度，必要时扩大而不遗漏演示音',()=>{
  expect(demoRange([48,60,64,67])).toEqual({start:36,end:72})
  expect(demoRange([52,64,67,72])).toEqual({start:48,end:84})
  const wide=demoRange([36,79])
  expect(wide.start).toBeLessThanOrEqual(36)
  expect(wide.end).toBeGreaterThanOrEqual(79)
  expect(wide.end-wide.start).toBeGreaterThan(36)
  expect(demoRange([21,108])).toEqual({start:21,end:108})
  expect(manualRange(3)).toEqual({start:48,end:84})
})
it('常用根音、和弦、转位的配置都在自动范围内',()=>{
  for(const root of ROOTS)for(const type of CHORD_TYPES) {
    const c=parseChord(root+type.suffix)
    for(let inv=0;inv<c.notes.length;inv++) {
      const notes=[leftBass(c).midi,...voicing(c,inv,55).map(n=>n.midi)]
      const range=demoRange(notes)
      expect(notes.every(n=>n>=range.start&&n<=range.end)).toBe(true)
    }
  }
})
