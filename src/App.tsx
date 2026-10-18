import { useEffect, useMemo, useRef, useState } from 'react'
import { audio } from './audio/engine'
import { Icon } from './components/Icon'
import { Piano } from './components/Piano'
import { Explorer, type AuditionMode } from './features/Explorer'
import { Patterns } from './features/Patterns'
import { PlaybackBar } from './components/PlaybackBar'
import { transport, type PlaybackOptions } from './audio/transport'
import type { PatternId } from './data/patterns'
import { compatible, patternTimeline } from './music/patterns'
import { leftBass, parseChord, voicing, type Chord } from './music/theory'

export default function App() {
  const [current, setCurrent] = useState(() => parseChord('C'))
  const [inversion, setInversion] = useState(0)
  const [octave, setOctave] = useState(2)
  const [labels, setLabels] = useState<'notes' | 'degrees'>('notes')
  const [active, setActive] = useState<number[]>([])
  const [audioStatus, setAudioStatus] = useState('点击试听以开启声音')
  const [volume, setVolume] = useState(55)
  const [page, setPage] = useState('explore')
  const [pattern, setPattern] = useState<PatternId>('arp')
  const [register, setRegister] = useState(0)
  const [options, setOptions] = useState<PlaybackOptions>({ bpm: 72, hands: 'both', loops: 0, metronome: false, countIn: false })
  const [playback, setPlayback] = useState(transport.snapshot)
  const [favorites, setFavorites] = useState<string[]>([])
  const generation = useRef(0)
  const right = useMemo(() => voicing(current, inversion, 55 + register * 12),[current,inversion,register])
  const bass = leftBass(current,43 + register * 12)
  const timeline = useMemo(() => compatible(pattern,current) ? patternTimeline(current,pattern,right,register) : undefined,[current,pattern,right,register])
  const stop = () => { generation.current++; transport.stop(); audio.stopAll() }
  const choose = (c: Chord, inv = 0) => { stop(); setCurrent(c); setInversion(inv) }
  async function preview(mode: AuditionMode) {
    stop()
    const token = generation.current
    try {
      setAudioStatus('正在开启音频…')
      await audio.unlock()
      if (token !== generation.current) return
      setAudioStatus('音频已开启 · 合成键盘音')
      let notes = options.hands === 'left' ? [bass] : options.hands === 'right' ? right : [bass, ...right]
      if (mode === 'down') notes = [...notes].sort((a, b) => b.midi - a.midi)
      else notes = [...notes].sort((a, b) => a.midi - b.midi)
      notes.forEach((n, i) => audio.note(n.midi, audio.now + (mode === 'block' ? 0 : i * 0.3), 1.1))
    } catch (e) { setAudioStatus(`音频失败，可点击重试：${(e as Error).message}`) }
  }
  async function playNote(midi: number) {
    try { await audio.unlock(); audio.note(midi); setAudioStatus('音频已开启 · 合成键盘音') }
    catch { setAudioStatus('音频失败，请检查浏览器音频权限并重试。') }
  }
  async function playPractice() {
    if (playback.status === 'playing') { transport.pause(); return }
    try { await transport.play(); setAudioStatus('音频已开启 · 合成键盘音') }
    catch (e) { setAudioStatus(`音频失败，可点击重试：${(e as Error).message}`) }
  }
  async function step(tick: number) {
    if (!timeline || tick === undefined) return
    generation.current++
    transport.seek(tick)
    audio.stopAll()
    try {
      await audio.unlock()
      timeline.events.filter(e => e.tick === tick && (options.hands === 'both' || (options.hands === 'left' ? e.hand === 'L' : e.hand === 'R'))).forEach(e => e.notes.forEach(n => audio.note(n.midi,audio.now,0.6,e.velocity)))
      setAudioStatus('音频已开启 · 合成键盘音')
    } catch { setAudioStatus('音频失败，请点击播放重试。') }
  }
  useEffect(() => transport.subscribe(setPlayback),[])
  useEffect(() => { if (timeline) transport.load(timeline,options); else transport.stop() },[timeline,options])
  useEffect(() => {
    let frame = 0
    const update = () => {
      const next = [...new Set(audio.activeNotes())].sort((a, b) => a - b)
      setActive(old => old.join(',') === next.join(',') ? old : next)
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    const hide = () => { if (document.hidden) { generation.current++; transport.pause(); audio.stopAll(); setAudioStatus('页面进入后台，播放已暂停；点击继续。') } }
    document.addEventListener('visibilitychange', hide)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', hide); transport.stop(); audio.stopAll() }
  }, [])
  useEffect(() => { audio.setVolume(volume / 100) }, [volume])

  const pageTitle = page === 'explore' ? '和弦探索' : '伴奏音型'
  return <div className="app-shell">
    <a className="skip-link" href="#workspace">跳到练习区</a>
    <aside className="sidebar"><a className="brand" href="#" onClick={() => { stop(); setPage('explore') }}><span className="brand-mark"><Icon name="keys" size={25} /></span><span><strong>和序</strong><small>Chordflow</small></span></a><p className="nav-caption">你的钢琴学习手册</p><nav aria-label="主导航">{[{id:'explore',name:'和弦探索',icon:'keys'},{id:'patterns',name:'伴奏音型',icon:'pattern'},{id:'progressions',name:'和弦进行',icon:'flow'},{id:'practice',name:'我的练习',icon:'book'}].map((p,i) => <button key={p.id} className={page === p.id ? 'active' : ''} aria-current={page === p.id ? 'page' : undefined} disabled={i>1} onClick={() => { stop(); setPage(p.id) }}><Icon name={p.icon} />{p.name}<span>0{i+1}</span></button>)}</nav><div className="sidebar-bottom"><div className="mini-keyboard"><i /><i /><i /><i /><i /><i /><i /></div><p>每天一点，<br />让双手慢慢熟悉。</p><span>从和弦开始，弹出自己的伴奏。</span><button className="help-link" onClick={() => document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' })}><Icon name="help" size={17} />使用与学习说明</button></div></aside>
    <div className="main-shell"><header className="topbar"><span>学习手册 <span className="slash">/</span> <strong>和弦探索</strong></span><span className="local-badge"><i />本地练习 · 无需登录</span></header>
    <main id="workspace" tabIndex={-1}><div className="page-heading"><div><span className="eyebrow">{page === 'explore' ? 'CHORD EXPLORER' : 'ACCOMPANIMENT PATTERNS'}</span><h1>{pageTitle}<span className="heading-dot">.</span></h1><p>{page === 'explore' ? '从一个和弦出发，听见音符之间的关系。' : '把一个和弦展开，在每一拍找到双手的位置。'}</p></div><div className="chapter-stamp">认识和弦<br /><strong>听 · 看 · 弹</strong></div></div>
      <div className="workspace-grid"><section className="workspace-panel" aria-label="和弦学习">{page === 'explore' ? <Explorer current={current} right={right} bass={bass} inversion={inversion} onChoose={choose} onPreview={preview} onStop={stop} favorite={favorites.includes(current.symbol)} onFavorite={() => setFavorites(old => old.includes(current.symbol) ? old.filter(s => s !== current.symbol) : [...old, current.symbol])} /> : <Patterns current={current} onChoose={choose} pattern={pattern} onPattern={p => { stop(); setPattern(p) }} timeline={timeline} playback={playback} onStep={step} register={register} onRegister={n => { stop(); setRegister(n) }} />}
        <div className="keyboard-heading"><h3>把声音放到琴键上</h3><div className="keyboard-controls"><label>音区<select aria-label="键盘起始音区" value={octave} onChange={e => { stop(); setOctave(Number(e.target.value)) }}><option value={2}>C2–C5</option><option value={3}>C3–C6</option><option value={4}>C4–C7</option></select></label><label>标记<select aria-label="琴键标记" value={labels} onChange={e => setLabels(e.target.value as 'notes' | 'degrees')}><option value="notes">音名</option><option value="degrees">相对度数</option></select></label></div></div>
        <Piano chord={current} right={right} bass={bass} active={active} octave={octave} labels={labels} onNote={playNote} />
        <div className="keyboard-legend"><span><i className="legend-root" />根音</span><span><i className="legend-right" />右手</span><span><i className="legend-left" />左手低音</span><span>● 正在发声</span><span>点击琴键，或聚焦后按回车</span></div>
      </section><aside className="study-aside"><span className="eyebrow">练琴小记</span><h2>先听清，<br />再连起来。</h2><p>一次只改变一件事。先比较大三与小三，再听同一个和弦的不同转位。</p><div className="aside-rule" /><h3>一个小练习</h3><p>弹 C → Am → F → G。找到它们共有的音，试着让右手少移动一点。</p><div className="quick-chords">{['C', 'Am', 'F', 'G'].map(s => <button key={s} onClick={() => choose(parseChord(s))}>{s}</button>)}</div><div className="aside-footnote">学习顺序<br /><strong>构成音 → 转位 → 伴奏 → 连接</strong></div></aside></div>
      <details id="help" className="help-panel"><summary>关于和序 · Chordflow 与本地数据</summary><p>从和弦开始，弹出自己的伴奏。From chords to accompaniment.</p><p>C4 = MIDI 60，A4 = 440 Hz。当前使用 Web Audio 合成键盘音，无采样加载。音频需点击解锁；静音时检查下方音量与设备音量。琴键可通过 Tab 聚焦、Enter 或 Space 弹奏。</p><p>教学内容为原创教学示例。指法因手型和连接而异。没有 MIDI 或麦克风识别，不测量正确率。数据仅在当前浏览器保存，不自动跨设备同步。</p></details>
    </main>
    <PlaybackBar practice={page !== 'explore'} snapshot={playback} options={options} onOptions={next => { stop(); setOptions(next) }} onPlay={() => page === 'explore' ? preview('block') : playPractice()} onStop={stop} volume={volume} onVolume={setVolume} status={audioStatus} disabled={page !== 'explore' && !timeline} />
    </div></div>
}
