import { frequency } from '../music/theory'

type Voice = { oscillators: OscillatorNode[]; gain: GainNode; start: number; end: number; midi: number }

/** One shared context and output graph; no remote samples or autonomous sound. */
export class AudioEngine {
  private context?: AudioContext
  private master?: GainNode
  private voices = new Set<Voice>()
  private volume = 0.55
  get state() { return this.context?.state ?? 'locked' }
  get now() { return this.context?.currentTime ?? 0 }

  async unlock() {
    if (!this.context || this.context.state === 'closed') {
      this.context = new AudioContext({ latencyHint: 'interactive' })
      this.master = this.context.createGain()
      this.master.gain.value = this.volume * 0.22
      const limiter = this.context.createDynamicsCompressor()
      limiter.threshold.value = -15
      limiter.knee.value = 12
      limiter.ratio.value = 8
      this.master.connect(limiter)
      limiter.connect(this.context.destination)
    }
    if (this.context.state !== 'running') await this.context.resume()
    if (this.context.state !== 'running') throw new Error('音频未能启动，请检查浏览器权限后重试。')
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.volume * 0.22, this.now, 0.02)
  }

  note(midi: number, when = this.now, duration = 0.8, velocity = 0.7, click = false) {
    const ctx = this.context
    if (!ctx || !this.master || ctx.state !== 'running') return
    if (this.voices.size > 96) return
    const start = Math.max(when, ctx.currentTime)
    const end = start + Math.max(0.04, duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * (click ? 0.25 : 0.65)), start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    gain.connect(this.master)
    const oscillators = (click ? [1] : [1, 2]).map((partial, i) => {
      const osc = ctx.createOscillator()
      const partialGain = ctx.createGain()
      osc.type = i === 0 && !click ? 'triangle' : 'sine'
      osc.frequency.value = frequency(midi) * partial
      partialGain.gain.value = i === 0 ? 0.8 : 0.18
      osc.connect(partialGain)
      partialGain.connect(gain)
      osc.start(start)
      osc.stop(end + 0.02)
      osc.onended = () => { osc.disconnect(); partialGain.disconnect() }
      return osc
    })
    const voice = { oscillators, gain, start, end, midi: click ? -1 : midi }
    this.voices.add(voice)
    oscillators[0].addEventListener('ended', () => { gain.disconnect(); this.voices.delete(voice) }, { once: true })
  }

  activeNotes(): number[] {
    return [...this.voices].filter(v => v.start <= this.now && v.end > this.now && v.midi >= 0).map(v => v.midi)
  }

  stopAll() {
    const now = this.now
    for (const v of this.voices) {
      v.gain.gain.cancelScheduledValues(now)
      v.gain.gain.setValueAtTime(0, now)
      for (const osc of v.oscillators) { try { osc.stop(now) } catch { /* Already ended. */ } }
      v.gain.disconnect()
    }
    this.voices.clear()
  }
}

export const audio = new AudioEngine()
