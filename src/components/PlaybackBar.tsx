import { Icon } from './Icon'
import { useEffect,useState } from 'react'
import type { PlaybackOptions, PlaybackSnapshot } from '../audio/transport'
type Props = { practice: boolean; snapshot: PlaybackSnapshot; options: PlaybackOptions; onOptions: (next: PlaybackOptions) => void; onPlay: () => void; onStop: () => void; volume: number; onVolume: (n: number) => void; status: string; disabled: boolean }
export function PlaybackBar({ practice,snapshot,options,onOptions,onPlay,onStop,volume,onVolume,status,disabled }: Props) {
  const playing = snapshot.status === 'playing'
  const [bpmDraft,setBpmDraft]=useState(String(options.bpm))
  useEffect(() => {setBpmDraft(String(options.bpm))},[options.bpm])
  return <footer className="transport"><div className="source-status"><span className="status-dot" /><div><strong>合成键盘音</strong><small role="status">{status}</small></div></div>
    <div className="transport-center"><button className="round-play" disabled={disabled || snapshot.status === 'loading'} onClick={onPlay} aria-label={!practice ? '试听当前和弦' : playing ? '暂停练习' : snapshot.status === 'paused' ? '继续练习' : '播放练习'}><Icon name={playing && practice ? 'pause' : 'play'} size={18} /></button><button className="icon-button" onClick={onStop} aria-label="停止"><Icon name="stop" size={17} /></button>
    {practice && <label className="bpm-control"><input aria-label="速度 BPM" type="number" min="40" max="160" value={bpmDraft} onChange={e => {setBpmDraft(e.target.value);const n=Number(e.target.value);if(Number.isInteger(n)&&n>=40&&n<=160)onOptions({...options,bpm:n})}} onBlur={() => {const n=Number(bpmDraft);const bpm=bpmDraft&&Number.isFinite(n)?Math.max(40,Math.min(160,Math.round(n))):options.bpm;setBpmDraft(String(bpm));if(bpm!==options.bpm)onOptions({...options,bpm})}} onKeyDown={e => {if(e.key==='Enter')e.currentTarget.blur()}}/><span>BPM</span></label>}
    <div className="field inline"><label htmlFor="hands">手别</label><select id="hands" aria-label="播放手别" value={options.hands} onChange={e => onOptions({...options,hands:e.target.value as PlaybackOptions['hands']})}><option value="both">双手</option><option value="left">仅左手</option><option value="right">仅右手</option></select></div>
    {practice && <><label className="loop-control"><span>循环</span><select aria-label="循环次数" value={options.loops} onChange={e => onOptions({...options,loops:Number(e.target.value)})}><option value={0}>持续</option>{[1,2,4,8].map(n => <option value={n} key={n}>{n} 次</option>)}</select></label><button className={`toggle ${options.metronome ? 'is-on' : ''}`} aria-pressed={options.metronome} onClick={() => onOptions({...options,metronome:!options.metronome})}>节拍器</button><button className={`toggle ${options.countIn ? 'is-on' : ''}`} aria-pressed={options.countIn} onClick={() => onOptions({...options,countIn:!options.countIn})}>预备拍</button></>}
    </div><div className="volume-control"><button className="icon-button" aria-label={volume === 0 ? '取消静音' : '静音'} onClick={() => onVolume(volume === 0 ? 55 : 0)}><Icon name="volume" size={18} /></button><input aria-label="主音量" type="range" min="0" max="100" value={volume} onChange={e => onVolume(Number(e.target.value))} /></div>
  </footer>
}
