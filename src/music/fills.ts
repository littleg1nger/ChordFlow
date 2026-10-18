import type {FillId} from '../data/fills'
import {PPQ,type Hand,type Timeline,type MusicEvent} from './patterns'
import {approachNotes,type KeyContext} from './scale'
import type {Note} from './theory'

type FillOptions=KeyContext&{id:FillId;right:Note[];nextRight:Note[];nextBass:Note}
export function fillTimeline(part:Timeline,options:FillOptions):Timeline {
  if(options.id==='none')return part
  if(part.beats!==4)throw new Error('本轮加花示例仅适用于 4/4 拍。')
  const hand:Hand=options.id==='bass-walk'?'L':'R'
  const onset=options.id==='bass-walk'?2*PPQ:3*PPQ
  const events=part.events.filter(e=>e.hand!==hand || e.tick<onset).map(e=>e.hand===hand&&e.tick+e.duration>onset?{...e,duration:onset-e.tick}:e)
  const baseBass=part.events.find(e=>e.hand==='L')!.notes[0]
  const notes=options.id==='chord-turn'
    ?(options.right.length===3?[options.right[0],options.right[1],options.right[2],options.right[1]]:options.right)
    :approachNotes(options,options.id==='bass-walk'?options.nextBass:options.nextRight[0],options.id==='bass-walk'?baseBass:options.right[0])
  const duration=options.id==='chord-turn'?120:options.id==='bass-walk'?480:240
  const fills:MusicEvent[]=notes.map((note,i)=>({tick:onset+i*duration,duration,hand,notes:[note],velocity:hand==='L'?.58:.66,bar:0,chordIndex:0,kind:'fill',annotation:part.chords[0].notes.some(p=>p.pc===note.pc)?'加花 · 和弦音':'加花 · 经过音'}))
  // Stop any opposite-hand note that would physically occupy a fill key.
  let result=[...events,...fills]
  for(const fill of fills)result=result.flatMap(event=>{
    if(event.hand===fill.hand || event.tick>=fill.tick+fill.duration || event.tick+event.duration<=fill.tick)return [event]
    const shared=event.notes.filter(n=>fill.notes.some(f=>f.midi===n.midi))
    if(!shared.length)return [event]
    const remaining=event.notes.filter(n=>!shared.some(s=>s.midi===n.midi))
    return [...(remaining.length?[{...event,notes:remaining}]:[]),...(event.tick<fill.tick?[{...event,notes:shared,duration:fill.tick-event.tick}]:[])]
  })
  return {...part,events:result.sort((a,b)=>a.tick-b.tick||a.hand.localeCompare(b.hand))}
}
