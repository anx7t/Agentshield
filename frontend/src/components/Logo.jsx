import { Link } from 'react-router-dom'

// Wordmark with a small "chained blocks" mark: three links, the last one cut.
export default function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5 text-white" aria-label="AgentShield home">
      <svg viewBox="0 0 22 12" className="h-3 w-auto" aria-hidden="true">
        <rect x="0" y="0" width="5" height="12" fill="currentColor" />
        <rect x="8" y="0" width="5" height="12" fill="currentColor" />
        <rect x="16" y="0" width="5" height="12" className="fill-accent transition-colors group-hover:fill-danger" />
      </svg>
      <span className="font-mono text-[13px] font-bold uppercase tracking-[0.08em]">AgentShield</span>
    </Link>
  )
}
