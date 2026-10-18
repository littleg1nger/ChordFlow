import { chord } from './music/theory'

export default function App() {
  const c = chord('C', 'major')
  return <main><h1>和序 · Chordflow</h1><p>从和弦开始，弹出自己的伴奏。</p><p>{c.symbol} · {c.notes.map(n => n.name).join(' – ')}</p></main>
}
