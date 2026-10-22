type Props = { name: string; size?: number }
export function Icon({ name, size = 20 }: Props) {
  const paths: Record<string, React.ReactNode> = {
    keys: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14m8-14v14M6 5v7h4V5m4 0v7h4V5"/></>,
    pattern: <><path d="M4 7h4m4 0h8M4 12h8m4 0h4M4 17h4m4 0h8"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="10" cy="17" r="2"/></>,
    flow: <><path d="M3 16h4l4-8h4l3 8h3"/><circle cx="4" cy="16" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="16" r="2" fill="currentColor" stroke="none"/></>,
    book: <><path d="M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6m-6 4h4"/></>,
    play: <path d="m8 4 12 8-12 8V4Z" />,
    pause: <path d="M8 5v14M16 5v14" strokeWidth="4" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="1" />,
    volume: <path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a7 7 0 0 1 0 8m3-11a11 11 0 0 1 0 14" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1-1.5 2.5m0 3h.01" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.keys}</svg>
}
