import type { ChordType } from './chords'

type ProgressionSpec = { id: string; name: string; mode: 'major' | 'minor'; defaultTonic: string; degrees: number[]; types: ChordType[]; romans: string[]; feeling: string; tip: string; source: string }
export const PROGRESSIONS: ProgressionSpec[] = [
  { id: 'pop', name: '流行四和弦', mode: 'major', defaultTonic: 'C', degrees: [1,5,6,4], types: ['major','major','minor','major'], romans: ['I','V','vi','IV'], feeling: '明亮出发，经过内敛，再回到开阔。', tip: '先用柱式听清每次换和弦，再用上下行分解保持八分音符的连贯。', source: '原创教学示例' },
  { id: 'classic', name: '温暖的循环', mode: 'major', defaultTonic: 'C', degrees: [1,6,4,5], types: ['major','minor','major','major'], romans: ['I','vi','IV','V'], feeling: '平稳、温暖，末尾的属和弦期待回到开头。', tip: '寻找相邻和弦的共同音；先把速度放到 60 BPM。', source: '原创教学示例' },
  { id: 'jazz', name: 'ii–V–I 的落点', mode: 'major', defaultTonic: 'C', degrees: [2,5,1], types: ['minorSeven','seven','majorSeven'], romans: ['ii7','V7','Imaj7'], feeling: '从流动与张力走向舒展的主和弦。', tip: '四音和弦完整保留七音；使用柱式、根五八或三拍子。', source: '原创教学示例' },
  { id: 'minor', name: '小调的叙述', mode: 'minor', defaultTonic: 'A', degrees: [1,6,3,7], types: ['minor','major','major','major'], romans: ['i','VI','III','VII'], feeling: '自然小调的沉静色彩，带着开阔的上行感。', tip: '这是自然小调进行。移调保持小调体系，不把主音改动混同于切换调式。', source: '原创教学示例' },
]
export type ProgressionId = 'pop' | 'classic' | 'jazz' | 'minor'
