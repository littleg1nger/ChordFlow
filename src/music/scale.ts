import {interval,pitch,type Note,noteAt,atOrAbove} from './theory'

export type KeyContext={tonic:string;mode:'major'|'minor'}
export function scalePitches({tonic,mode}:KeyContext) {
  const root=pitch(tonic)
  return (mode==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10]).map((semitones,i)=>interval(root,i+1,semitones))
}
/** Two diatonic neighbors approaching a target from the less distant side. */
export function approachNotes(key:KeyContext,target:Note,from:Note):Note[] {
  const pool=scalePitches(key).flatMap(p=>{
    const notes:Note[]=[]
    for(let midi=atOrAbove(p,21).midi;midi<=108;midi+=12)notes.push(noteAt(p,midi))
    return notes
  }).sort((a,b)=>a.midi-b.midi)
  const index=pool.findIndex(n=>n.midi===target.midi)
  if(index<0)throw new Error('经过音目标不在当前调内。')
  const choices=[index>=2?[pool[index-2],pool[index-1]]:undefined,index+2<pool.length?[pool[index+2],pool[index+1]]:undefined].filter((notes):notes is Note[]=>!!notes)
  choices.sort((a,b)=>(Math.abs(a[0].midi-from.midi)+Math.abs(a[1].midi-target.midi))-(Math.abs(b[0].midi-from.midi)+Math.abs(b[1].midi-target.midi)))
  return choices[0]??[]
}
