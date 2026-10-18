export const FILLS=[
  {id:'none',name:'基础版 · 不加花',tip:'先把基本音型弹稳，再比较下面的加花版本。',source:'原创教学示例'},
  {id:'chord-turn',name:'右手和弦内音回转',tip:'每次换和弦前的最后一拍，右手改弹四个十六分音符，只用当前和弦构成音；原来的右手持续音会提前结束。',source:'原创教学示例'},
  {id:'scale-approach',name:'右手调内经过音',tip:'换和弦前的最后一拍，右手用两个八分音符逐级靠近下一和弦的右手最低音。经过音可能不属于当前和弦，不能把它们当成和弦构成。',source:'原创教学示例'},
  {id:'bass-walk',name:'左手低音连接',tip:'换和弦前的第 3、4 拍，左手用两个四分音符逐级靠近下一和弦低音。会替换该处原有左手事件；右手保持基本音型。',source:'原创教学示例'},
] as const
export type FillId=typeof FILLS[number]['id']
