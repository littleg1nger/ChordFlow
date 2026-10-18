import type {PracticeConfig} from '../storage/store'

type Lesson={id:string;name:string;description:string;config:Pick<PracticeConfig,'progression'|'tonic'|'pattern'|'fill'|'bpm'|'voicing'>}
export const LESSONS:Lesson[]=[
  {id:'canon-flow',name:'卡农 · 流动分解与回转',description:'D 大调八和弦，在换和弦前用和弦内音收尾。',config:{progression:'canon',tonic:'D',pattern:'ascending',fill:'chord-turn',bpm:60,voicing:'smooth'}},
  {id:'canon-sixteenth',name:'卡农 · 十六分细流',description:'低速一拍四音，先保持均匀，再连接八个和弦。',config:{progression:'canon',tonic:'C',pattern:'sixteenth',fill:'none',bpm:44,voicing:'smooth'}},
  {id:'453-sync',name:'4536251 · 切分与经过音',description:'右手反拍伴奏，最后一拍逐级接向下一和弦。',config:{progression:'4536251',tonic:'C',pattern:'syncopated',fill:'scale-approach',bpm:64,voicing:'smooth'}},
  {id:'453-bass',name:'4536251 · 低音连接',description:'两手交替，在第 3、4 拍听见低音的走向。',config:{progression:'4536251',tonic:'C',pattern:'alternating',fill:'bass-walk',bpm:64,voicing:'smooth'}},
  {id:'jazz-four',name:'ii–V–I · 七音分解',description:'保留四个构成音，再比较和弦内音加花。',config:{progression:'jazz',tonic:'C',pattern:'seventhArp',fill:'chord-turn',bpm:56,voicing:'smooth'}},
  {id:'minor-descending',name:'小调 · 下行与连接',description:'A 自然小调，下行分解后用调内经过音衔接。',config:{progression:'minor',tonic:'A',pattern:'descending',fill:'scale-approach',bpm:60,voicing:'root'}},
]
