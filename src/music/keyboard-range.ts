export type KeyboardRange={start:number;end:number}

/** Fit the entire demonstration, keeping one stable view across a progression. */
export function demoRange(midis: number[]): KeyboardRange {
  const valid=midis.filter(n=>Number.isInteger(n)&&n>=21&&n<=108)
  if(!valid.length)return {start:36,end:72}
  const low=Math.min(...valid),high=Math.max(...valid)
  const candidates: {range:KeyboardRange;score:number}[]=[]
  for(const width of [36,48,60,72,87])for(const start of [21,24,36,48,60,72]) {
    const end=Math.min(108,start+width)
    if(start>low || end<high)continue
    const span=end-start
    // Never choose a narrower-than-three-octave view near the top of the piano.
    if(span<36)continue
    const balance=Math.abs((start+end)/2-(low+high)/2)
    const centralC=start<=60&&end>=60 ? 0:2
    candidates.push({range:{start,end},score:span*1000+balance+centralC})
  }
  candidates.sort((a,b)=>a.score-b.score || a.range.start-b.range.start)
  return candidates[0]?.range ?? {start:21,end:108}
}
export function manualRange(octave: number): KeyboardRange {return {start:(octave+1)*12,end:(octave+4)*12}}
