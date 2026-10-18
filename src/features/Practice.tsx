import { useRef, useState } from 'react'
import { PATTERNS } from '../data/patterns'
import { PROGRESSIONS } from '../data/progressions'
import { progressionChords } from '../music/progressions'
import { MAX_BACKUP_BYTES, parseBackup, type Exercise, type UserData } from '../storage/store'

type Props = { data: UserData; onOpen: (exercise: Exercise) => void; onCopy: (exercise: Exercise) => void; onDelete: (id: string) => void; onFavorite: (symbol: string) => void; onRemoveFavorite: (symbol: string) => void; onImport: (d: UserData) => void; onCreate: () => void }
export function Practice({data,onOpen,onCopy,onDelete,onFavorite,onRemoveFavorite,onImport,onCreate}: Props) {
  const [pending,setPending] = useState<UserData>()
  const [message,setMessage] = useState('')
  const [error,setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  async function importFile(file?: File) {
    setError('');setMessage('');setPending(undefined)
    if (!file) return
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('文件超过 1 MB。')
      setPending(parseBackup(await file.text()))
    } catch(e) {setError((e as Error).message)}
    if(input.current) input.current.value=''
  }
  function exportFile() {
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href=url;link.download=`chordflow-backup-${new Date().toISOString().slice(0,10)}.json`
    document.body.append(link);link.click();link.remove()
    setTimeout(() => URL.revokeObjectURL(url),1000)
    setMessage('备份已导出。请妥善保存 JSON 文件。')
  }
  return <div className="practice-view">
    <div className="practice-heading"><div><span className="eyebrow">实际播放记录</span><h2>{Math.floor(data.stats.seconds/60)}<small>分</small>{Math.floor(data.stats.seconds%60)}<small>秒</small></h2><p>只记录练习播放器实际运行的时间，不含预备拍和暂停。</p></div><div className="completion-count"><strong>{data.stats.completions}</strong><span>完成轮次</span><small>不评估弹奏准确率</small></div></div>
    <div className="section-label"><h3>保存的练习 <span className="count-label">{data.exercises.length}</span></h3><button className="quiet" onClick={onCreate}>＋ 创建练习</button></div>
    {!data.exercises.length ? <div className="empty-state"><h3>给下一次练琴留一个起点。</h3><p>在“和弦进行”选择进行、音型与速度，再保存到这里。</p><button onClick={onCreate}>去创建练习 →</button></div> : <div className="saved-exercises">{data.exercises.map(e => {
      const spec=PROGRESSIONS.find(p => p.id===e.config.progression)!
      return <article className="saved-exercise" key={e.id}><div><h3>{e.name}</h3><p>{progressionChords(e.config.progression,e.config.tonic).map(c => c.symbol).join(' – ')}</p><small>{spec.mode==='major'?'大调':'自然小调'} · {PATTERNS.find(p => p.id===e.config.pattern)!.name} · {e.config.bpm} BPM · {e.config.hands==='both'?'双手':e.config.hands==='left'?'仅左手':'仅右手'}</small></div><div className="exercise-actions"><button className="primary" onClick={() => onOpen(e)} aria-label={`打开练习 ${e.name}`}>开始练习</button><button onClick={() => onCopy(e)} aria-label={`复制练习 ${e.name}`}>复制</button><button className="quiet" onClick={() => onDelete(e.id)} aria-label={`删除练习 ${e.name}`}>删除</button></div></article>
    })}</div>}
    <div className="section-label"><h3>收藏的和弦</h3><span>{data.favorites.length} 个</span></div>
    {!data.favorites.length ? <p className="small-print">在和弦探索中点按星标，把常练的和弦收在这里。</p> : <div className="favorite-list">{data.favorites.map(s => <div key={s}><button onClick={() => onFavorite(s)}>{s}</button><button className="quiet" aria-label={`移除收藏 ${s}`} onClick={() => onRemoveFavorite(s)}>×</button></div>)}</div>}
    <div className="backup-panel"><div><h3>把练习带走</h3><p>设置、收藏和练习仅保存在当前浏览器，不会自动跨设备同步。清理网站数据前先导出。</p></div><div className="backup-actions"><button onClick={exportFile}>导出 JSON 备份</button><button onClick={() => input.current?.click()}>导入 JSON 备份</button><input className="sr-only" aria-label="选择 JSON 备份" ref={input} type="file" accept=".json,application/json" onChange={e => {void importFile(e.target.files?.[0])}} /></div></div>
    {error && <p className="error" role="alert">{error} 当前数据没有改变。</p>}
    {pending && <div className="import-preview"><h3>备份校验通过</h3><p>{pending.exercises.length} 个练习、{pending.favorites.length} 个收藏。导入将替换当前设置、练习和记录；建议先导出当前数据。</p><button className="primary" onClick={() => {onImport(pending);setPending(undefined);setMessage('已导入备份，设置与练习已恢复。')}}>替换本地数据</button><button onClick={() => setPending(undefined)}>取消导入</button></div>}
    {message && <p className="inline-status" role="status">{message}</p>}
  </div>
}
