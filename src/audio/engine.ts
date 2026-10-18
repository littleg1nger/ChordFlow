import { frequency } from '../music/theory'
import { nearestSample,PIANO_SAMPLES,type SampleState } from './samples'

type Voice = { sources: (OscillatorNode|AudioBufferSourceNode)[]; gain: GainNode; start: number; end: number; midi: number }

/** Shared context, local recorded piano buffers and an explicit synthesis fallback. */
export class AudioEngine {
  private context?: AudioContext
  private master?: GainNode
  private voices = new Set<Voice>()
  private buffers = new Map<number,AudioBuffer>()
  private loading?: Promise<void>
  private listeners=new Set<() => void>()
  private volume = 0.55
  sampleState: SampleState={status:'idle',loaded:0,total:PIANO_SAMPLES.length,message:'首次点击加载本地钢琴采样'}
  subscribe=(fn:() => void) => {this.listeners.add(fn);return () => {this.listeners.delete(fn)}}
  getSnapshot=() => this.sampleState
  get sourceName() {return this.sampleState.status==='ready'?'Salamander 采样钢琴':this.sampleState.status==='fallback'?'合成音 · 采样降级':'Salamander 钢琴'}
  get state() { return this.context?.state ?? 'locked' }
  get now() { return this.context?.currentTime ?? 0 }
  private publish(next: SampleState) {this.sampleState=next;this.listeners.forEach(fn=>fn())}

  async unlock() {
    if (!this.context || this.context.state === 'closed') {
      this.context = new AudioContext({ latencyHint: 'interactive' })
      this.buffers.clear();this.loading=undefined
      this.publish({status:'idle',loaded:0,total:PIANO_SAMPLES.length,message:'首次点击加载本地钢琴采样'})
      this.master = this.context.createGain()
      this.master.gain.value = this.volume * 0.28
      const limiter = this.context.createDynamicsCompressor()
      limiter.threshold.value = -15
      limiter.knee.value = 12
      limiter.ratio.value = 8
      this.master.connect(limiter)
      limiter.connect(this.context.destination)
    }
    // Resume synchronously from the gesture, before awaiting fetch/decode.
    if (this.context.state !== 'running') await this.context.resume()
    if (this.context.state !== 'running') throw new Error('音频未能启动，请检查浏览器权限后重试。')
    if(this.sampleState.status==='idle' || this.sampleState.status==='loading')await this.prepareSamples()
  }
  private prepareSamples(): Promise<void> {
    if(this.loading)return this.loading
    const context=this.context!
    this.publish({status:'loading',loaded:0,total:PIANO_SAMPLES.length,message:'正在加载本地采样…'})
    this.loading=(async () => {
      const buffers=new Map<number,AudioBuffer>()
      let cursor=0
      try {
        const results=await Promise.allSettled(Array.from({length:5},async () => {
          while(cursor<PIANO_SAMPLES.length) {
            const sample=PIANO_SAMPLES[cursor++]
            const response=await fetch(sample.url,{signal:AbortSignal.timeout(12000)})
            if(!response.ok)throw new Error(`HTTP ${response.status}`)
            const buffer=await context.decodeAudioData(await response.arrayBuffer())
            if(buffer.duration<=0)throw new Error('采样音频无效')
            buffers.set(sample.midi,buffer)
            if(this.context===context && this.sampleState.status==='loading')this.publish({status:'loading',loaded:buffers.size,total:PIANO_SAMPLES.length,message:'正在加载本地采样…'})
          }
        }))
        if(results.some(result=>result.status==='rejected'))throw new Error('Some samples failed')
        if(this.context!==context)return
        this.buffers=buffers
        this.publish({status:'ready',loaded:buffers.size,total:PIANO_SAMPLES.length,message:'30 个本地采样已就绪'})
      }catch {
        if(this.context===context)this.publish({status:'fallback',loaded:buffers.size,total:PIANO_SAMPLES.length,message:'钢琴采样加载失败，已切换合成音；可重试加载。'})
      }
    })().finally(()=>{if(this.context===context)this.loading=undefined})
    return this.loading
  }
  async retrySamples() {
    await this.unlock()
    if(this.sampleState.status==='ready')return
    if(this.loading)await this.loading
    await this.prepareSamples()
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.volume * 0.28, this.now, 0.02)
  }
  private track(voice: Voice) {
    this.voices.add(voice)
    voice.sources[0].addEventListener('ended',()=>{voice.gain.disconnect();this.voices.delete(voice)},{once:true})
  }
  note(midi: number, when = this.now, duration = 0.8, velocity = 0.7, click = false) {
    const ctx = this.context
    if (!ctx || !this.master || ctx.state !== 'running' || !Number.isInteger(midi) || midi<21 || midi>108 || this.voices.size>=128)return
    const start=Math.max(when,ctx.currentTime)
    const held=Math.max(.04,duration)
    const gain=ctx.createGain()
    gain.connect(this.master)
    if(!click && this.sampleState.status==='ready') {
      const sample=nearestSample(midi)
      const source=ctx.createBufferSource()
      source.buffer=this.buffers.get(sample.midi)!
      source.playbackRate.value=sample.rate
      const end=start+Math.min(held+.22,source.buffer.duration/sample.rate)
      const release=Math.min(start+held,end-.005)
      const level=Math.max(.001,Math.min(1,velocity)**1.3*1.15)
      gain.gain.setValueAtTime(0,start)
      gain.gain.linearRampToValueAtTime(level,start+.004)
      gain.gain.setValueAtTime(level,Math.max(start+.004,release))
      gain.gain.exponentialRampToValueAtTime(.0001,end)
      source.connect(gain);source.start(start);source.stop(end)
      source.onended=()=>source.disconnect()
      this.track({sources:[source],gain,start,end,midi})
      return
    }
    const end=start+held
    gain.gain.setValueAtTime(.0001,start)
    gain.gain.exponentialRampToValueAtTime(Math.max(.001,velocity*(click?.25:.65)),start+.008)
    gain.gain.exponentialRampToValueAtTime(.0001,end)
    const sources=(click?[1]:[1,2]).map((partial,i)=>{
      const osc=ctx.createOscillator()
      const partialGain=ctx.createGain()
      osc.type=i===0&&!click?'triangle':'sine';osc.frequency.value=frequency(midi)*partial
      partialGain.gain.value=i===0?.8:.18
      osc.connect(partialGain);partialGain.connect(gain)
      osc.start(start);osc.stop(end+.02)
      osc.onended=()=>{osc.disconnect();partialGain.disconnect()}
      return osc
    })
    this.track({sources,gain,start,end,midi:click?-1:midi})
  }
  activeNotes(): number[] {
    return [...this.voices].filter(v => v.start<=this.now && v.end>this.now && v.midi>=0).map(v=>v.midi)
  }
  stopAll() {
    const now=this.now
    for(const v of this.voices) {
      v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(0,now)
      for(const source of v.sources)try{source.stop(now)}catch{/* Already ended. */}
      v.gain.disconnect()
    }
    this.voices.clear()
  }
}

export const audio=new AudioEngine()
