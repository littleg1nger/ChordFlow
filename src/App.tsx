import { useEffect, useMemo, useRef, useState,useSyncExternalStore } from 'react'
import { audio } from './audio/engine'
import { transport } from './audio/transport'
import { Icon } from './components/Icon'
import { Brand } from './components/Brand'
import { Piano } from './components/Piano'
import { PlaybackBar } from './components/PlaybackBar'
import { Explorer, type AuditionMode } from './features/Explorer'
import { Patterns } from './features/Patterns'
import { Progressions } from './features/Progressions'
import { Practice } from './features/Practice'
import { PATTERNS } from './data/patterns'
import {PROGRESSIONS} from './data/progressions'
import { leftBass, parseChord, voicing,midiName, type Chord } from './music/theory'
import {demoRange,manualRange} from './music/keyboard-range'
import { compatible, patternTimeline, PPQ } from './music/patterns'
import { progressionChords, progressionTimeline, progressionVoicings } from './music/progressions'
import { practiceConfig, type Exercise, type Settings } from './storage/store'
import { useUserData } from './storage/useUserData'

const PAGES = [
  {id:'explore',name:'和弦探索',icon:'keys'},
  {id:'patterns',name:'伴奏音型',icon:'pattern'},
  {id:'progressions',name:'和弦进行',icon:'flow'},
  {id:'practice',name:'我的练习',icon:'book'},
]

