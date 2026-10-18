import { PPQ, type Timeline } from '../music/patterns'
import { audio } from './engine'

export type PlaybackOptions = { bpm: number; hands: 'both' | 'left' | 'right'; loops: number; metronome: boolean; countIn: boolean }
export type PlaybackSnapshot = { status: 'stopped' | 'loading' | 'playing' | 'paused' | 'finished'; tick: number; cycle: number; absoluteTick: number }
type Engine = Pick<typeof audio, 'now' | 'unlock' | 'note' | 'stopAll'>
type Frame = (fn: FrameRequestCallback) => number

/** AudioContext time is authoritative; animation frames only fill a look-ahead window. */
export class Transport {
  snapshot: PlaybackSnapshot = { status: 'stopped', tick: 0, cycle: 0, absoluteTick: 0 }
  private timeline?: Timeline
  private options: PlaybackOptions = { bpm: 72, hands: 'both', loops: 1, metronome: false, countIn: false }
  private listeners = new Set<(s: PlaybackSnapshot) => void>()
  private anchor = 0
  private position = 0
  private frameId = 0
  private generation = 0
  private scheduled = new Set<string>()
  private accounted = 0
  private recordedCycles = 0
  private firstFullCycle = 0
  onRecord?: (seconds: number, completions: number) => void

  constructor(private engine: Engine = audio, private frame: Frame = fn => requestAnimationFrame(fn), private cancel: (id: number) => void = id => cancelAnimationFrame(id)) {}
  subscribe = (fn: (s: PlaybackSnapshot) => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private publish(status = this.snapshot.status) {
    const length = this.timeline?.ticks ?? 1920
    const formal = Math.max(0, this.position)
    this.snapshot = { status, tick: this.position < 0 ? this.position : formal % length, cycle: Math.floor(formal / length), absoluteTick: this.position }
    this.listeners.forEach(fn => fn(this.snapshot))
  }
  get secondsPerTick() { return 60 / this.options.bpm / PPQ }
  private get totalTicks() { return (this.options.loops || Infinity) * (this.timeline?.ticks ?? 0) }
  private currentPosition() { return this.position + Math.max(0, this.engine.now - this.anchor) / this.secondsPerTick }
  load(timeline: Timeline, options: PlaybackOptions) {
    this.stop()
    this.timeline = timeline
    this.options = options
  }
  async play() {
    if (!this.timeline || this.snapshot.status === 'playing' || this.snapshot.status === 'loading') return
    if (this.snapshot.status === 'finished' || this.snapshot.status === 'stopped') {
      this.position = this.options.countIn ? -this.timeline.beats * PPQ : 0
      this.accounted = this.position
      this.recordedCycles = 0
      this.firstFullCycle = 0
    }
    const token = ++this.generation
    this.publish('loading')
    try { await this.engine.unlock() }
    catch (e) { if (token === this.generation) this.publish('paused'); throw e }
    if (token !== this.generation) return
    this.scheduled.clear()
    this.anchor = this.engine.now + 0.035
    this.publish('playing')
    this.schedule(this.position, this.position, true)
    this.update()
  }
  private schedule(from: number, to: number, resume = false) {
    const t = this.timeline
    if (!t) return
    const minCycle = Math.max(0, Math.floor(from / t.ticks))
    const maxCycle = Math.max(0, Math.floor(to / t.ticks))
    for (let cycle = minCycle; cycle <= maxCycle; cycle++) {
      if (this.options.loops && cycle >= this.options.loops) continue
      t.events.forEach((event, index) => {
        if (this.options.hands === 'left' && event.hand !== 'L' || this.options.hands === 'right' && event.hand !== 'R') return
        const tick = event.tick + cycle * t.ticks
        const key = `${cycle}:${index}`
        const spanning = resume && tick < from && tick + event.duration > from
        if ((tick >= from - 0.001 && tick <= to || spanning) && !this.scheduled.has(key)) {
          const onset = Math.max(tick, from)
          const when = this.anchor + (onset - this.position) * this.secondsPerTick
          const duration = Math.max(0.03, (tick + event.duration - onset) * this.secondsPerTick * 0.94)
          event.notes.forEach(note => this.engine.note(note.midi, when, duration, event.velocity))
          this.scheduled.add(key)
        }
      })
    }
    for (let beat = Math.ceil(from / PPQ); beat * PPQ <= to; beat++) {
      const tick = beat * PPQ
      const key = `beat:${beat}`
      if (tick >= this.totalTicks || tick < 0 && !this.options.countIn || tick >= 0 && !this.options.metronome || this.scheduled.has(key)) continue
      this.engine.note(beat % t.beats === 0 ? 88 : 81, this.anchor + (tick - this.position) * this.secondsPerTick, 0.06, 0.7, true)
      this.scheduled.add(key)
    }
    // Bound memory during an indefinite practice loop.
    if (this.scheduled.size > 2000) {
      for (const key of this.scheduled) {
        const stale = key.startsWith('beat:') ? Number(key.slice(5)) * PPQ < from - t.ticks : Number(key.split(':')[0]) < minCycle - 1
        if (stale) this.scheduled.delete(key)
      }
    }
  }
  private report(tick: number, force = false) {
    const bounded = Math.max(0, Math.min(tick, this.totalTicks))
    const seconds = Math.max(0, bounded - Math.max(0, this.accounted)) * this.secondsPerTick
    const cycles = Math.max(0,Math.floor(bounded / (this.timeline?.ticks ?? 1920))-this.firstFullCycle)
    if (force || seconds >= 1 || cycles > this.recordedCycles) {
      this.onRecord?.(seconds, Math.max(0, cycles - this.recordedCycles))
      this.accounted = tick
      this.recordedCycles = cycles
    }
  }
  private update = () => {
    if (this.snapshot.status !== 'playing') return
    const now = this.currentPosition()
    this.report(now)
    if (now >= this.totalTicks) {
      this.report(this.totalTicks, true)
      this.position = this.totalTicks
      this.engine.stopAll()
      this.publish('finished')
      return
    }
    this.schedule(now, Math.min(this.totalTicks - 0.001, now + 0.12 / this.secondsPerTick))
    const saved = this.position
    this.position = now
    this.publish('playing')
    this.position = saved
    this.frameId = this.frame(this.update)
  }
  pause() {
    if (this.snapshot.status !== 'playing' && this.snapshot.status !== 'loading') return
    if (this.snapshot.status === 'playing') this.position = Math.min(this.currentPosition(), this.totalTicks)
    this.report(this.position, true)
    this.generation++
    this.cancel(this.frameId)
    this.engine.stopAll()
    this.publish('paused')
  }
  stop() {
    if (this.snapshot.status === 'playing') this.report(this.currentPosition(), true)
    this.generation++
    this.cancel(this.frameId)
    this.engine.stopAll()
    this.position = 0
    this.accounted = 0
    this.recordedCycles = 0
    this.firstFullCycle = 0
    this.scheduled.clear()
    this.publish('stopped')
  }
  seek(tick: number) {
    this.pause()
    this.position = Math.max(0, Math.min(tick, (this.timeline?.ticks ?? 1920) - 1))
    this.accounted = this.position
    this.firstFullCycle = this.position > 0 ? 1 : 0
    this.recordedCycles = 0
    this.publish('paused')
  }
}

export const transport = new Transport()
