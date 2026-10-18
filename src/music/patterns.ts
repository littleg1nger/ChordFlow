import { PATTERNS, type PatternId } from '../data/patterns'
import { atOrAbove, interval, leftBass, noteAt, voicing, type Chord, type Note } from './theory'

export const PPQ = 480
export type Hand = 'L' | 'R'
export type MusicEvent = { tick: number; duration: number; notes: Note[]; hand: Hand; velocity: number; bar: number; chordIndex: number;annotation?:string;kind?:'fill' }
export type Timeline = { events: MusicEvent[]; ticks: number; beats: number; bars: number; chords: Chord[] }
export function compatible(id: PatternId, c: Chord) {
  if(id==='seventhArp')return c.notes.length===4
  if (id==='root5' && !c.notes.some(n => (n.pc-c.root.pc+12)%12===7)) return false
  return !PATTERNS.find(p => p.id === id)!.triadOnly || c.notes.length === 3
}

export function patternTimeline(c: Chord, id: PatternId, right = voicing(c, 0, 55), register = 0): Timeline {
  const spec = PATTERNS.find(p => p.id === id)!
  if (!compatible(id, c)) throw new Error(id==='seventhArp'?'四音和弦分解需要四个构成音。':id==='root5' ? '根五八仅支持含纯五度的和弦。' : `${spec.name}仅支持三音配置；请使用柱式、根五八或三拍子。`)
  const events: MusicEvent[] = []
  const bass = leftBass(c, 43 + register * 12)
  const add = (tick: number, duration: number, notes: Note[], hand: Hand) => events.push({ tick, duration, notes, hand, velocity: hand === 'L' ? 0.6 : 0.7, bar: 0, chordIndex: 0 })
  if (id === 'block') for (const t of [0, 960]) { add(t, 960, [bass], 'L'); add(t, 960, right, 'R') }
  if (id === 'arp') {
    add(0, 1920, [bass], 'L')
    for (let i = 0; i < 8; i++) add(i * 240, 240, [right[[0, 1, 2, 1][i % 4]]], 'R')
  }
  if (id === 'root5') {
    const root = atOrAbove(c.root, 43 + register * 12)
    const fifth = noteAt(interval(c.root, 5, 7), root.midi + 7)
    const eighth = noteAt(c.root, root.midi + 12)
    const notes = [root, fifth, eighth, fifth]
    for (let i = 0; i < 8; i++) add(i * 240, 240, [notes[i % 4]], 'L')
    add(0, 480, right, 'R')
  }
  if (id === 'alberti') {
    let floor=43+register*12
    let notes = voicing(c,0,floor)
    while(notes.at(-1)!.midi>=right[0].midi) {floor-=12;notes=voicing(c,0,floor)}
    for (let i = 0; i < 8; i++) add(i * 240, 240, [notes[[0, 2, 1, 2][i % 4]]], 'L')
    add(0, 1920, right, 'R')
  }
  if (id === 'waltz') { add(0, 480, [bass], 'L'); add(480, 480, right, 'R'); add(960, 480, right, 'R') }
  if(id==='ascending'||id==='descending') {
    const four=right.length===3?[...right,noteAt(right[0],right[0].midi+12)]:right
    const ordered=id==='descending'?[...four].reverse():four
    add(0,1920,[bass],'L')
    for(let i=0;i<8;i++)add(i*240,240,[ordered[i%4]],'R')
  }
  if(id==='seventhArp') {
    add(0,1920,[bass],'L')
    for(let i=0;i<8;i++)add(i*240,240,[right[[0,1,2,3,2,1,0,1][i]]],'R')
  }
  if(id==='alternating')for(let i=0;i<4;i++)add(i*480,480,i%2?right:[bass],i%2?'R':'L')
  if(id==='syncopated') {
    for(const tick of [0,960])add(tick,960,[bass],'L')
    for(const tick of [240,720,1200,1680])add(tick,240,right,'R')
  }
  if(id==='sixteenth') {
    add(0,1920,[bass],'L')
    const order=right.length===3?[0,1,2,1]:[0,1,2,3,2,1,0,1]
    for(let i=0;i<16;i++)add(i*120,120,[right[order[i%order.length]]],'R')
  }
  return { events: events.sort((a, b) => a.tick - b.tick || a.hand.localeCompare(b.hand)), ticks: spec.beats * PPQ, beats: spec.beats, bars: 1, chords: [c] }
}

export function validateTimeline(t: Timeline) {
  return t.ticks === t.bars * t.beats * PPQ && t.events.every(e => Number.isInteger(e.tick) && Number.isInteger(e.duration) && e.tick >= 0 && e.duration > 0 && e.tick + e.duration <= t.ticks && e.notes.length > 0 && e.notes.every(n => n.midi >= 21 && n.midi <= 108))
}
export function beatLabel(tick: number) {
  return `${Math.floor(tick / PPQ) + 1}${(['',' e',' &',' a'] as const)[Math.floor((tick%PPQ)/120)]}`
}
