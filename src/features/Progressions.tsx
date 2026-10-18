import { useState } from 'react'
import { PROGRESSIONS, type ProgressionId } from '../data/progressions'
import { ROOTS } from '../data/chords'
import { PATTERNS } from '../data/patterns'
import type { Chord, Note } from '../music/theory'
import type { PracticeConfig } from '../storage/store'

type Props = { config: PracticeConfig; onConfig: (c: PracticeConfig) => void; chords: Chord[]; voices: Note[][]; index: number; onInspect: (index: number) => void; onSave: (name: string) => void; canSave: boolean }
export function Progressions({ config,onConfig,chords,voices,index,onInspect,onSave,canSave }: Props) {
  const [name,setName] = useState('')
  const spec = PROGRESSIONS.find(p => p.id === config.progression)!
  return <div className="progressions-view">
    <div className="progression-preset"><label>经典进行<select aria-label="经典和弦进行" value={config.progression} onChange={e => {
      const next = PROGRESSIONS.find(p => p.id === e.target.value)!
      onConfig({...config,progression:next.id as ProgressionId,tonic:next.defaultTonic})
    }}>{PROGRESSIONS.map(p => <option key={p.id} value={p.id}>{p.name} · {p.romans.join('–')}</option>)}</select></label><label>移调到主音<select aria-label="进行主音" value={config.tonic} onChange={e => onConfig({...config,tonic:e.target.value})}>{ROOTS.map(r => <option key={r}>{r}</option>)}</select></label><span className="mode-tag">{config.tonic} {spec.mode === 'major' ? '大调' : '自然小调'}</span></div>
    <div className="progression-description"><h2>{spec.name}</h2><p>{spec.feeling}</p></div>
    <div className="progression-chords" aria-label="进行中的和弦">{chords.map((c,i) => <button key={i} onClick={() => onInspect(i)} aria-label={`查看进行和弦 ${c.symbol}`} aria-pressed={index === i} className={index === i ? 'progression-chord current' : 'progression-chord'}><span>{spec.romans[i]}<small>调内级数</small></span><strong>{c.symbol}</strong><em>{config.barsPerChord} 小节</em>{index === i && <small className="now-label">当前</small>}</button>)}</div>
    <div className="next-chord"><span>当前 <strong>{chords[index].symbol}</strong></span><span>下一和弦 <strong>{chords[(index+1)%chords.length].symbol}</strong> →</span></div>
    <div className="progression-config"><label>右手配置<select aria-label="右手连接方案" value={config.voicing} onChange={e => onConfig({...config,voicing:e.target.value as PracticeConfig['voicing']})}><option value="root">全部原位</option><option value="smooth">平稳连接</option></select></label><label>每和弦持续<select aria-label="每和弦持续小节" value={config.barsPerChord} onChange={e => onConfig({...config,barsPerChord:Number(e.target.value)})}><option value={1}>1 小节</option><option value={2}>2 小节</option><option value={4}>4 小节</option></select></label></div>
    <div className="voicing-summary"><span className="right-hand">右手实际配置</span><strong>{voices[index].map(n => n.label).join(' · ')}</strong><p>{config.voicing === 'smooth' ? '在有限音区枚举完整转位，优先减少相邻声部移动。这是启发式建议，不是唯一最优指法。左手仍保持和弦根音。' : '右手逐个使用完整原位，左手保持和弦根音。'}</p></div>
    <p className="small-print">{spec.tip} 移调保留当前调式，音高、音名与试听共同变化。来源：{spec.source}。</p>
    <form className="save-exercise" onSubmit={e => {e.preventDefault();onSave(name.trim() || `${config.tonic}${spec.mode === 'major' ? '大调' : '小调'} · ${spec.name}`);setName('')}}><label className="sr-only" htmlFor="exercise-name">练习名称</label><input id="exercise-name" maxLength={60} placeholder="为这组练习起个名字" value={name} onChange={e => setName(e.target.value)} /><button className="primary" type="submit" disabled={!canSave}>保存到我的练习</button></form>
    <p className="small-print">保存包含进行、主音、{PATTERNS.find(p => p.id === config.pattern)!.name}、音区、速度与左右手设置。</p>
  </div>
}
