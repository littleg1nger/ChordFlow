import { useEffect, useRef, useState } from 'react'
import { audio } from './audio/engine'
import { Icon } from './components/Icon'
import { Piano } from './components/Piano'
import { Explorer, type AuditionMode } from './features/Explorer'
import { leftBass, parseChord, voicing, type Chord } from './music/theory'

export default function App() {
  const [current, setCurrent] = useState(() => parseChord('C'))
  const [inversion, setInversion] = useState(0)
  const [octave, setOctave] = useState(2)
  const [labels, setLabels] = useState<'notes' | 'degrees'>('notes')
  const [active, setActive] = useState<number[]>([])
  const [audioStatus, setAudioStatus] = useState('点击试听以开启声音')
  const [volume, setVolume] = useState(55)
  const [hands, setHands] = useState('both')
  const [favorites, setFavorites] = useState<string[]>([])
  const generation = useRef(0)
  const right = voicing(current, inversion, 55)
  const bass = leftBass(current)
  const stop = () => { generation.current++; audio.stopAll() }
  const choose = (c: Chord, inv = 0) => { stop(); setCurrent(c); setInversion(inv) }
  async function preview(mode: AuditionMode) {
    stop()
    const token = generation.current
    try {
      setAudioStatus('正在开启音频…')
      await audio.unlock()
      if (token !== generation.current) return
      setAudioStatus('音频已开启 · 合成键盘音')
      let notes = hands === 'left' ? [bass] : hands === 'right' ? right : [bass, ...right]
      if (mode === 'down') notes = [...notes].sort((a, b) => b.midi - a.midi)
      else notes = [...notes].sort((a, b) => a.midi - b.midi)
      notes.forEach((n, i) => audio.note(n.midi, audio.now + (mode === 'block' ? 0 : i * 0.3), 1.1))
    } catch (e) { setAudioStatus(`音频失败，可点击重试：${(e as Error).message}`) }
  }
  async function playNote(midi: number) {
    try { await audio.unlock(); audio.note(midi); setAudioStatus('音频已开启 · 合成键盘音') }
    catch { setAudioStatus('音频失败，请检查浏览器音频权限并重试。') }
  }
  useEffect(() => {
    let frame = 0
    const update = () => {
      const next = [...new Set(audio.activeNotes())].sort((a, b) => a - b)
      setActive(old => old.join(',') === next.join(',') ? old : next)
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    const hide = () => { if (document.hidden) { generation.current++; audio.stopAll() } }
    document.addEventListener('visibilitychange', hide)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', hide); audio.stopAll() }
  }, [])
  useEffect(() => { audio.setVolume(volume / 100) }, [volume])

  return <div className="app-shell">
    <a className="skip-link" href="#workspace">跳到练习区</a>
    <aside className="sidebar"><a className="brand" href="#"><span className="brand-mark"><Icon name="keys" size={25} /></span><span><strong>和序</strong><small>Chordflow</small></span></a><p className="nav-caption">你的钢琴学习手册</p><nav aria-label="主导航"><button className="active"><Icon name="keys" />和弦探索<span>01</span></button><button disabled><Icon name="pattern" />伴奏音型<span>02</span></button><button disabled><Icon name="flow" />和弦进行<span>03</span></button><button disabled><Icon name="book" />我的练习<span>04</span></button></nav><div className="sidebar-bottom"><div className="mini-keyboard"><i /><i /><i /><i /><i /><i /><i /></div><p>每天一点，<br />让双手慢慢熟悉。</p><span>从和弦开始，弹出自己的伴奏。</span><button className="help-link" onClick={() => document.getElementById('help')?.scrollIntoView({ behavior: 'smooth' })}><Icon name="help" size={17} />使用与学习说明</button></div></aside>
    <div className="main-shell"><header className="topbar"><span>学习手册 <span className="slash">/</span> <strong>和弦探索</strong></span><span className="local-badge"><i />本地练习 · 无需登录</span></header>
    <main id="workspace" tabIndex={-1}><div className="page-heading"><div><span className="eyebrow">CHORD EXPLORER</span><h1>和弦探索<span className="heading-dot">.</span></h1><p>从一个和弦出发，听见音符之间的关系。</p></div><div className="chapter-stamp">认识和弦<br /><strong>听 · 看 · 弹</strong></div></div>
      <div className="workspace-grid"><section className="workspace-panel" aria-label="和弦学习"><Explorer current={current} right={right} bass={bass} inversion={inversion} onChoose={choose} onPreview={preview} onStop={stop} favorite={favorites.includes(current.symbol)} onFavorite={() => setFavorites(old => old.includes(current.symbol) ? old.filter(s => s !== current.symbol) : [...old, current.symbol])} />
        <div className="keyboard-heading"><h3>把声音放到琴键上</h3><div className="keyboard-controls"><label>音区<select aria-label="键盘起始音区" value={octave} onChange={e => { stop(); setOctave(Number(e.target.value)) }}><option value={2}>C2–C5</option><option value={3}>C3–C6</option><option value={4}>C4–C7</option></select></label><label>标记<select aria-label="琴键标记" value={labels} onChange={e => setLabels(e.target.value as 'notes' | 'degrees')}><option value="notes">音名</option><option value="degrees">相对度数</option></select></label></div></div>
        <Piano chord={current} right={right} bass={bass} active={active} octave={octave} labels={labels} onNote={playNote} />
        <div className="keyboard-legend"><span><i className="legend-root" />根音</span><span><i className="legend-right" />右手</span><span><i className="legend-left" />左手低音</span><span>● 正在发声</span><span>点击琴键，或聚焦后按回车</span></div>
      </section><aside className="study-aside"><span className="eyebrow">练琴小记</span><h2>先听清，<br />再连起来。</h2><p>一次只改变一件事。先比较大三与小三，再听同一个和弦的不同转位。</p><div className="aside-rule" /><h3>一个小练习</h3><p>弹 C → Am → F → G。找到它们共有的音，试着让右手少移动一点。</p><div className="quick-chords">{['C', 'Am', 'F', 'G'].map(s => <button key={s} onClick={() => choose(parseChord(s))}>{s}</button>)}</div><div className="aside-footnote">学习顺序<br /><strong>构成音 → 转位 → 伴奏 → 连接</strong></div></aside></div>
      <details id="help" className="help-panel"><summary>关于和序 · Chordflow 与本地数据</summary><p>从和弦开始，弹出自己的伴奏。From chords to accompaniment.</p><p>C4 = MIDI 60，A4 = 440 Hz。当前使用 Web Audio 合成键盘音，无采样加载。音频需点击解锁；静音时检查下方音量与设备音量。琴键可通过 Tab 聚焦、Enter 或 Space 弹奏。</p><p>教学内容为原创教学示例。指法因手型和连接而异。没有 MIDI 或麦克风识别，不测量正确率。数据仅在当前浏览器保存，不自动跨设备同步。</p></details>
    </main>
    <footer className="transport"><div className="source-status"><span className="status-dot" /><div><strong>合成键盘音</strong><small role="status">{audioStatus}</small></div></div><div className="transport-center"><button className="round-play" onClick={() => preview('block')} aria-label="试听当前和弦"><Icon name="play" size={18} /></button><button className="icon-button" onClick={stop} aria-label="停止"><Icon name="stop" size={17} /></button><div className="field inline"><label htmlFor="hands">手别</label><select id="hands" value={hands} onChange={e => { stop(); setHands(e.target.value) }}><option value="both">双手</option><option value="left">仅左手</option><option value="right">仅右手</option></select></div></div><div className="volume-control"><button className="icon-button" aria-label={volume === 0 ? '取消静音' : '静音'} onClick={() => setVolume(volume === 0 ? 55 : 0)}><Icon name="volume" size={18} /></button><input aria-label="主音量" type="range" min="0" max="100" value={volume} onChange={e => setVolume(Number(e.target.value))} /></div></footer>
    </div></div>
}
