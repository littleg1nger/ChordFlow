import { PROGRESSIONS, type ProgressionId } from '../data/progressions'
import type { PatternId } from '../data/patterns'
import { chord, voicing, type Chord, type Note } from './theory'
import { compatible, patternTimeline, PPQ, type MusicEvent, type Timeline } from './patterns'
import {scalePitches,type KeyContext} from './scale'
import {fillTimeline} from './fills'
import type {FillId} from '../data/fills'

export function progressionChords(id: ProgressionId, tonic: string): Chord[] {
  const spec = PROGRESSIONS.find(p => p.id === id)
  if (!spec) throw new Error('未知的和弦进行。')
  const scale=scalePitches({tonic,mode:spec.mode})
  return spec.degrees.map((degree,i) => chord(scale[degree-1].name,spec.types[i]))
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
export function progressionTimeline(chords: Chord[], pattern: PatternId, style: 'root' | 'smooth', register = 0, barsPerChord = 1,decoration?:KeyContext&{fill:FillId}): Timeline {
  if (!chords.every(c => compatible(pattern,c))) throw new Error('该进行的三音 / 四音配置与此音型不兼容。')
  const voices = progressionVoicings(chords,style,register)
  const parts=chords.map((c,index)=>patternTimeline(c,pattern,voices[index],register))
  const events: MusicEvent[] = []
  let beats = 4
  chords.forEach((_,index) => {
    const part = parts[index]
    beats = part.beats
    for (let bar = 0; bar < barsPerChord; bar++) {
      const absoluteBar = index * barsPerChord + bar
      const next=(index+1)%chords.length
      const decorated=decoration&&bar===barsPerChord-1?fillTimeline(part,{...decoration,id:decoration.fill,right:voices[index],nextRight:voices[next],nextBass:parts[next].events.find(e=>e.hand==='L')!.notes[0]}):part
      decorated.events.forEach(e => events.push({...e,tick:e.tick+absoluteBar*part.ticks,bar:absoluteBar,chordIndex:index}))
    }
  })
  return { events, beats, bars: chords.length*barsPerChord, ticks: chords.length*barsPerChord*beats*PPQ, chords }
}
