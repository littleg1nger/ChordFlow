type Props = { name: string; size?: number }
export function Icon({ name, size = 20 }: Props) {
  const paths: Record<string, React.ReactNode> = {
    keys: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16m6-16v16M7 4v8m5-8v8m5-8v8" /></>,
    pattern: <><path d="M4 17h3V7h4v10h4V7h5M4 21V3" /></>,
    flow: <><rect x="2" y="7" width="5" height="10" rx="1" /><rect x="10" y="4" width="5" height="13" rx="1" /><path d="M18 7h4v10h-4" /></>,
    book: <><path d="M4 4h13a3 3 0 0 1 3 3v14H6a2 2 0 0 1-2-2V4Z" /><path d="M4 17h16M9 8h6m-6 4h4" /></>,
    play: <path d="m8 4 12 8-12 8V4Z" />,
    pause: <path d="M8 5v14M16 5v14" strokeWidth="4" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="1" />,
    volume: <path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a7 7 0 0 1 0 8m3-11a11 11 0 0 1 0 14" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2.5m0 3h.01" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.keys}</svg>
}
