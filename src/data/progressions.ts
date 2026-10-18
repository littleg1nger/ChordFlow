import type { ChordType } from './chords'

type ProgressionSpec = { id: string; name: string; mode: 'major' | 'minor'; defaultTonic: string; degrees: number[]; types: ChordType[]; romans: string[]; feeling: string; tip: string; source: string }
export const PROGRESSIONS: ProgressionSpec[] = [
  { id: 'pop', name: '流行四和弦', mode: 'major', defaultTonic: 'C', degrees: [1,5,6,4], types: ['major','major','minor','major'], romans: ['I','V','vi','IV'], feeling: '明亮出发，经过内敛，再回到开阔。', tip: '先用柱式听清每次换和弦，再用上下行分解保持八分音符的连贯。', source: '原创教学示例' },
  { id: 'classic', name: '温暖的循环', mode: 'major', defaultTonic: 'C', degrees: [1,6,4,5], types: ['major','minor','major','major'], romans: ['I','vi','IV','V'], feeling: '平稳、温暖，末尾的属和弦期待回到开头。', tip: '寻找相邻和弦的共同音；先把速度放到 60 BPM。', source: '原创教学示例' },
  { id: 'jazz', name: 'ii–V–I 的落点', mode: 'major', defaultTonic: 'C', degrees: [2,5,1], types: ['minorSeven','seven','majorSeven'], romans: ['ii7','V7','Imaj7'], feeling: '从流动与张力走向舒展的主和弦。', tip: '四音和弦完整保留七音；使用柱式、根五八或三拍子。', source: '原创教学示例' },
  { id: 'minor', name: '小调的叙述', mode: 'minor', defaultTonic: 'A', degrees: [1,6,3,7], types: ['minor','major','major','major'], romans: ['i','VI','III','VII'], feeling: '自然小调的沉静色彩，带着开阔的上行感。', tip: '这是自然小调进行。移调保持小调体系，不把主音改动混同于切换调式。', source: '原创教学示例' },
  { id: 'canon', name: '卡农进行', mode: 'major', defaultTonic: 'D', degrees: [1,5,6,3,4,1,4,5], types: ['major','major','minor','minor','major','major','major','major'], romans: ['I','V','vi','iii','IV','I','IV','V'], feeling: '八个和弦首尾相连，在熟悉的循环里逐步增加流动。', tip: '这里演示卡农常见的和声骨架，默认 D 大调，可移调到 C。分解与加花是原创教学编配，不是原曲完整旋律或原版配器。', source: '经典和声骨架；原创教学编配' },
  { id: '4536251', name: '4536251 进行', mode: 'major', defaultTonic: 'C', degrees: [4,5,3,6,2,5,1], types: ['major','major','minor','minor','minor','major','major'], romans: ['IV','V','iii','vi','ii','V','I'], feeling: '从下属出发，经过三、六、二级，最后落回主和弦。', tip: '数字指调内和弦级数，不是手指或节奏。本例第三个和弦用调内 Em；E7 等副属变体属于不同版本，不在此例暗中替换。', source: '原创教学示例' },
  { id: 'turnaround', name: '爵士 1625 回转', mode: 'major', defaultTonic: 'C', degrees: [1,6,2,5], types: ['majorSeven','minorSeven','minorSeven','seven'], romans: ['Imaj7','vi7','ii7','V7'], feeling: '七和弦带出温和色彩，属七把下一轮重新引向主和弦。', tip: '用四音分解听清七音，再比较原位与平稳连接。这里 vi7 用调内小七，不替换成副属七。', source: '原创教学示例' },
]
export type ProgressionId = 'pop' | 'classic' | 'jazz' | 'minor' | 'canon' | '4536251' | 'turnaround'
