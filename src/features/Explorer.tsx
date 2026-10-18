import { useState } from 'react'
import { CHORD_TYPES, FINGERINGS, ROOTS, CONTENT_SOURCE } from '../data/chords'
import { chord, inversionName, parseChord, type Chord, type Note } from '../music/theory'
import { Icon } from '../components/Icon'

export type AuditionMode = 'block' | 'up' | 'down'
type Props = { current: Chord; right: Note[]; bass: Note; inversion: number; onChoose: (c: Chord, inversion?: number) => void; onPreview: (mode: AuditionMode) => void; onStop: () => void; favorite: boolean; onFavorite: () => void }

export function Explorer({ current, right, bass, inversion, onChoose, onPreview, onStop, favorite, onFavorite }: Props) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const spec = CHORD_TYPES.find(c => c.id === current.type)!
  const fingers = FINGERINGS[current.root.name + spec.suffix]
  function search() {
    try {
      const next = parseChord(query)
      onChoose(next, next.bass ? next.notes.findIndex(n => n.pc === next.bass?.pc) : 0)
      setError('')
    } catch (e) { setError((e as Error).message) }
  }
  return <>
    <div className="explorer-tools">
      <div className="field root-field"><label htmlFor="root-note">根音</label><select id="root-note" value={current.root.name} onChange={e => onChoose(chord(e.target.value, current.type))}>{ROOTS.map(r => <option key={r}>{r}</option>)}</select></div>
      <div className="field quality-field"><label htmlFor="chord-type">和弦类型</label><select id="chord-type" value={current.type} onChange={e => onChoose(chord(current.root.name, e.target.value as Chord['type']))}>{CHORD_TYPES.map(s => <option value={s.id} key={s.id}>{s.name} {s.suffix || 'maj'}</option>)}</select></div>
      <form className="chord-search" onSubmit={e => { e.preventDefault(); search() }}><label className="sr-only" htmlFor="chord-search">搜索和弦</label><input id="chord-search" placeholder="试试 Am、G7、C/E" value={query} maxLength={32} onChange={e => setQuery(e.target.value)} /><button type="submit" aria-label="查找和弦"><Icon name="arrow" size={17} /></button></form>
    </div>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="chord-overview">
      <div className="chord-identity"><span className="eyebrow">当前和弦</span><div className="symbol-line"><h2 data-testid="chord-symbol">{current.symbol}</h2><button className={`icon-button ${favorite ? 'favorited' : ''}`} onClick={onFavorite} aria-label={favorite ? '取消收藏和弦' : '收藏和弦'} aria-pressed={favorite}><Icon name="star" size={19} /></button></div><p>{current.root.name} {spec.name}<span className="subtle"> · {inversionName(inversion)}</span></p></div>
      <div className="tone-formula"><span className="eyebrow">构成音 / 相对根音的度数</span><div className="tones">{current.notes.map((n, i) => <div className={i === 0 ? 'tone root-tone' : 'tone'} key={n.name}><strong>{n.name}</strong><span>{spec.degrees[i]}{i === 0 ? ' · 根音' : ''}</span></div>)}</div><p className="formula">半音公式 <span>{spec.semitones.join(' – ')}</span></p></div>
    </div>
    <div className="inversion-bar"><div className="segmented" aria-label="选择转位">{current.notes.map((_, i) => <button key={i} aria-pressed={inversion === i} onClick={() => onChoose(chord(current.root.name, current.type, i ? current.notes[i].name : undefined), i)}>{inversionName(i)}</button>)}</div><span className="bass-description">根音 {current.root.name} <span>／</span> 右手最低音 {right[0].name}</span></div>
    <div className="hand-voicing"><div><span className="hand-label left-hand">左手 · 低音</span><strong>{bass.label}</strong><small>独立低音</small></div><div><span className="hand-label right-hand">右手 · 完整和弦</span><strong>{right.map(n => n.label).join(' · ')}</strong><small>{inversion === 0 && fingers ? `指法建议 ${fingers.right.join('–')}` : '按当前配置舒适落指'}</small></div></div>
    <div className="audition-actions"><button className="primary" onClick={() => onPreview('block')}><Icon name="play" size={15} />同时弹</button><button onClick={() => onPreview('up')}>逐音上行 ↗</button><button onClick={() => onPreview('down')}>逐音下行 ↘</button><button className="quiet" onClick={onStop}>停止试听</button></div>
    <div className="learning-note"><span className="note-index">听一听</span><p>{spec.feeling} {spec.use}</p></div>
    <details className="teaching-details"><summary>根音、转位与指法怎么理解？</summary><p>根音决定和弦身份；转位只改变排列。{current.symbol.includes('/') ? `${current.symbol} 的根音仍是 ${current.root.name}，斜杠后是最低音 ${current.bass?.name}。` : '例如 C/E 的根音仍是 C，最低音是 E。'} 完整构成与带八度的弹奏配置分别列出。</p><p>手指编号：1=拇指、2=食指、3=中指、4=无名指、5=小指。{fingers && inversion === 0 ? `此原位右手建议 ${fingers.right.join('–')}，左手低音可用 5 指。` : '当前配置没有预设指法，只提供音高配置建议。'} 指法随手型、音区和前后连接变化。来源：{CONTENT_SOURCE}。</p><p>这里的 1、b3、5 是相对根音的音程度数，不是简谱、调内级数或手指编号。小三度 b3 = 3 个半音。</p></details>
  </>
}
