import { PATTERNS, type PatternId } from '../data/patterns'
import { atOrAbove, interval, leftBass, noteAt, voicing, type Chord, type Note } from './theory'

export const PPQ = 480
export type Hand = 'L' | 'R'
export type MusicEvent = { tick: number; duration: number; notes: Note[]; hand: Hand; velocity: number; bar: number; chordIndex: number }
export type Timeline = { events: MusicEvent[]; ticks: number; beats: number; bars: number; chords: Chord[] }
export function compatible(id: PatternId, c: Chord) {
  if (id==='root5' && !c.notes.some(n => (n.pc-c.root.pc+12)%12===7)) return false
  return !PATTERNS.find(p => p.id === id)!.triadOnly || c.notes.length === 3
}

export function patternTimeline(c: Chord, id: PatternId, right = voicing(c, 0, 55), register = 0): Timeline {
  const spec = PATTERNS.find(p => p.id === id)!
  if (!compatible(id, c)) throw new Error(id==='root5' ? '根五八仅支持含纯五度的和弦。' : `${spec.name}仅支持三音配置；请使用柱式、根五八或三拍子。`)
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
  return { events: events.sort((a, b) => a.tick - b.tick || a.hand.localeCompare(b.hand)), ticks: spec.beats * PPQ, beats: spec.beats, bars: 1, chords: [c] }
}

export function validateTimeline(t: Timeline) {
  return t.ticks === t.bars * t.beats * PPQ && t.events.every(e => Number.isInteger(e.tick) && Number.isInteger(e.duration) && e.tick >= 0 && e.duration > 0 && e.tick + e.duration <= t.ticks && e.notes.length > 0 && e.notes.every(n => n.midi >= 21 && n.midi <= 108))
}
export function beatLabel(tick: number) {
  return `${Math.floor(tick / PPQ) + 1}${tick % PPQ ? ' &' : ''}`
}
