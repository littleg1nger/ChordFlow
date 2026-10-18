import { CHORD_TYPES, ROOTS } from '../data/chords'
import { PATTERNS, type PatternId } from '../data/patterns'
import { chord, type Chord } from '../music/theory'
import { beatLabel, compatible, PPQ, type Timeline } from '../music/patterns'
import type { PlaybackSnapshot } from '../audio/transport'

type Props = { current: Chord; onChoose: (c: Chord) => void; pattern: PatternId; onPattern: (id: PatternId) => void; timeline?: Timeline; playback: PlaybackSnapshot; onStep: (tick: number) => void; register: number; onRegister: (n: number) => void; progression?: boolean; hands: 'both' | 'left' | 'right' }
export function Patterns({ current, onChoose, pattern, onPattern, timeline, playback, onStep, register, onRegister, progression,hands }: Props) {
  const spec = PATTERNS.find(p => p.id === pattern)!
  const barTicks = spec.beats * PPQ
  const relativeTick = Math.max(0, playback.tick) % barTicks
  const bar = Math.floor(Math.max(0, playback.tick) / barTicks)
  const offsets = [...new Set(timeline?.events.filter(e => e.bar === bar).map(e => e.tick) ?? [])]
  let activeIndex = offsets.reduce((last,t,i) => t <= Math.max(0,playback.tick) ? i : last,-1)
  if (activeIndex < 0) activeIndex = 0
  return <div className="patterns-view">
    {!progression && <div className="pattern-chord-controls"><label>根音<select aria-label="音型和弦根音" value={current.root.name} onChange={e => onChoose(chord(e.target.value,current.type))}>{ROOTS.map(r => <option key={r}>{r}</option>)}</select></label><label>和弦类型<select aria-label="音型和弦类型" value={current.type} onChange={e => onChoose(chord(current.root.name,e.target.value as Chord['type']))}>{CHORD_TYPES.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><span className="pattern-chord-symbol">{current.symbol}</span></div>}
    <div className="section-label"><h3>选择伴奏音型</h3><span>原创教学示例</span></div>
    <div className="pattern-options">{PATTERNS.map(p => {
      const allowed = !timeline ? compatible(p.id,current) : timeline.chords.every(c => compatible(p.id,c))
      return <button key={p.id} aria-pressed={pattern === p.id} disabled={!allowed} onClick={() => onPattern(p.id)} title={!allowed ? p.id==='root5' ? '需包含纯五度' : '此音型只适用三音和弦' : p.subtitle}><strong>{p.name}</strong><span>{p.beats}/4 · {p.subdivision === 2 ? '八分音符' : '四分音符'}</span>{!allowed && <small>{p.id==='root5'?'需包含纯五度':'仅限三音和弦'}</small>}</button>
    })}</div>
    <div className="pattern-instructions"><div><span className="meter">{spec.beats}<small>4</small></span><div><h3>{spec.name}</h3><p>{spec.subtitle} · 建议从 {spec.bpm} BPM 开始</p></div></div><label>演奏音区<select aria-label="演奏音区" value={register} onChange={e => onRegister(Number(e.target.value))}><option value={-1}>低八度</option><option value={0}>默认音区</option><option value={1}>高八度</option></select></label></div>
    <p className="pattern-tip">{spec.tip}</p>
    {!timeline ? <p className="error" role="alert">{pattern==='root5'?'当前和弦不适用根五八，需含纯五度。请选择柱式或三拍子。':'当前和弦不适用此三音音型，请选择柱式、根五八或三拍子。'}</p> : <>
      <div className="beat-heading"><h3>一小节，逐步弹</h3><span>{playback.tick < 0 ? '预备拍' : `第 ${bar + 1} 小节 · 第 ${Math.floor(relativeTick / PPQ) + 1} 拍`}</span></div>
      <div className="beat-track" aria-label="节拍播放头" data-tick={Math.round(playback.tick)} data-status={playback.status}><div className="beat-playhead" style={{ left: `${relativeTick / barTicks * 100}%` }} />{Array.from({ length: spec.beats },(_,i) => <span key={i} className={Math.floor(relativeTick/PPQ) === i ? 'current-beat' : ''}>{i+1}<small>拍</small></span>)}</div>
      <div className="event-steps">{offsets.map((tick,i) => <button key={tick} className={i === activeIndex ? 'event-step selected' : 'event-step'} aria-label={`查看第 ${i+1} 步`} aria-pressed={i === activeIndex} onClick={() => onStep(tick)}><span className="event-beat">{beatLabel(tick % barTicks)}<small>拍</small></span>{timeline.events.filter(e => e.tick === tick).map(e => {
        const muted=hands!=='both' && (hands==='left'?e.hand!=='L':e.hand!=='R')
        return <span key={e.hand} className={`${e.hand === 'L' ? 'left-hand' : 'right-hand'} ${muted?'muted-hand':''}`}><small>{e.hand === 'L' ? '左' : '右'}{muted?' · 未播放':''}</small>{e.notes.map(n => n.label).join(' · ')}<em>{e.duration / PPQ} 拍</em></span>
      })}</button>)}</div>
      <div className="step-controls"><button onClick={() => onStep(offsets[Math.max(0,activeIndex-1)])} disabled={activeIndex === 0}>← 上一步</button><span>第 {activeIndex+1} / {offsets.length} 步</span><button onClick={() => onStep(offsets[Math.min(offsets.length-1,activeIndex+1)])} disabled={activeIndex >= offsets.length-1}>下一步 →</button></div>
      <p className="small-print">每格表示一个起点；同格左右手同时落下。音名含八度，时值以拍标注。播放与显示共用这些事件。</p>
    </>}
  </div>
}
