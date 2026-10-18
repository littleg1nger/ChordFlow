import { PATTERNS, type PatternId } from '../data/patterns'
import { PROGRESSIONS, type ProgressionId } from '../data/progressions'
import { parseChord, pitch } from '../music/theory'
import { progressionChords } from '../music/progressions'
import { compatible } from '../music/patterns'
import type { PlaybackOptions } from '../audio/transport'

export const STORAGE_KEY = 'chordflow:v1'
export const MAX_BACKUP_BYTES = 1_048_576
export type PracticeConfig = PlaybackOptions & { progression: ProgressionId; tonic: string; pattern: PatternId; register: number; voicing: 'root' | 'smooth'; barsPerChord: number }
export type Settings = PracticeConfig & { chord: string; inversion: number; octave: number; autoRange:boolean; labels: 'notes' | 'degrees'; volume: number }
export type Exercise = { id: string; name: string; config: PracticeConfig; createdAt: string }
export type UserData = { format: 'chordflow-backup'; version: 1; settings: Settings; favorites: string[]; exercises: Exercise[]; stats: { seconds: number; completions: number } }

export function defaultData(): UserData {
  return { format: 'chordflow-backup', version: 1, settings: { chord: 'C', inversion: 0, octave: 2, autoRange:true, labels: 'notes', volume: 55, bpm: 72, hands: 'both', loops: 0, metronome: false, countIn: false, pattern: 'arp', register: 0, progression: 'pop', tonic: 'C', voicing: 'smooth', barsPerChord: 1 }, favorites: [], exercises: [], stats: { seconds: 0, completions: 0 } }
}
function object(value: unknown, label: string): Record<string,unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}应为对象。`)
  return value as Record<string,unknown>
}
function text(value: unknown, label: string, max = 80): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || [...value].some(c => c.charCodeAt(0)<32)) throw new Error(`${label}不是有效文本。`)
  return value
}
function number(value: unknown, min: number, max: number, label: string, integer = true): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || integer && !Number.isInteger(value)) throw new Error(`${label}超出有效范围。`)
  return value
}
function choice<T extends string | number>(value: unknown, values: readonly T[], label: string): T {
  if (!values.includes(value as T)) throw new Error(`${label}不是支持的选项。`)
  return value as T
}
function boolean(value: unknown, label: string) { if (typeof value !== 'boolean') throw new Error(`${label}应为布尔值。`); return value }
export function validateConfig(value: unknown): PracticeConfig {
  const v = object(value,'练习设置')
  const progression = choice(v.progression,PROGRESSIONS.map(p => p.id) as ProgressionId[],'和弦进行')
  const tonic = pitch(text(v.tonic,'主音',4)).name
  progressionChords(progression,tonic)
  return {
    progression, tonic,
    pattern: choice(v.pattern,PATTERNS.map(p => p.id),'伴奏音型'),
    bpm: number(v.bpm,40,160,'速度'),
    hands: choice(v.hands,['both','left','right'],'手别'),
    loops: choice(v.loops,[0,1,2,4,8],'循环次数'),
    metronome: boolean(v.metronome,'节拍器'), countIn: boolean(v.countIn,'预备拍'),
    register: choice(v.register,[-1,0,1],'演奏音区'), voicing: choice(v.voicing,['root','smooth'],'右手配置'),
    barsPerChord: choice(v.barsPerChord,[1,2,4],'每和弦小节数'),
  }
}
export function validateData(value: unknown): UserData {
  const v = object(value,'备份')
  if (v.version !== 1 || v.format !== 'chordflow-backup') throw new Error('不支持此文件格式或版本；需要和序 v1 JSON 备份。')
  const settings = object(v.settings,'设置')
  const c = parseChord(text(settings.chord,'和弦',32))
  const config = validateConfig(settings)
  const inversion = number(settings.inversion,0,c.notes.length-1,'转位')
  if (c.bass && c.notes[inversion].pc !== c.bass.pc || !c.bass && inversion !== 0) throw new Error('和弦斜杠低音与转位不一致。')
  if (!Array.isArray(v.favorites) || v.favorites.length > 200) throw new Error('收藏最多 200 项。')
  const favorites = v.favorites.map(item => parseChord(text(item,'收藏和弦',32)).symbol)
  if (new Set(favorites).size !== favorites.length) throw new Error('收藏包含重复和弦。')
  if (!Array.isArray(v.exercises) || v.exercises.length > 100) throw new Error('个人练习最多 100 项。')
  const exercises = v.exercises.map(item => {
    const e = object(item,'个人练习')
    const createdAt = text(e.createdAt,'创建时间',40)
    if (!/^\d{4}-\d{2}-\d{2}T/.test(createdAt) || !Number.isFinite(Date.parse(createdAt))) throw new Error('创建时间无效。')
    const config=validateConfig(e.config)
    if(!progressionChords(config.progression,config.tonic).every(c => compatible(config.pattern,c))) throw new Error('个人练习中的音型与和弦不兼容。')
    return { id: text(e.id,'练习 ID',80), name: text(e.name,'练习名称',60), config, createdAt }
  })
  if (new Set(exercises.map(e => e.id)).size !== exercises.length) throw new Error('练习 ID 重复。')
  const stats = object(v.stats,'练习记录')
  return { format: 'chordflow-backup', version: 1,
    settings: { ...config, chord: c.symbol, inversion, octave: choice(settings.octave,[2,3,4],'键盘音区'), autoRange:settings.autoRange===undefined?true:boolean(settings.autoRange,'自动音区'),labels: choice(settings.labels,['notes','degrees'],'琴键标记'), volume: number(settings.volume,0,100,'音量') },
    favorites, exercises, stats: { seconds: number(stats.seconds,0,1e10,'实际练习秒数',false), completions: number(stats.completions,0,1e9,'完成轮次') },
  }
}
export function parseBackup(raw: string): UserData {
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error('文件超过 1 MB，请选择较小的和序 JSON 备份。')
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new Error('无法读取 JSON，请选择完整的和序备份文件。') }
  return validateData(parsed)
}
export function loadData(storage: Pick<Storage,'getItem'>): { data: UserData; warning: string } {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return { data: raw ? parseBackup(raw) : defaultData(), warning: '' }
  } catch (e) { return { data: defaultData(), warning: `本地数据未能恢复：${(e as Error).message} 已使用默认设置；原始值暂保留，后续操作会覆盖，请先备份。` } }
}
export function saveData(storage: Pick<Storage,'setItem'>, data: UserData) {
  storage.setItem(STORAGE_KEY,JSON.stringify(data))
}
export function practiceConfig(settings: Settings): PracticeConfig {
  return validateConfig(settings)
}