export default function App() {
  const {data,update,warning} = useUserData()
  const s = data.settings
  const [page,setPage] = useState('explore')
  const [active,setActive] = useState<number[]>([])
  const [audioStatus,setAudioStatus] = useState('点击试听以开启声音')
  const [notice,setNotice] = useState('')
  const [auditionLabel,setAuditionLabel] = useState('')
  const [auditionStopped,setAuditionStopped] = useState(false)
  const [playback,setPlayback] = useState(transport.snapshot)
  const sampleState=useSyncExternalStore(audio.subscribe,audio.getSnapshot)
  const generation = useRef(0)
  const single = useMemo(() => parseChord(s.chord),[s.chord])
  const singleRight = useMemo(() => voicing(single,s.inversion,55+s.register*12),[single,s.inversion,s.register])
  const chords = useMemo(() => progressionChords(s.progression,s.tonic),[s.progression,s.tonic])
  const voices = useMemo(() => progressionVoicings(chords,s.voicing,s.register),[chords,s.voicing,s.register])
  const spec = PATTERNS.find(p => p.id===s.pattern)!
  const chordIndex = Math.min(chords.length-1,Math.floor(Math.max(0,playback.tick)/(spec.beats*PPQ*s.barsPerChord)))
  const inProgression = page === 'progressions'
  const current = inProgression ? chords[chordIndex] : single
  const right = inProgression ? voices[chordIndex] : singleRight
  const timeline = useMemo(() => {
    if (page==='progressions') return chords.every(c => compatible(s.pattern,c))&&!(s.fill!=='none'&&spec.beats!==4) ? progressionTimeline(chords,s.pattern,s.voicing,s.register,s.barsPerChord,{fill:s.fill,tonic:s.tonic,mode:PROGRESSIONS.find(p=>p.id===s.progression)!.mode}) : undefined
    return compatible(s.pattern,single) ? patternTimeline(single,s.pattern,singleRight,s.register) : undefined
  },[page,chords,s.pattern,s.voicing,s.register,s.barsPerChord,single,singleRight,s.fill,s.tonic,s.progression,spec.beats])
  const bass = (page!=='explore' ? timeline?.events.find(e => e.hand==='L' && e.chordIndex===(inProgression?chordIndex:0))?.notes[0] : undefined) ?? leftBass(current,43+s.register*12)
  const demoMidis=useMemo(()=>{
    if(page!=='explore'&&timeline)return timeline.events.flatMap(e=>e.notes.map(n=>n.midi))
    if(inProgression)return chords.flatMap((c,i)=>[leftBass(c,43+s.register*12).midi,...voices[i].map(n=>n.midi)])
    return [leftBass(single,43+s.register*12).midi,...singleRight.map(n=>n.midi)]
  },[page,timeline,inProgression,chords,voices,single,s.register,singleRight])
  const keyboardRange=useMemo(()=>s.autoRange?demoRange(demoMidis):manualRange(s.octave),[s.autoRange,s.octave,demoMidis])
  const keyboardEvents=useMemo(()=>page==='explore'?undefined:timeline?.events.filter(e=>e.chordIndex===(inProgression?chordIndex:0)),[page,timeline,inProgression,chordIndex])
  const options = useMemo(() => ({bpm:s.bpm,hands:s.hands,loops:s.loops,metronome:s.metronome,countIn:s.countIn}),[s.bpm,s.hands,s.loops,s.metronome,s.countIn])
  const config = practiceConfig(s)
  const pageInfo = PAGES.find(p => p.id===page)!

  function stop() { setAuditionLabel('');setAuditionStopped(true);generation.current++;transport.stop();audio.stopAll() }
  function settings(next: Partial<Settings>, reset = true) { if(reset) stop();update(d => ({...d,settings:{...d.settings,...next}})) }
  function navigate(next: string) { stop();setPage(next);setNotice('');document.getElementById('workspace')?.scrollTo({top:0}) }
  function choose(c: Chord,inv = 0) { settings({chord:c.symbol,inversion:inv}) }
  async function preview(mode: AuditionMode) {
    stop()
    const token= generation.current
    setAuditionLabel(`${current.symbol} · ${mode==='block'?'同时弹':mode==='up'?'逐音上行':'逐音下行'}`)
    setAuditionStopped(false)
    try {
      setAudioStatus('正在开启音频…')
      await audio.unlock()
      if(token!==generation.current) return
      setAudioStatus('音频已开启')
      let notes = s.hands==='left' ? [bass] : s.hands==='right' ? right : [bass,...right]
      notes=[...notes].sort((a,b) => mode==='down' ? b.midi-a.midi : a.midi-b.midi)
      notes.forEach((n,i) => audio.note(n.midi,audio.now+(mode==='block'?0:i*.3),1.1))
    } catch(e) {if(token===generation.current)setAudioStatus(`音频失败，可点击重试：${(e as Error).message}`)}
  }
  async function playNote(midi: number) {
    setAuditionLabel(`${midiName(midi)} · 单音`)
    setAuditionStopped(false)
    const token=generation.current
    try {await audio.unlock();if(token!==generation.current)return;audio.note(midi);setAudioStatus('音频已开启')}
    catch {if(token===generation.current)setAudioStatus('音频失败，请检查浏览器音频权限并重试。')}
  }
  async function playPractice() {
    if(playback.status==='playing') {transport.pause();return}
    generation.current++;audio.stopAll()
    const token=generation.current
    try {await transport.play();if(token===generation.current)setAudioStatus('音频已开启')}
    catch(e) {if(token===generation.current)setAudioStatus(`音频失败，可点击重试：${(e as Error).message}`)}
  }
  async function step(tick: number) {
    if(!timeline || tick===undefined)return
    generation.current++;const token=generation.current
    transport.seek(tick);audio.stopAll()
    try {
      await audio.unlock();if(token!==generation.current)return
      timeline.events.filter(e => e.tick===tick && (s.hands==='both' || (s.hands==='left'?e.hand==='L':e.hand==='R'))).forEach(e => e.notes.forEach(n => audio.note(n.midi,audio.now,.6,e.velocity)))
      setAudioStatus('音频已开启')
    } catch {if(token===generation.current)setAudioStatus('音频失败，请点击播放重试。')}
  }
  function saveExercise(name: string) {
    if(data.exercises.length>=100){setNotice('个人练习已达 100 项，请先导出并删除部分练习。');return}
    const exercise: Exercise = {id:crypto.randomUUID(),name,config:practiceConfig(s),createdAt:new Date().toISOString()}
    update(d => ({...d,exercises:[...d.exercises,exercise]}));setNotice(`已保存“${name}”，可在“我的练习”中打开。`)
  }
  async function retrySamples() {
    stop();const token=generation.current;setAudioStatus('正在重试加载…')
    try{await audio.retrySamples();if(token===generation.current)setAudioStatus('音频已开启')}
    catch{if(token===generation.current)setAudioStatus('音频失败，请检查权限后重试。')}
  }
  function openExercise(e: Exercise) {settings(e.config);setPage('progressions');document.getElementById('workspace')?.scrollTo({top:0});setNotice(`已打开“${e.name}”，点击播放开始。`)}
  function favorite() {
    if(!data.favorites.includes(current.symbol) && data.favorites.length>=200){setNotice('收藏已达 200 个，请先整理收藏。');return}
    update(d => ({...d,favorites:d.favorites.includes(current.symbol)?d.favorites.filter(c => c!==current.symbol):[...d.favorites,current.symbol]}))
  }
  useEffect(() => transport.subscribe(setPlayback),[])
  useEffect(() => {if(timeline)transport.load(timeline,options);else transport.stop()},[timeline,options])
  useEffect(() => {
    transport.onRecord=(seconds,completions) => {if(seconds>0 || completions>0)update(d => ({...d,stats:{seconds:d.stats.seconds+seconds,completions:d.stats.completions+completions}}))}
    return () => {transport.onRecord=undefined}
  },[update])
  useEffect(() => {
    let frame=0
    const poll = () => {const next=[...new Set(audio.activeNotes())].sort((a,b) => a-b);setActive(old => old.join(',')===next.join(',')?old:next);frame=requestAnimationFrame(poll)}
    frame=requestAnimationFrame(poll)
    const pause=() => {generation.current++;transport.pause();audio.stopAll()}
    const hide=() => {if(document.hidden){pause();setAudioStatus('页面进入后台，播放已暂停；点击继续。')}}
    document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',pause)
    return () => {cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',pause);transport.stop();audio.stopAll()}
  },[])
  useEffect(() => {audio.setVolume(s.volume/100)},[s.volume])

  const keyboard = <div className="keyboard-workspace">
        <div className="keyboard-heading"><h3>演示键盘</h3><div className="keyboard-controls"><label>音区<select aria-label="键盘起始音区" value={s.autoRange?'auto':String(s.octave)} onChange={e => settings(e.target.value==='auto'?{autoRange:true}:{autoRange:false,octave:Number(e.target.value)})}><option value="auto">自动适配</option><option value="2">C2–C5</option><option value="3">C3–C6</option><option value="4">C4–C7</option></select></label><label>标记<select aria-label="琴键标记" value={s.labels} onChange={e => settings({labels:e.target.value as Settings['labels']},false)}><option value="notes">音名</option><option value="degrees">相对度数</option></select></label></div></div>
        <p className="range-description">{s.autoRange?'自动适配':'手动音区'} · {midiName(keyboardRange.start)}–{midiName(keyboardRange.end)}{s.autoRange?(inProgression?' · 覆盖整组进行，播放时保持稳定':' · 覆盖当前演示的全部音符'):''}<span className="range-hint">。只调整显示，不改变演奏音高。</span></p>
        <Piano chord={current} right={right} bass={bass} active={active} range={keyboardRange} labels={s.labels} onNote={playNote} events={keyboardEvents} tick={playback.tick} focusMidis={s.autoRange?demoMidis:undefined}/>
            <PlaybackBar content={page==='explore'?(auditionLabel||`${current.symbol} · 和弦试听`):`${inProgression?PROGRESSIONS.find(p=>p.id===s.progression)!.name:current.symbol} · ${spec.name}`} playbackState={page==='explore'?(auditionStopped?'已停止':audioStatus.startsWith('音频失败')?'试听失败':sampleState.status==='loading'?'加载中…':active.length?'正在发声':auditionLabel?'试听结束':'待试听'):(playback.status==='playing'?'正在播放':playback.status==='paused'?'已暂停':playback.status==='loading'?'加载中…':playback.status==='finished'?'本轮完成':'已停止')} onPreview={preview} practice={page!=='explore'} snapshot={playback} options={options} onOptions={next => settings(next)} onPlay={() => page==='explore'?preview('block'):playPractice()} onStop={stop} volume={s.volume} onVolume={volume => settings({volume},false)} source={audio.sourceName} canRetry={sampleState.status==='fallback'} onRetry={retrySamples} status={sampleState.status==='loading'?`加载钢琴采样 ${sampleState.loaded}/${sampleState.total}`:sampleState.status==='fallback'?`${audioStatus} · ${sampleState.message}`:audioStatus} disabled={sampleState.status==='loading'||(page!=='explore'&&!timeline)}/>
        <div className="keyboard-legend"><span><i className="legend-root"/>根音</span><span><i className="legend-right"/>右手</span><span><i className="legend-left"/>左手低音</span><span>● 正在发声</span>{inProgression&&s.fill!=='none'&&<span>花 · 加花按音</span>}<span>点击琴键，或聚焦后按回车</span></div>
        {demoMidis.some(n => n<keyboardRange.start || n>keyboardRange.end) && <p className="small-print">部分演示音在手动音区外。<button className="quiet" onClick={()=>settings({autoRange:true},false)}>恢复自动音区</button>演奏音区需在音型设置中调整。</p>}
  </div>
  const practiceInstrument = <div className="instrument-layout"><div className="instrument-main">{keyboard}</div><aside className="playing-guide" aria-label="当前音型弹奏指导"><h3>{spec.name} · 弹奏指导</h3><div className="hand-voicing"><div><span className="left-hand">左手基础低音</span><strong>{bass.label}</strong></div><div><span className="right-hand">{current.symbol} · 右手基础配置</span><strong>{right.map(n=>n.label).join(' · ')}</strong></div></div><p>{spec.tip}</p><p>选择下方事件格可试听单步；连续练习使用键盘下方的播放器。{inProgression&&s.fill!=='none'?'加花按音与经过音以当前事件格为准。':''}</p></aside></div>
  const patternsPanel = <Patterns instrument={practiceInstrument} current={current} onChoose={choose} pattern={s.pattern} onPattern={pattern => settings({pattern,...(PATTERNS.find(p=>p.id===pattern)!.beats!==4?{fill:'none' as const}:{})})} timeline={timeline} playback={playback} onStep={step} register={s.register} onRegister={register => settings({register})} progression={inProgression} hands={s.hands}/>
  return <div className="app-shell" onPointerDownCapture={e=>{if(e.currentTarget.dataset.input!=='pointer')e.currentTarget.dataset.input='pointer'}} onKeyDownCapture={e=>{if(e.currentTarget.dataset.input!=='keyboard')e.currentTarget.dataset.input='keyboard'}}>
    <a className="skip-link" href="#workspace">跳到练习区</a>
    <aside className="sidebar"><a className="brand" href="#" aria-label="和序 · Chordflow" onClick={() => navigate('explore')}><Brand/></a><nav aria-label="主导航">{PAGES.map(p => <button key={p.id} className={page===p.id?'active':''} aria-current={page===p.id?'page':undefined} onClick={() => navigate(p.id)}><Icon name={p.icon}/>{p.name}</button>)}</nav><button className="help-link" onClick={() => {const help=document.getElementById('help') as HTMLDetailsElement;help.open=true;help.scrollIntoView({behavior:'smooth'})}}><Icon name="help" size={17}/>使用与数据说明</button></aside>
    <div className="main-shell"><header className="topbar"><h1>{pageInfo.name}</h1><span className="local-badge"><i/>本地练习 · 自动保存</span></header>
    <main id="workspace" tabIndex={-1}>
      {warning && <p className="error" role="alert">{warning}</p>}
      {notice && <div className="notice" role="status"><span>{notice}</span><button className="quiet" aria-label="关闭提示" onClick={() => setNotice('')}>×</button></div>}
      {page==='practice' ? <section className="workspace-panel"><Practice data={data} onOpen={openExercise} onCopy={e => {if(data.exercises.length>=100){setNotice('个人练习已达 100 项。');return}update(d => ({...d,exercises:[...d.exercises,{...e,id:crypto.randomUUID(),name:(e.name+'（副本）').slice(0,60),createdAt:new Date().toISOString()}]}))}} onDelete={id => update(d => ({...d,exercises:d.exercises.filter(e => e.id!==id)}))} onFavorite={symbol => {const c=parseChord(symbol);choose(c,c.bass?c.notes.findIndex(n => n.pc===c.bass?.pc):0);setPage('explore')}} onRemoveFavorite={symbol => update(d => ({...d,favorites:d.favorites.filter(c => c!==symbol)}))} onImport={next => {stop();update(() => next)}} onCreate={() => navigate('progressions')}/></section> : <section className="workspace-panel" aria-label="和弦学习">
        {page==='explore' ? <Explorer current={current} right={right} bass={bass} inversion={s.inversion} onChoose={choose} favorite={data.favorites.includes(current.symbol)} onFavorite={favorite}>{keyboard}</Explorer> : inProgression ? <Progressions config={config} onConfig={next => settings(next)} chords={chords} voices={voices} index={chordIndex} onInspect={index => {if(timeline)void step(index*s.barsPerChord*spec.beats*PPQ)}} onSave={saveExercise} canSave={!!timeline && data.exercises.length<100}>{patternsPanel}</Progressions> : patternsPanel}
      </section>}
      <details id="help" className="help-panel">
        <summary>关于和序 · Chordflow 与本地数据</summary>
        <p>键盘音区只调整显示，不改变演奏音高；演奏音区在音型设置中调整。C4 = MIDI 60，A4 = 440 Hz。默认使用 Salamander 采样钢琴，首次点击加载本地音源；失败时明确降级为合成音，可重试。静音时检查主音量与设备音量。琴键可通过 Tab 聚焦、Enter 或 Space 弹奏。</p>
        <p>教学内容为原创教学示例。指法因手型和连接而异。没有 MIDI 或麦克风识别，不测量正确率。数据仅在当前浏览器保存，不自动跨设备同步；可在“我的练习”导入与导出 JSON 备份。</p>
        <p>切换页面、和弦、音型、速度、手别与演奏音区会停止并回到开头；暂停保留当前位置。一次只有一个主动播放会话，点击琴键的短音可叠加。后台自动暂停，需要回到页面手动继续。持续循环中，每完成一整组进行或一小节单和弦音型计一轮。</p>
        <p><a href="/third-party-notices.txt" target="_blank" rel="noreferrer">开源组件许可</a> · <a href="/audio/salamander/LICENSE.txt" target="_blank" rel="noreferrer">钢琴采样署名与许可</a></p>
      </details>
    </main>
    </div>
  </div>
}
