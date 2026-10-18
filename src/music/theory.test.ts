import { describe, expect, it } from 'vitest'
import { CHORD_TYPES, ROOTS } from '../data/chords'
import { atOrAbove, chord, frequency, noteAt, parseChord, pitch, voicing } from './theory'

describe('确定性和弦与理论拼写', () => {
  const cases = [
    ['C', 'C E G'], ['Cm', 'C Eb G'], ['C7', 'C E G Bb'], ['Cmaj7', 'C E G B'],
    ['Dm7', 'D F A C'], ['F#7', 'F# A# C# E'], ['Cm7b5', 'C Eb Gb Bb'],
    ['Cdim7', 'C Eb Gb Bbb'], ['Csus2', 'C D G'], ['Csus4', 'C F G'],
    ['Cadd9', 'C E G D'], ['C#', 'C# E# G#'],
  ]
  it.each(cases)('%s 拼写为 %s', (symbol, names) => {
    expect(parseChord(symbol).notes.map(n => n.name).join(' ')).toBe(names)
  })
  it('区分 CM7 与 Cm7 并支持别名', () => {
    expect(parseChord('CM7').type).toBe('majorSeven')
    expect(parseChord('Cm7').type).toBe('minorSeven')
    expect(parseChord('Cmin').symbol).toBe('Cm')
    expect(parseChord('Cø7').symbol).toBe('Cm7b5')
  })
  it('转位不改变根音与构成集合，斜杠只能用和弦内音', () => {
    const c = parseChord('C/E')
    expect(c.root.name).toBe('C')
    expect(c.bass?.name).toBe('E')
    expect(voicing(c, 1).map(n => n.label)).toEqual(['E4', 'G4', 'C5'])
    for (let i = 0; i < 3; i++) expect(voicing(c, i).map(n => n.pc).sort()).toEqual([0, 4, 7])
    expect(() => parseChord('C/F#')).toThrow('非和弦内音')
  })
  it('带变化音的八度不误用 MIDI 八度', () => {
    expect(noteAt(pitch('B#'), 60).label).toBe('B#3')
    expect(noteAt(pitch('Cb'), 59).label).toBe('Cb4')
    expect(atOrAbove(pitch('C'), 60).label).toBe('C4')
    expect(frequency(69)).toBe(440)
    expect(() => noteAt(pitch('E'), 60)).toThrow()
  })
  it('每个音根与类型的半音构成都符合公式', () => {
    for (const root of ROOTS) for (const spec of CHORD_TYPES) {
      const c = chord(root, spec.id)
      expect(c.notes.map(n => ((n.pc - c.root.pc) % 12 + 12) % 12)).toEqual(spec.semitones.map(s => s % 12))
    }
  })
  it.each(['C9', 'Hi', '', '<script>', 'C##b', 'CM7/F#'])('拒绝不支持的输入 %s', input => expect(() => parseChord(input)).toThrow())
})
