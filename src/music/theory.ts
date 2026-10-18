import { CHORD_TYPES, type ChordType } from '../data/chords'

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const NATURAL = [0, 2, 4, 5, 7, 9, 11]
export type Pitch = { name: string; pc: number; letter: number; accidental: number }
export type Note = Pitch & { midi: number; octave: number; label: string }
export type Chord = { root: Pitch; type: ChordType; symbol: string; notes: Pitch[]; bass?: Pitch }
export const mod = (n: number, d = 12) => ((n % d) + d) % d
const accidentalText = (n: number) => n >= 0 ? '#'.repeat(n) : 'b'.repeat(-n)

export function pitch(input: string): Pitch {
  const normalized = input.replaceAll('♯', '#').replaceAll('♭', 'b').replaceAll('𝄫', 'bb').replaceAll('𝄪', '##')
  const match = /^([A-Ga-g])([#b]{0,2})$/.exec(normalized)
  if (!match || (match[2].includes('#') && match[2].includes('b'))) throw new Error('音名应为 C、F#、Bb 等字母与升降记号。')
  const letter = LETTERS.indexOf(match[1].toUpperCase())
  const accidental = [...match[2]].reduce((n, c) => n + (c === '#' ? 1 : -1), 0)
  return { name: LETTERS[letter] + accidentalText(accidental), pc: mod(NATURAL[letter] + accidental), letter, accidental }
}

export function interval(root: Pitch, degree: number, semitones: number): Pitch {
  const absoluteLetter = root.letter + degree - 1
  const letter = mod(absoluteLetter, 7)
  const naturalDistance = NATURAL[letter] + Math.floor(absoluteLetter / 7) * 12 - NATURAL[root.letter]
  const accidental = root.accidental + semitones - naturalDistance
  if (Math.abs(accidental) > 3) throw new Error('该拼写需要过多变化记号，请选择等音主音。')
  return { name: LETTERS[letter] + accidentalText(accidental), pc: mod(root.pc + semitones), letter, accidental }
}

const aliases: Record<string, ChordType> = {
  '': 'major', maj: 'major', M: 'major', m: 'minor', min: 'minor', '-': 'minor',
  dim: 'dim', '°': 'dim', aug: 'aug', '+': 'aug', sus2: 'sus2', sus4: 'sus4',
  '6': 'six', m6: 'minorSix', '7': 'seven', maj7: 'majorSeven', M7: 'majorSeven', 'Δ7': 'majorSeven',
  m7: 'minorSeven', min7: 'minorSeven', m7b5: 'halfDim', 'ø7': 'halfDim', 'ø': 'halfDim', dim7: 'dimSeven', '°7': 'dimSeven', add9: 'addNine',
}
export function chord(rootName: string, type: ChordType, bassName?: string): Chord {
  const root = pitch(rootName)
  const spec = CHORD_TYPES.find(c => c.id === type)
  if (!spec) throw new Error('暂不支持这个和弦类型。')
  const notes = spec.degrees.map((d, i) => interval(root, Number(d.replaceAll('b', '').replaceAll('#', '')), spec.semitones[i]))
  let bass: Pitch | undefined
  if (bassName) {
    const requested = pitch(bassName)
    bass = notes.find(n => n.pc === requested.pc)
    if (!bass) throw new Error('暂不支持非和弦内音的斜杠低音，请选择构成音。')
  }
  return { root, type, symbol: root.name + spec.suffix + (bass ? '/' + bass.name : ''), notes, bass }
}
export function parseChord(input: string): Chord {
  const normalized = input.trim().replaceAll('♯', '#').replaceAll('♭', 'b')
  const match = /^([A-Ga-g][#b]{0,2})([^/]*)(?:\/([A-Ga-g][#b]{0,2}))?$/.exec(normalized)
  if (!match || normalized.length > 32) throw new Error('请输入支持的和弦，例如 C、Am、CM7、Cø7 或 C/E。')
  const type = aliases[match[2]]
  if (!type) throw new Error('未识别这个类型。支持三和弦、六和弦、七和弦、sus2/4 和 add9。')
  return chord(match[1], type, match[3])
}
export function noteAt(p: Pitch, midi: number): Note {
  if (mod(midi) !== p.pc) throw new Error('音名与 MIDI 不一致。')
  const octave = (midi - NATURAL[p.letter] - p.accidental) / 12 - 1
  return { ...p, midi, octave, label: p.name + octave }
}
export function atOrAbove(p: Pitch, floor: number): Note {
  return noteAt(p, floor + mod(p.pc - floor))
}
export function voicing(c: Chord, inversion = 0, floor = 60): Note[] {
  const offset = mod(inversion, c.notes.length)
  const ordered = [...c.notes.slice(offset), ...c.notes.slice(0, offset)]
  let next = floor
  return ordered.map(p => {
    const n = atOrAbove(p, next)
    next = n.midi + 1
    return n
  })
}
export function leftBass(c: Chord, floor = 43): Note {
  return atOrAbove(c.bass ?? c.root, floor)
}
export function midiName(midi: number): string {
  return ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][mod(midi)] + (Math.floor(midi / 12) - 1)
}
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12)
export function inversionName(inversion: number) {
  return ['原位', '第一转位', '第二转位', '第三转位'][inversion] ?? '原位'
}
