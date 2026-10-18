import type { Chord, Note } from '../music/theory'
import { midiName, mod, noteAt } from '../music/theory'
import { CHORD_TYPES } from '../data/chords'
import styles from './Piano.module.css'
import type {KeyboardRange} from '../music/keyboard-range'
import type {MusicEvent} from '../music/patterns'
import {useLayoutEffect,useRef,type CSSProperties} from 'react'

type Props = { chord: Chord; right: Note[]; bass: Note; active: number[]; range:KeyboardRange; labels: 'notes' | 'degrees'; onNote: (midi: number) => void;events?:MusicEvent[];tick?:number;focusMidis?:number[] }
export function Piano({ chord, right, bass, active, range, labels, onNote,events,tick=0,focusMidis }: Props) {
  const {start,end}=range
  const keys = Array.from({ length:end-start+1 }, (_, i) => start + i)
  const black = (midi: number) => [1, 3, 6, 8, 10].includes(mod(midi))
  const white = keys.filter(k => !black(k))
  const spec = CHORD_TYPES.find(c => c.id === chord.type)!
  const scrollRef=useRef<HTMLDivElement>(null)
  useLayoutEffect(()=>{
    const element=scrollRef.current
    if(!element)return
    const center=()=>{
      if(!focusMidis){element.scrollLeft=0;return}
      const bounds=element.getBoundingClientRect()
      const positions=[...new Set(focusMidis)].flatMap(midi=>{
        const key=element.querySelector<HTMLButtonElement>(`[data-midi="${midi}"]`)
        if(!key)return []
        const rect=key.getBoundingClientRect()
        return [{left:rect.left-bounds.left+element.scrollLeft,right:rect.right-bounds.left+element.scrollLeft}]
      })
      if(!positions.length)return
      const middle=(Math.min(...positions.map(p=>p.left))+Math.max(...positions.map(p=>p.right)))/2
      element.scrollLeft=Math.max(0,Math.min(element.scrollWidth-element.clientWidth,middle-element.clientWidth/2))
    }
    center()
    const observer=new ResizeObserver(center);observer.observe(element)
    return ()=>observer.disconnect()
  },[focusMidis,start,end])
  return <div ref={scrollRef} className={styles.scroll} data-testid="piano" data-range-start={start} data-range-end={end} aria-label="交互钢琴，琴键可用 Tab 与回车弹奏">
    <div className={styles.piano} style={{'--white-key-count':white.length} as CSSProperties}>
      <div className={styles.rail}><span>和序</span><span>{midiName(start)} — {midiName(end)} · C4 = 中央 C</span></div>
      <div className={styles.keys}>
        {keys.map(midi => {
          const isBlack = black(midi)
          const whiteIndex = isBlack ? keys.slice(0, midi - start).filter(k => !black(k)).length - 0.32 : white.indexOf(midi)
          const match = chord.notes.findIndex(n => n.pc === mod(midi))
          const candidates=events?.filter(e=>e.notes.some(n=>n.midi===midi))??[]
          const event=candidates.find(e=>e.tick<=tick&&e.tick+e.duration>tick)??candidates[0]
          const actual = right.find(n => n.midi === midi) ?? (bass.midi === midi ? bass : undefined)??event?.notes.find(n=>n.midi===midi)
          const isLeft=event?event.hand==='L':bass.midi===midi
          const isFill=event?.kind==='fill'
          const isRoot = actual && mod(midi) === chord.root.pc
          const sounding = active.includes(midi)
          const label = actual?.label ?? (match >= 0 ? noteAt(chord.notes[match],midi).label : midiName(midi))
          return <button key={midi} type="button" aria-label={`弹奏 ${label}`} data-midi={midi}
            className={[styles.key, isBlack ? styles.black : styles.white, actual ? styles.member : '', isRoot ? styles.root : '', isLeft ? styles.left : '',isFill?styles.fill:'', sounding ? styles.sounding : ''].join(' ')}
            style={{ left: `${whiteIndex / white.length * 100}%`, width: `${(isBlack ? 0.64 : 1) / white.length * 100}%` }}
            onClick={() => onNote(midi)}>
            {sounding && <span className={styles.sound}>●<small>响</small></span>}
            {actual && <span className={styles.marker}>{isFill?(isLeft?'左花':'右花'):isLeft ? '左' : isRoot ? '根' : '右'}</span>}
            <span className={styles.note}>{labels === 'degrees' && match >= 0 ? spec.degrees[match] : label}</span>
            {midi === 60 && <span className={styles.middle}>中央 C</span>}
          </button>
        })}
      </div>
    </div>
  </div>
}
