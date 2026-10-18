export const PATTERNS = [
  { id: 'block', name: '柱式伴奏', subtitle: '低音与和弦，一起落下', beats: 4, subdivision: 1, bpm: 64, triadOnly: false, tip: '第 1、3 拍左手低音与右手完整和弦同时落下；每次保持两拍。先让两手同时开始、同时放松。' },
  { id: 'arp', name: '上下行分解', subtitle: '把和弦展开成一条线', beats: 4, subdivision: 2, bpm: 56, triadOnly: true, tip: '右手按最低–中间–最高–中间弹八分音符，一小节重复两次。C 原位示例 C4–E4–G4–E4–C4–E4–G4–E4，共八个八分音符；左手在第 1 拍保持低音。' },
  { id: 'root5', name: '根音 · 五度 · 八度', subtitle: '从低音建立律动', beats: 4, subdivision: 2, bpm: 60, triadOnly: false, tip: '左手弹根音–纯五度–根音高八度–纯五度，每小节重复两次。八度是同一根音升高 12 半音，不是第八个和弦音；右手仅在第 1 拍弹完整和弦。' },
  { id: 'alberti', name: 'Alberti 低音', subtitle: '低 · 高 · 中 · 高', beats: 4, subdivision: 2, bpm: 52, triadOnly: true, tip: '左手三音紧密配置按最低–最高–中间–最高弹八分音符，一小节重复两次。C 原位为 C3–G3–E3–G3；右手第 1 拍保持和弦。仅适用于三音配置。' },
  { id: 'waltz', name: '三拍子伴奏', subtitle: '低音一拍，和弦两拍', beats: 3, subdivision: 1, bpm: 72, triadOnly: false, tip: '3/4 拍：第 1 拍左手低音，第 2、3 拍右手完整和弦。每拍一拍，不能按 4/4 四拍去数。' },
] as const
export type PatternId = typeof PATTERNS[number]['id']
