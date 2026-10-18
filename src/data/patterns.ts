const definitions = [
  { id: 'block', name: '柱式伴奏', subtitle: '低音与和弦，一起落下', beats: 4, subdivision: 1, bpm: 64, triadOnly: false, tip: '第 1、3 拍左手低音与右手完整和弦同时落下；每次保持两拍。先让两手同时开始、同时放松。' },
  { id: 'arp', name: '上下行分解', subtitle: '把和弦展开成一条线', beats: 4, subdivision: 2, bpm: 56, triadOnly: true, tip: '右手按最低–中间–最高–中间弹八分音符，一小节重复两次。C 原位示例 C4–E4–G4–E4–C4–E4–G4–E4，共八个八分音符；左手在第 1 拍保持低音。' },
  { id: 'root5', name: '根音 · 五度 · 八度', subtitle: '从低音建立律动', beats: 4, subdivision: 2, bpm: 60, triadOnly: false, tip: '左手弹根音–纯五度–根音高八度–纯五度，每小节重复两次。八度是根音升高 12 半音，不是第八个和弦音。右手第 1 拍弹完整和弦，保持一拍后松开，给左手高八度让位。仅适用含纯五度的和弦。' },
  { id: 'alberti', name: 'Alberti 低音', subtitle: '低 · 高 · 中 · 高', beats: 4, subdivision: 2, bpm: 52, triadOnly: true, tip: '左手三音紧密配置按最低–最高–中间–最高弹八分音符，一小节重复两次。C 原位为 C3–G3–E3–G3；右手第 1 拍保持和弦。仅适用于三音配置。' },
  { id: 'waltz', name: '三拍子伴奏', subtitle: '低音一拍，和弦两拍', beats: 3, subdivision: 1, bpm: 72, triadOnly: false, tip: '3/4 拍：第 1 拍左手低音，第 2、3 拍右手完整和弦。每拍一拍，不能按 4/4 四拍去数。' },
  { id: 'ascending', name: '八分上行分解', subtitle: '从低到高，一次展开', beats: 4, subdivision: 2, bpm: 60, triadOnly: false, tip: '右手每拍两个音：三音配置弹低–中–高–最低音高八度，四音配置依次弹完整四音；一小节重复两次。左手第 1 拍保持低音。最低音可能是转位低音，不一定是和弦根音。' },
  { id: 'descending', name: '八分下行分解', subtitle: '从高到低，柔和落下', beats: 4, subdivision: 2, bpm: 60, triadOnly: false, tip: '把上行分解倒过来：三音配置从最低音的高八度向下，四音配置从配置最高音依次下行。每组四个八分音符，一小节两组，左手保持低音。' },
  { id: 'seventhArp', name: '四音和弦分解', subtitle: '让七音也进入旋律', beats: 4, subdivision: 2, bpm: 56, triadOnly: false, tip: '专供四音配置：右手按 低–次低–次高–高–次高–次低–低–次低 展开。七和弦完整包含七音，六和弦 / add9 则保留各自第四个构成音，不把它们统称为七音。左手保持根音。' },
  { id: 'alternating', name: '双手交替伴奏', subtitle: '左 · 右 · 左 · 右', beats: 4, subdivision: 1, bpm: 72, triadOnly: false, tip: '4/4 拍：第 1、3 拍左手低音，第 2、4 拍右手完整和弦，每次一拍。与两手同时落下的柱式比较，先让换手保持均匀。' },
  { id: 'syncopated', name: '反拍切分和弦', subtitle: '低音稳住，和弦落在 &', beats: 4, subdivision: 2, bpm: 64, triadOnly: false, tip: '左手第 1、3 拍各保持两拍；右手在 1 &、2 &、3 &、4 & 弹完整和弦，各半拍。先数“1 和 2 和”，让右手落在“和”上，不要抢到正拍。' },
  { id: 'sixteenth', name: '十六分流动分解', subtitle: '一拍四音，慢速练习', beats: 4, subdivision: 4, bpm: 44, triadOnly: false, tip: '右手一拍四个十六分音符。三音配置反复 低–中–高–中；四音配置用 低–次低–次高–高–次高–次低–低–次低 两拍一组，一小节两组。左手第 1 拍保持低音；从 40–50 BPM 开始。' },
] as const
export const PATTERNS=definitions.map(definition => ({...definition,source:'原创教学示例' as const}))
export type PatternId = typeof PATTERNS[number]['id']
