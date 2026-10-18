import { useEffect, useMemo, useRef, useState,useSyncExternalStore } from 'react'
import { audio } from './audio/engine'
import { transport } from './audio/transport'
import { Icon } from './components/Icon'
import { Piano } from './components/Piano'
import { PlaybackBar } from './components/PlaybackBar'
import { Explorer, type AuditionMode } from './features/Explorer'
import { Patterns } from './features/Patterns'
import { Progressions } from './features/Progressions'
import { Practice } from './features/Practice'
import { PATTERNS } from './data/patterns'
import { leftBass, parseChord, voicing, type Chord } from './music/theory'
import { compatible, patternTimeline, PPQ } from './music/patterns'
import { progressionChords, progressionTimeline, progressionVoicings } from './music/progressions'
import { practiceConfig, type Exercise, type Settings } from './storage/store'
import { useUserData } from './storage/useUserData'

const PAGES = [
  {id:'explore',name:'和弦探索',icon:'keys',english:'CHORD EXPLORER',description:'从一个和弦出发，听见音符之间的关系。'},
  {id:'patterns',name:'伴奏音型',icon:'pattern',english:'ACCOMPANIMENT PATTERNS',description:'把一个和弦展开，在每一拍找到双手的位置。'},
  {id:'progressions',name:'和弦进行',icon:'flow',english:'CHORD PROGRESSIONS',description:'让和弦连成一句话，慢慢找到伴奏的流动。'},
  {id:'practice',name:'我的练习',icon:'book',english:'YOUR PRACTICE',description:'把想练的留下，下一次从这里继续。'},
]

