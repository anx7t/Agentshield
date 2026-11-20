import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

// Compact top bar: wordmark left, quiet mono links centred, one action right.
export default function SiteHeader({ links = [], action }) {
  return (
    <header className="relative z-20 mx-auto grid w-full max-w-[1440px] grid-cols-[1fr_auto] items-center gap-6 px-5 py-5 sm:px-8 md:grid-cols-[1fr_auto_1fr] lg:px-10">
      <Logo />
      {links.length > 0 ? (
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(({ href, label }) =>
            href.startsWith('/') ? (
              <Link key={href} to={href} className="font-mono text-[13px] text-neutral-400 transition-colors hover:text-white">
                {label}
              </Link>
            ) : (
              <a key={href} href={href} className="font-mono text-[13px] text-neutral-400 transition-colors hover:text-white">
                {label}
              </a>
            ),
          )}
        </nav>
      ) : (
        <span className="hidden md:block" />
      )}
      <div className="flex justify-end">{action}</div>
    </header>
  )
}
