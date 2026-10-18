import {expect,it} from 'vitest'
import {PATTERNS} from '../data/patterns'
import {LESSONS} from '../data/lessons'
import {PROGRESSIONS} from '../data/progressions'
import {FILLS} from '../data/fills'
import {compatible,patternTimeline,validateTimeline,beatLabel} from './patterns'
import {parseChord,voicing} from './theory'
import {progressionChords,progressionTimeline} from './progressions'
import {scalePitches} from './scale'

it('卡农与4536251保留指定级数和真实移调',()=>{
  expect(progressionChords('canon','D').map(c=>c.symbol)).toEqual(['D','A','Bm','F#m','G','D','G','A'])
  expect(progressionChords('canon','C').map(c=>c.symbol)).toEqual(['C','G','Am','Em','F','C','F','G'])
  expect(progressionChords('4536251','C').map(c=>c.symbol)).toEqual(['F','G','Em','Am','Dm','G','C'])
  expect(progressionChords('4536251','D').map(c=>c.symbol)).toEqual(['G','A','F#m','Bm','Em','A','D'])
  expect(progressionChords('turnaround','C').map(c=>c.symbol)).toEqual(['Cmaj7','Am7','Dm7','G7'])
})
it('上/下行、完整四音与十六分的顺序和边界',()=>{
  const c=parseChord('C'),right=voicing(c,0,60)
  const rhs=(id:typeof PATTERNS[number]['id'])=>patternTimeline(c,id,right).events.filter(e=>e.hand==='R')
  expect(rhs('ascending').slice(0,4).map(e=>e.notes[0].label)).toEqual(['C4','E4','G4','C5'])
  expect(rhs('descending').slice(0,4).map(e=>e.notes[0].label)).toEqual(['C5','G4','E4','C4'])
  expect(rhs('sixteenth')).toHaveLength(16)
  expect(rhs('sixteenth').every(e=>e.duration===120)).toBe(true)
  expect(rhs('sixteenth').at(-1)!.tick).toBe(1800)
  expect([120,240,360].map(beatLabel)).toEqual(['1 e','1 &','1 a'])
  expect(compatible('seventhArp',c)).toBe(false)
  const g7=patternTimeline(parseChord('G7'),'seventhArp').events.filter(e=>e.hand==='R')
  expect(g7.map(e=>e.notes[0].label)).toEqual(['G3','B3','D4','F4','D4','B3','G3','B3'])
})
it('交替与切分在正确拍位，四音配置不会漏掉七音',()=>{
  const c=parseChord('Cmaj7')
  const alternating=patternTimeline(c,'alternating')
  expect(alternating.events.map(e=>[e.tick,e.hand])).toEqual([[0,'L'],[480,'R'],[960,'L'],[1440,'R']])
  const sync=patternTimeline(c,'syncopated')
  expect(sync.events.filter(e=>e.hand==='R').map(e=>e.tick)).toEqual([240,720,1200,1680])
  expect(sync.events.filter(e=>e.hand==='R').every(e=>e.notes.length===4&&e.notes.some(n=>n.name==='B'))).toBe(true)
})
it('加花仅替换每个和弦最后小节，不拉长总时间或重叠旧右手事件',()=>{
  const chords=progressionChords('pop','C')
  const t=progressionTimeline(chords,'block','root',0,2,{fill:'chord-turn',tonic:'C',mode:'major'})
  expect(validateTimeline(t)).toBe(true)
  expect(t.ticks).toBe(8*1920)
  const fills=t.events.filter(e=>e.kind==='fill')
  expect(fills).toHaveLength(16)
  expect(fills.every(e=>e.bar%2===1&&e.duration===120&&e.tick%1920>=1440)).toBe(true)
  expect(fills.every(e=>chords[e.chordIndex].notes.some(p=>p.pc===e.notes[0].pc))).toBe(true)
  for(const fill of fills)expect(t.events.filter(e=>e!==fill&&e.hand==='R'&&e.chordIndex===fill.chordIndex&&e.tick<fill.tick+fill.duration&&e.tick+e.duration>fill.tick)).toHaveLength(0)
})
it('调内经过音有正确拼写，不混入和弦构成，支持小调与升降调',()=>{
  for(const [id,tonic] of [['4536251','C'],['jazz','F#'],['minor','Bb']] as const) {
    const mode=PROGRESSIONS.find(p=>p.id===id)!.mode
    const scale=scalePitches({tonic,mode})
    const t=progressionTimeline(progressionChords(id,tonic),'block','smooth',0,1,{fill:'scale-approach',tonic,mode})
    expect(validateTimeline(t)).toBe(true)
    expect(t.events.filter(e=>e.kind==='fill').every(e=>scale.some(p=>p.name===e.notes[0].name))).toBe(true)
    expect(t.events.some(e=>e.annotation==='加花 · 经过音')).toBe(true)
  }
})
it('全部跟练样例跨三个音区仍有效，所有音型与加花严格留在小节内',()=>{
  for(const lesson of LESSONS)for(const register of [-1,0,1]) {
    const c=lesson.config
    const mode=PROGRESSIONS.find(p=>p.id===c.progression)!.mode
    for(const fill of FILLS) {
      const t=progressionTimeline(progressionChords(c.progression,c.tonic),c.pattern,c.voicing,register,1,{fill:fill.id,tonic:c.tonic,mode})
      expect(validateTimeline(t)).toBe(true)
      for(const event of t.events.filter(e=>e.kind==='fill')) {
        const overlap=t.events.filter(other=>other.hand!==event.hand&&other.tick<event.tick+event.duration&&other.tick+other.duration>event.tick)
        expect(overlap.some(other=>other.notes.some(n=>event.notes.some(f=>f.midi===n.midi)))).toBe(false)
      }
    }
  }
  expect(()=>progressionTimeline(progressionChords('pop','C'),'waltz','root',0,1,{fill:'chord-turn',tonic:'C',mode:'major'})).toThrow('4/4')
})
