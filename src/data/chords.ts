export const CHORD_TYPES = [
  { id: 'major', suffix: '', name: '大三和弦', degrees: ['1', '3', '5'], semitones: [0, 4, 7], feeling: '明亮、稳定，像一句话的落点。', use: '大调主和弦；先听根音与三度的距离。' },
  { id: 'minor', suffix: 'm', name: '小三和弦', degrees: ['1', 'b3', '5'], semitones: [0, 3, 7], feeling: '柔和、内敛，带一点沉静。', use: '小调主和弦，也常作大调中的 vi、ii、iii 级。' },
  { id: 'dim', suffix: 'dim', name: '减三和弦', degrees: ['1', 'b3', 'b5'], semitones: [0, 3, 6], feeling: '紧张、悬而未决。', use: '常作为连接和弦，聆听减五度的不稳定感。' },
  { id: 'aug', suffix: 'aug', name: '增三和弦', degrees: ['1', '3', '#5'], semitones: [0, 4, 8], feeling: '漂浮、带有推动感。', use: '适合短暂的色彩连接；先与大三和弦比较。' },
  { id: 'sus2', suffix: 'sus2', name: '挂二和弦', degrees: ['1', '2', '5'], semitones: [0, 2, 7], feeling: '通透、开放，没有三音。', use: '用二度代替三度，为伴奏留出空间。' },
  { id: 'sus4', suffix: 'sus4', name: '挂四和弦', degrees: ['1', '4', '5'], semitones: [0, 5, 7], feeling: '悬挂、期待落回三音。', use: '试着把四音下行到三音，听悬挂的解决。' },
  { id: 'six', suffix: '6', name: '大六和弦', degrees: ['1', '3', '5', '6'], semitones: [0, 4, 7, 9], feeling: '明亮而温暖。', use: '在大三和弦上加入六度，适合柔和的收尾。' },
  { id: 'minorSix', suffix: 'm6', name: '小六和弦', degrees: ['1', 'b3', '5', '6'], semitones: [0, 3, 7, 9], feeling: '沉静中带一点明亮。', use: '小三和弦加大六度；不要把六音误降半音。' },
  { id: 'seven', suffix: '7', name: '属七和弦', degrees: ['1', '3', '5', 'b7'], semitones: [0, 4, 7, 10], feeling: '有方向，期待解决。', use: '常见于 V7 → I；三音与七音决定其张力。' },
  { id: 'majorSeven', suffix: 'maj7', name: '大七和弦', degrees: ['1', '3', '5', '7'], semitones: [0, 4, 7, 11], feeling: '舒展、细腻。', use: '在大三和弦上加大七度，完整保留四个构成音。' },
  { id: 'minorSeven', suffix: 'm7', name: '小七和弦', degrees: ['1', 'b3', '5', 'b7'], semitones: [0, 3, 7, 10], feeling: '柔和、流动。', use: '常作大调 ii7，连接到 V7。' },
  { id: 'halfDim', suffix: 'm7b5', name: '半减七和弦', degrees: ['1', 'b3', 'b5', 'b7'], semitones: [0, 3, 6, 10], feeling: '含蓄而不稳定。', use: '小调 iiø7 常用配置；与减七和弦比较七音。' },
  { id: 'dimSeven', suffix: 'dim7', name: '减七和弦', degrees: ['1', 'b3', 'b5', 'bb7'], semitones: [0, 3, 6, 9], feeling: '密集、紧张，适合过渡。', use: '理论七音是减七度，例如 C 的 Bbb，不能写成 A 来替代理论解释。' },
  { id: 'addNine', suffix: 'add9', name: '加九和弦', degrees: ['1', '3', '5', '9'], semitones: [0, 4, 7, 14], feeling: '明亮、轻盈。', use: '大三和弦加九音，不自动加入七音。' },
] as const

export type ChordType = typeof CHORD_TYPES[number]['id']
export const CONTENT_SOURCE = '原创教学示例'
export const ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Cb', 'E#', 'Fb', 'B#'] as const

// 原位右手入门建议，完整构成；不同手型、音区及上下文需要调整。
export const FINGERINGS: Record<string, { right: number[]; left: string }> = {
  C: { right: [1, 3, 5], left: 'C3 · 5 指' },
  Am: { right: [1, 3, 5], left: 'A2 · 5 指' },
  F: { right: [1, 3, 5], left: 'F3 · 5 指' },
  G: { right: [1, 3, 5], left: 'G2 · 5 指' },
  Dm: { right: [1, 3, 5], left: 'D3 · 5 指' },
  Em: { right: [1, 3, 5], left: 'E3 · 5 指' },
  Cmaj7: { right: [1, 2, 3, 5], left: 'C3 · 5 指' },
  Dm7: { right: [1, 2, 3, 5], left: 'D3 · 5 指' },
  G7: { right: [1, 2, 3, 5], left: 'G2 · 5 指' },
}
