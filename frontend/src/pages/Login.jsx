import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import Ribbon from '../components/Ribbon.jsx'
import { login } from '../api/auth.js'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    login(email)
    navigate('/dashboard')
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-ink">
      <SiteHeader
        action={
          <Link to="/" className="font-mono text-[13px] text-neutral-400 transition-colors hover:text-white">
            ← Back
          </Link>
        }
      />

      <Ribbon className="absolute inset-x-0 bottom-0 h-[42vh] opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42vh] bg-gradient-to-r from-ink via-transparent to-ink" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 gap-12 px-5 pb-12 pt-8 sm:px-8 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-20 lg:px-10 lg:pt-16">
        <div>
          <p className="rise label text-accent">Welcome back</p>
          <h1 className="rise display mt-5 text-[clamp(3rem,7vw,6.5rem)]" style={{ animationDelay: '.08s' }}>
            Your
            <br />
            <span className="scan">dashboard</span>
          </h1>
          <p className="rise mt-6 max-w-sm font-mono text-[13px] leading-relaxed text-neutral-400" style={{ animationDelay: '.16s' }}>
            Set spending rules for your AI agents, stop risky ones, and check that your records haven’t been changed.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rise self-start border border-line bg-panel p-7 sm:p-8 lg:mt-4"
          style={{ animationDelay: '.2s' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-white">Sign in</h2>
            <span className="label text-neutral-500">Demo</span>
          </div>

          <label className="mt-8 block">
            <span className="label text-neutral-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@bank.com"
              autoComplete="email"
              className="field"
            />
          </label>
          <label className="mt-5 block">
            <span className="label text-neutral-400">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="field"
            />
          </label>

          <button type="submit" className="btn mt-8 w-full justify-between">
            Sign in <span className="arrow">→</span>
          </button>
          <p className="mt-5 font-mono text-[11px] text-neutral-500">This is a demo — any email and password will work.</p>
        </form>
      </div>
    </div>
  )
}
