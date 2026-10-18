import type { Chord, Note } from '../music/theory'
import { midiName, mod } from '../music/theory'
import { CHORD_TYPES } from '../data/chords'
import styles from './Piano.module.css'

type Props = { chord: Chord; right: Note[]; bass: Note; active: number[]; octave: number; labels: 'notes' | 'degrees'; onNote: (midi: number) => void }
export function Piano({ chord, right, bass, active, octave, labels, onNote }: Props) {
  const start = (octave + 1) * 12
  const keys = Array.from({ length: 37 }, (_, i) => start + i)
  const black = (midi: number) => [1, 3, 6, 8, 10].includes(mod(midi))
  const white = keys.filter(k => !black(k))
  const spec = CHORD_TYPES.find(c => c.id === chord.type)!
  return <div className={styles.scroll} aria-label="交互钢琴，琴键可用 Tab 与回车弹奏">
    <div className={styles.piano} style={{ minWidth: 704 }}>
      <div className={styles.rail}><span>和序</span><span>{midiName(start)} — {midiName(start + 36)} · C4 = 中央 C</span></div>
      <div className={styles.keys}>
        {keys.map(midi => {
          const isBlack = black(midi)
          const whiteIndex = isBlack ? keys.slice(0, midi - start).filter(k => !black(k)).length - 0.32 : white.indexOf(midi)
          const match = chord.notes.findIndex(n => n.pc === mod(midi))
          const actual = right.find(n => n.midi === midi) ?? (bass.midi === midi ? bass : undefined)
          const isRoot = actual && mod(midi) === chord.root.pc
          const sounding = active.includes(midi)
          const label = actual?.label ?? midiName(midi)
          return <button key={midi} type="button" aria-label={`弹奏 ${label}`} data-midi={midi}
            className={[styles.key, isBlack ? styles.black : styles.white, actual ? styles.member : '', isRoot ? styles.root : '', bass.midi === midi ? styles.left : '', sounding ? styles.sounding : ''].join(' ')}
            style={{ left: `${whiteIndex / white.length * 100}%`, width: `${(isBlack ? 0.64 : 1) / white.length * 100}%` }}
            onClick={() => onNote(midi)}>
            {sounding && <span className={styles.sound}>●<small>响</small></span>}
            {actual && <span className={styles.marker}>{bass.midi === midi ? '左' : isRoot ? '根' : '右'}</span>}
            <span className={styles.note}>{labels === 'degrees' && match >= 0 ? spec.degrees[match] : label}</span>
            {midi === 60 && <span className={styles.middle}>中央 C</span>}
          </button>
        })}
      </div>
    </div>
  </div>
}
