import { describe, expect, it } from 'vitest'
import { progressionChords, progressionTimeline, progressionVoicings, movement } from './progressions'
import { validateTimeline } from './patterns'

describe('调内移调与配置连接', () => {
  it('默认四组进行', () => {
    expect(progressionChords('pop','C').map(c => c.symbol)).toEqual(['C','G','Am','F'])
    expect(progressionChords('classic','C').map(c => c.symbol)).toEqual(['C','Am','F','G'])
    expect(progressionChords('jazz','C').map(c => c.symbol)).toEqual(['Dm7','G7','Cmaj7'])
    expect(progressionChords('minor','A').map(c => c.symbol)).toEqual(['Am','F','C','G'])
  })
  it('移调保留调式及合理拼写，实际音高跟随变化', () => {
    expect(progressionChords('pop','Db').map(c => c.symbol)).toEqual(['Db','Ab','Bbm','Gb'])
    expect(progressionChords('minor','B').map(c => c.symbol)).toEqual(['Bm','G','D','A'])
    expect(progressionChords('jazz','F#').map(c => c.symbol)).toEqual(['G#m7','C#7','F#maj7'])
    const old = progressionTimeline(progressionChords('pop','C'),'arp','root')
    const next = progressionTimeline(progressionChords('pop','D'),'arp','root')
    expect(next.events[0].notes[0].pc).toBe((old.events[0].notes[0].pc+2)%12)
    expect(next.events[1].notes[0].label).toBe('D4')
  })
  it('平稳连接保留完整构成并减少本例移动', () => {
    const chords = progressionChords('pop','C')
    const root = progressionVoicings(chords,'root')
    const smooth = progressionVoicings(chords,'smooth')
    const distance = (v: typeof root) => v.slice(1).reduce((sum,notes,i) => sum+movement(v[i],notes),0)
    expect(distance(smooth)).toBeLessThan(distance(root))
    smooth.forEach((v,i) => expect(v.map(n => n.pc).sort()).toEqual(chords[i].notes.map(n => n.pc).sort()))
  })
  it('持续小节与四音兼容', () => {
    const timeline = progressionTimeline(progressionChords('jazz','C'),'block','smooth',0,2)
    expect(timeline.bars).toBe(6)
    expect(validateTimeline(timeline)).toBe(true)
    expect(timeline.events.every(e => e.hand === 'L' || e.notes.length === 4)).toBe(true)
    expect(() => progressionTimeline(progressionChords('jazz','C'),'alberti','root')).toThrow('四音')
  })
})
