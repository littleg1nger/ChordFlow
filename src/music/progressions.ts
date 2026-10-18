import { PROGRESSIONS, type ProgressionId } from '../data/progressions'
import type { PatternId } from '../data/patterns'
import { chord, interval, pitch, voicing, type Chord, type Note } from './theory'
import { compatible, patternTimeline, PPQ, type MusicEvent, type Timeline } from './patterns'

export function progressionChords(id: ProgressionId, tonic: string): Chord[] {
  const spec = PROGRESSIONS.find(p => p.id === id)
  if (!spec) throw new Error('未知的和弦进行。')
  const root = pitch(tonic)
  const scale = spec.mode === 'major' ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10]
  return spec.degrees.map((degree,i) => chord(interval(root,degree,scale[degree-1]).name,spec.types[i]))
}
export function movement(a: Note[], b: Note[]) {
  if (a.length === b.length) return a.reduce((sum,n,i) => sum+Math.abs(n.midi-b[i].midi),0)
  return a.reduce((sum,n) => sum+Math.min(...b.map(v => Math.abs(n.midi-v.midi))),0) + b.reduce((sum,n) => sum+Math.min(...a.map(v => Math.abs(n.midi-v.midi))),0)
}
export function progressionVoicings(chords: Chord[], style: 'root' | 'smooth', register = 0): Note[][] {
  const shift = register * 12
  const result: Note[][] = []
  chords.forEach(c => {
    const root = voicing(c,0,55+shift)
    if (style === 'root' || !result.length) { result.push(root); return }
    const previous = result[result.length-1]
    const candidates: Note[][] = []
    for (let inversion = 0; inversion < c.notes.length; inversion++) for (let floor = 48+shift; floor <= 68+shift; floor++) {
      const next = voicing(c,inversion,floor)
      if (next[0].midi >= 52+shift && next.at(-1)!.midi <= 84+shift && next.at(-1)!.midi-next[0].midi <= 19) candidates.push(next)
    }
    candidates.sort((a,b) => (movement(previous,a) + Math.abs(a[0].midi-(60+shift))*.03) - (movement(previous,b)+Math.abs(b[0].midi-(60+shift))*.03))
    result.push(candidates[0] ?? root)
  })
  return result
}
export function progressionTimeline(chords: Chord[], pattern: PatternId, style: 'root' | 'smooth', register = 0, barsPerChord = 1): Timeline {
  if (!chords.every(c => compatible(pattern,c))) throw new Error('该进行含四音和弦，此音型只支持三音配置。')
  const voices = progressionVoicings(chords,style,register)
  const events: MusicEvent[] = []
  let beats = 4
  chords.forEach((c,index) => {
    const part = patternTimeline(c,pattern,voices[index],register)
    beats = part.beats
    for (let bar = 0; bar < barsPerChord; bar++) {
      const absoluteBar = index * barsPerChord + bar
      part.events.forEach(e => events.push({...e,tick:e.tick+absoluteBar*part.ticks,bar:absoluteBar,chordIndex:index}))
    }
  })
  return { events, beats, bars: chords.length*barsPerChord, ticks: chords.length*barsPerChord*beats*PPQ, chords }
}