export default function App() {
  const {data,update,warning} = useUserData()
  const s = data.settings
  const [page,setPage] = useState('explore')
  const [active,setActive] = useState<number[]>([])
  const [audioStatus,setAudioStatus] = useState('点击试听以开启声音')
  const [notice,setNotice] = useState('')
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
    if (page==='progressions') return chords.every(c => compatible(s.pattern,c)) ? progressionTimeline(chords,s.pattern,s.voicing,s.register,s.barsPerChord) : undefined
    return compatible(s.pattern,single) ? patternTimeline(single,s.pattern,singleRight,s.register) : undefined
  },[page,chords,s.pattern,s.voicing,s.register,s.barsPerChord,single,singleRight])
  const bass = (page!=='explore' ? timeline?.events.find(e => e.hand==='L' && e.chordIndex===(inProgression?chordIndex:0))?.notes[0] : undefined) ?? leftBass(current,43+s.register*12)
  const options = useMemo(() => ({bpm:s.bpm,hands:s.hands,loops:s.loops,metronome:s.metronome,countIn:s.countIn}),[s.bpm,s.hands,s.loops,s.metronome,s.countIn])
  const config = practiceConfig(s)
  const pageInfo = PAGES.find(p => p.id===page)!

  function stop() { generation.current++;transport.stop();audio.stopAll() }
  function settings(next: Partial<Settings>, reset = true) { if(reset) stop();update(d => ({...d,settings:{...d.settings,...next}})) }
  function navigate(next: string) { stop();setPage(next);setNotice('');document.getElementById('workspace')?.scrollTo({top:0}) }
  function choose(c: Chord,inv = 0) { settings({chord:c.symbol,inversion:inv}) }
  async function preview(mode: AuditionMode) {
    stop()
    const token= generation.current
    try {
      setAudioStatus('正在开启音频…')
      await audio.unlock()
      if(token!==generation.current) return
      setAudioStatus(`音频已开启 · ${audio.sourceName}`)
      let notes = s.hands==='left' ? [bass] : s.hands==='right' ? right : [bass,...right]
      notes=[...notes].sort((a,b) => mode==='down' ? b.midi-a.midi : a.midi-b.midi)
      notes.forEach((n,i) => audio.note(n.midi,audio.now+(mode==='block'?0:i*.3),1.1))
    } catch(e) {setAudioStatus(`音频失败，可点击重试：${(e as Error).message}`)}
  }
  async function playNote(midi: number) {
    const token=generation.current
    try {await audio.unlock();if(token!==generation.current)return;audio.note(midi);setAudioStatus(`音频已开启 · ${audio.sourceName}`)}
    catch {setAudioStatus('音频失败，请检查浏览器音频权限并重试。')}
  }
  async function playPractice() {
    if(playback.status==='playing') {transport.pause();return}
    generation.current++;audio.stopAll()
    try {await transport.play();setAudioStatus(`音频已开启 · ${audio.sourceName}`)}
    catch(e) {setAudioStatus(`音频失败，可点击重试：${(e as Error).message}`)}
  }
  async function step(tick: number) {
    if(!timeline || tick===undefined)return
    generation.current++;const token=generation.current
    transport.seek(tick);audio.stopAll()
    try {
      await audio.unlock();if(token!==generation.current)return
      timeline.events.filter(e => e.tick===tick && (s.hands==='both' || (s.hands==='left'?e.hand==='L':e.hand==='R'))).forEach(e => e.notes.forEach(n => audio.note(n.midi,audio.now,.6,e.velocity)))
      setAudioStatus(`音频已开启 · ${audio.sourceName}`)
    } catch {setAudioStatus('音频失败，请点击播放重试。')}
  }
  function saveExercise(name: string) {
    if(data.exercises.length>=100){setNotice('个人练习已达 100 项，请先导出并删除部分练习。');return}
    const exercise: Exercise = {id:crypto.randomUUID(),name,config:practiceConfig(s),createdAt:new Date().toISOString()}
    update(d => ({...d,exercises:[...d.exercises,exercise]}));setNotice(`已保存“${name}”，可在“我的练习”中打开。`)
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

  return <div className="app-shell">
    <a className="skip-link" href="#workspace">跳到练习区</a>
    <aside className="sidebar"><a className="brand" href="#" onClick={() => navigate('explore')}><span className="brand-mark"><Icon name="keys" size={25}/></span><span><strong>和序</strong><small>Chordflow</small></span></a><p className="nav-caption">你的钢琴学习手册</p><nav aria-label="主导航">{PAGES.map((p,i) => <button key={p.id} className={page===p.id?'active':''} aria-current={page===p.id?'page':undefined} onClick={() => navigate(p.id)}><Icon name={p.icon}/>{p.name}<span>0{i+1}</span></button>)}</nav><div className="sidebar-bottom"><div className="mini-keyboard"><i/><i/><i/><i/><i/><i/><i/></div><p>每天一点，<br/>让双手慢慢熟悉。</p><span>从和弦开始，弹出自己的伴奏。</span><button className="help-link" onClick={() => document.getElementById('help')?.scrollIntoView({behavior:'smooth'})}><Icon name="help" size={17}/>使用与学习说明</button></div></aside>
    <div className="main-shell"><header className="topbar"><span>学习手册 <span className="slash">/</span><strong>{pageInfo.name}</strong></span><span className="local-badge"><i/>本地练习 · 无需登录</span></header>
    <main id="workspace" tabIndex={-1}>
      <div className="page-heading"><div><span className="eyebrow">{pageInfo.english}</span><h1>{pageInfo.name}<span className="heading-dot">.</span></h1><p>{pageInfo.description}</p></div><div className="chapter-stamp">循序渐进<br/><strong>听 · 看 · 弹</strong></div></div>
      {warning && <p className="error" role="alert">{warning}</p>}
      {notice && <div className="notice" role="status"><span>{notice}</span><button className="quiet" aria-label="关闭提示" onClick={() => setNotice('')}>×</button></div>}
      {page==='practice' ? <section className="workspace-panel"><Practice data={data} onOpen={openExercise} onCopy={e => {if(data.exercises.length>=100){setNotice('个人练习已达 100 项。');return}update(d => ({...d,exercises:[...d.exercises,{...e,id:crypto.randomUUID(),name:(e.name+'（副本）').slice(0,60),createdAt:new Date().toISOString()}]}))}} onDelete={id => update(d => ({...d,exercises:d.exercises.filter(e => e.id!==id)}))} onFavorite={symbol => {const c=parseChord(symbol);choose(c,c.bass?c.notes.findIndex(n => n.pc===c.bass?.pc):0);setPage('explore')}} onRemoveFavorite={symbol => update(d => ({...d,favorites:d.favorites.filter(c => c!==symbol)}))} onImport={next => {stop();update(() => next)}} onCreate={() => navigate('progressions')}/></section> : <div className="workspace-grid"><section className="workspace-panel" aria-label="和弦学习">
        {page==='explore' ? <Explorer current={current} right={right} bass={bass} inversion={s.inversion} onChoose={choose} onPreview={preview} onStop={stop} favorite={data.favorites.includes(current.symbol)} onFavorite={favorite}/> : <>
          {inProgression && <Progressions config={config} onConfig={next => settings(next)} chords={chords} voices={voices} index={chordIndex} onInspect={index => {if(timeline)void step(index*s.barsPerChord*spec.beats*PPQ)}} onSave={saveExercise} canSave={!!timeline && data.exercises.length<100}/>}
          <Patterns current={current} onChoose={choose} pattern={s.pattern} onPattern={pattern => settings({pattern})} timeline={timeline} playback={playback} onStep={step} register={s.register} onRegister={register => settings({register})} progression={inProgression} hands={s.hands}/>
        </>}
        <div className="keyboard-heading"><h3>把声音放到琴键上</h3><div className="keyboard-controls"><label>音区<select aria-label="键盘起始音区" value={s.octave} onChange={e => settings({octave:Number(e.target.value)})}><option value={2}>C2–C5</option><option value={3}>C3–C6</option><option value={4}>C4–C7</option></select></label><label>标记<select aria-label="琴键标记" value={s.labels} onChange={e => settings({labels:e.target.value as Settings['labels']},false)}><option value="notes">音名</option><option value="degrees">相对度数</option></select></label></div></div>
        <Piano chord={current} right={right} bass={bass} active={active} octave={s.octave} labels={s.labels} onNote={playNote}/>
        <div className="keyboard-legend"><span><i className="legend-root"/>根音</span><span><i className="legend-right"/>右手</span><span><i className="legend-left"/>左手低音</span><span>● 正在发声</span><span>点击琴键，或聚焦后按回车</span></div>
        {[bass,...right].some(n => n.midi<(s.octave+1)*12 || n.midi>(s.octave+4)*12) && <p className="small-print">部分配置音在当前可见音区外；请调整上方键盘音区查看。演奏音区需在音型设置中调整。</p>}
      </section><aside className="study-aside"><span className="eyebrow">练琴小记</span><h2>先听清，<br/>再连起来。</h2><p>一次只改变一件事。先比较大三与小三，再听同一个和弦的不同转位。</p><div className="aside-rule"/><h3>一个小练习</h3><p>弹 C → Am → F → G。找到它们共有的音，试着让右手少移动一点。</p><div className="quick-chords">{['C','Am','F','G'].map(symbol => <button key={symbol} onClick={() => {choose(parseChord(symbol));setPage('explore')}}>{symbol}</button>)}</div><div className="aside-footnote">学习顺序<br/><strong>构成音 → 转位 → 伴奏 → 连接</strong></div></aside></div>}
      <details id="help" className="help-panel">
        <summary>关于和序 · Chordflow 与本地数据</summary>
        <p>从和弦开始，弹出自己的伴奏。From chords to accompaniment.</p>
        <p>C4 = MIDI 60，A4 = 440 Hz。默认使用 Salamander 采样钢琴，首次点击加载本地音源；失败时明确降级为合成音，可重试。静音时检查主音量与设备音量。琴键可通过 Tab 聚焦、Enter 或 Space 弹奏。</p>
        <p>教学内容为原创教学示例。指法因手型和连接而异。没有 MIDI 或麦克风识别，不测量正确率。数据仅在当前浏览器保存，不自动跨设备同步；可在“我的练习”导入与导出 JSON 备份。</p>
        <p>切换页面、和弦、音型、速度、手别与演奏音区会停止并回到开头；暂停保留当前位置。一次只有一个主动播放会话，点击琴键的短音可叠加。后台自动暂停，需要回到页面手动继续。持续循环中，每完成一整组进行或一小节单和弦音型计一轮。</p>
        <p><a href="/third-party-notices.txt" target="_blank" rel="noreferrer">开源组件许可</a> · <a href="/audio/salamander/LICENSE.txt" target="_blank" rel="noreferrer">钢琴采样署名与许可</a></p>
      </details>
    </main>
    {page!=='practice' && <PlaybackBar practice={page!=='explore'} snapshot={playback} options={options} onOptions={next => settings(next)} onPlay={() => page==='explore'?preview('block'):playPractice()} onStop={stop} volume={s.volume} onVolume={volume => settings({volume},false)} source={audio.sourceName} canRetry={sampleState.status==='fallback'} onRetry={async()=>{stop();setAudioStatus('正在重试加载…');try{await audio.retrySamples();setAudioStatus(`音频已开启 · ${audio.sourceName}`)}catch{setAudioStatus('音频失败，请检查权限后重试。')}}} status={sampleState.status==='loading'?`加载钢琴采样 ${sampleState.loaded}/${sampleState.total}`:sampleState.status==='fallback'?sampleState.message:audioStatus} disabled={sampleState.status==='loading'||(page!=='explore'&&!timeline)}/>}
    </div>
  </div>
}
