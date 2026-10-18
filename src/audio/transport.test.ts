import { expect, it, vi } from 'vitest'
import { Transport } from './transport'
import { patternTimeline } from '../music/patterns'
import { parseChord } from '../music/theory'

function setup(countIn = false, loops = 1) {
  const engine = { now: 0, unlock: vi.fn(async () => {}), note: vi.fn(), stopAll: vi.fn() }
  let frame: FrameRequestCallback = () => {}
  const player = new Transport(engine, fn => { frame = fn; return 1 }, () => {})
  player.load(patternTimeline(parseChord('C'), 'arp'), { bpm: 60, hands: 'right', loops, metronome: true, countIn })
  const advance = (seconds: number) => { engine.now += seconds; frame(0) }
  return { engine, player, advance }
}
it('基于音频时钟调度，暂停不前进，继续从同一 tick 开始', async () => {
  const { engine, player, advance } = setup()
  await player.play()
  advance(0.535)
  expect(player.snapshot.tick).toBeCloseTo(240)
  player.pause()
  const tick = player.snapshot.tick
  advance(3)
  expect(player.snapshot.tick).toBe(tick)
  await player.play()
  advance(0.535)
  expect(player.snapshot.tick).toBeCloseTo(tick + 240)
  expect(engine.note.mock.calls.some(c => c[0] === 64)).toBe(true)
  player.stop()
  expect(player.snapshot.tick).toBe(0)
  expect(engine.stopAll).toHaveBeenCalled()
})
it('重复播放不会开多个会话，停止能取消等待中的解锁', async () => {
  const { engine, player } = setup()
  let resolve: () => void = () => {}
  engine.unlock.mockImplementation(() => new Promise<void>(r => { resolve = r }))
  const pending = player.play()
  void player.play()
  expect(engine.unlock).toHaveBeenCalledTimes(1)
  player.stop()
  resolve()
  await pending
  expect(player.snapshot.status).toBe('stopped')
  expect(engine.note).not.toHaveBeenCalled()
})
it('预备拍不计入练习时间，有限循环正确结束', async () => {
  const { player, advance } = setup(true, 2)
  const record = vi.fn()
  player.onRecord = record
  await player.play()
  advance(3)
  player.pause()
  expect(record.mock.calls.reduce((sum,c) => sum+c[0],0)).toBe(0)
  await player.play()
  advance(9.2)
  expect(player.snapshot.status).toBe('finished')
  expect(record.mock.calls.reduce((sum,c) => sum+c[0],0)).toBeCloseTo(8)
  expect(record.mock.calls.reduce((sum,c) => sum+c[1],0)).toBe(2)
})
it('左右手筛选与停止重置', async () => {
  const { engine, player } = setup()
  await player.play()
  expect(engine.note.mock.calls.filter(c => !c[4]).every(c => c[0] >= 60)).toBe(true)
  player.stop()
  expect(player.snapshot).toMatchObject({ status: 'stopped', tick: 0, cycle: 0 })
})
it('从中途逐步定位后不能虚计完整轮次', async () => {
  const { player, advance }=setup(false,1)
  const record=vi.fn()
  player.onRecord=record
  player.seek(1440)
  await player.play()
  advance(1.1)
  expect(player.snapshot.status).toBe('finished')
  expect(record.mock.calls.reduce((sum,c) => sum+c[0],0)).toBeCloseTo(1)
  expect(record.mock.calls.reduce((sum,c) => sum+c[1],0)).toBe(0)
})
