export const PIANO_SAMPLES = [21,...Array.from({length:7},(_,i) => [0,3,6,9].map(pc => (i+2)*12+pc)).flat(),108].map(midi => {
  const octave=Math.floor(midi/12)-1
  const name=({0:'C',3:'Ds',6:'Fs',9:'A'} as Record<number,string>)[midi%12]
  return {midi,url:`/audio/salamander/${name}${octave}.mp3`}
})
export function nearestSample(midi: number) {
  const sample=PIANO_SAMPLES.reduce((best,next) => Math.abs(next.midi-midi)<Math.abs(best.midi-midi)?next:best)
  return {...sample,rate:2**((midi-sample.midi)/12)}
}
export type SampleState = {status:'idle'|'loading'|'ready'|'fallback';loaded:number;total:number;message:string}
