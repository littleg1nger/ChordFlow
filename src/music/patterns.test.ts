import { describe, expect, it } from 'vitest'
import { PATTERNS } from '../data/patterns'
import { parseChord, voicing } from './theory'
import { compatible, patternTimeline, validateTimeline } from './patterns'

describe('可执行伴奏时间轴', () => {
  it('4/4 八个八分音符，音名与 MIDI 完全对应', () => {
    const t = patternTimeline(parseChord('C'), 'arp', voicing(parseChord('C'), 0, 60))
    const right = t.events.filter(e => e.hand === 'R')
    expect(right.map(e => e.notes[0].label)).toEqual(['C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4', 'E4'])
    expect(right.map(e => e.tick)).toEqual([0,240,480,720,960,1200,1440,1680])
    expect(right.reduce((n,e) => n+e.duration, 0)).toBe(1920)
    expect(validateTimeline(t)).toBe(true)
  })
  it('根五八的八度是根音 +12，不是第八个构成音', () => {
    const events = patternTimeline(parseChord('C7'), 'root5').events.filter(e => e.hand === 'L')
    expect(events.slice(0,4).map(e => e.notes[0].label)).toEqual(['C3','G3','C4','G3'])
  })
  it('Alberti 顺序与七和弦兼容规则', () => {
    expect(patternTimeline(parseChord('C'), 'alberti').events.filter(e => e.hand === 'L').slice(0,4).map(e => e.notes[0].label)).toEqual(['C3','G3','E3','G3'])
    for (const id of ['alberti','arp'] as const) {
      expect(compatible(id,parseChord('G7'))).toBe(false)
      expect(() => patternTimeline(parseChord('G7'), id)).toThrow('三音')
    }
  })
  it('三拍子的左/右手位置与时值', () => {
    const t = patternTimeline(parseChord('Am'), 'waltz')
    expect(t.ticks).toBe(1440)
    expect(t.events.map(e => [e.tick,e.duration,e.hand])).toEqual([[0,480,'L'],[480,480,'R'],[960,480,'R']])
  })
  it('所有适用模板在移调与改变音区后均保持边界', () => {
    for (const symbol of ['C','Am','F#','Bb','Dm7','Cadd9']) for (const p of PATTERNS) {
      const c = parseChord(symbol)
      if (!compatible(p.id,c)) continue
      const t = patternTimeline(c,p.id,voicing(c,0,67),1)
      expect(validateTimeline(t)).toBe(true)
      expect(t.events.some(e => e.notes.some(n => n.midi > 60))).toBe(true)
    }
  })
})
