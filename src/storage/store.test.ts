import { describe, expect, it } from 'vitest'
import { defaultData, loadData, parseBackup, saveData, STORAGE_KEY, validateData } from './store'

describe('有版本的本地数据边界', () => {
  it('设置、收藏、练习与真实统计往返', () => {
    const data = defaultData()
    data.favorites = ['C','Am','C/E']
    data.exercises = [{ id:'test', name:'慢练', config:data.settings, createdAt:new Date().toISOString() }]
    data.stats = { seconds: 12.34, completions: 2 }
    const memory = new Map<string,string>()
    const storage = { getItem:(k:string) => memory.get(k) ?? null, setItem:(k:string,v:string) => { memory.set(k,v) } }
    saveData(storage,data)
    expect(loadData(storage).data).toEqual(validateData(data))
    expect(parseBackup(memory.get(STORAGE_KEY)!)).toEqual(validateData(data))
  })
  it.each([
    (d: ReturnType<typeof defaultData>) => { d.version = 2 as 1 },
    (d: ReturnType<typeof defaultData>) => { d.settings.bpm = 1000 },
    (d: ReturnType<typeof defaultData>) => { d.settings.chord = 'C9' },
    (d: ReturnType<typeof defaultData>) => { d.stats.seconds = NaN },
    (d: ReturnType<typeof defaultData>) => { d.favorites = ['C','C'] },
    (d: ReturnType<typeof defaultData>) => { d.settings.inversion = 2 },
    (d: ReturnType<typeof defaultData>) => { d.settings.tonic = 'wrong' },
    (d: ReturnType<typeof defaultData>) => { d.settings.metronome = 'false' as unknown as boolean },
  ])('拒绝错误字段且不会部分写入', mutate => {
    const d = defaultData(); mutate(d)
    expect(() => validateData(d)).toThrow()
  })
  it('拒绝畸形 JSON、未知版本与大文件', () => {
    expect(() => parseBackup('{')).toThrow('JSON')
    expect(() => parseBackup('{"version":9}')).toThrow('版本')
    expect(() => parseBackup(' '.repeat(1_048_577))).toThrow('1 MB')
  })
  it('损坏或不可用的存储可恢复到内存默认值，不悄悄写回', () => {
    expect(loadData({getItem:() => '{'}).warning).toContain('默认设置')
    expect(loadData({getItem:() => { throw new Error('denied') }}).data.settings.chord).toBe('C')
  })
})
