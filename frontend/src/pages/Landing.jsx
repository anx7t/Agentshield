import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import Ribbon from '../components/Ribbon.jsx'
import useInView from '../components/useInView.js'

const NAV = [
  { href: '#protections', label: 'Features' },
  { href: '#path', label: 'How it works' },
  { href: '/dashboard', label: 'Dashboard' },
]

const PROTECTIONS = [
  {
    n: '01',
    icon: '🔐',
    title: 'Identity Check',
    body: "Every AI agent has to prove who it is. Unknown agents can't make payments.",
    spec: 'payrollBot  ✓ verified',
  },
  {
    n: '02',
    icon: '📊',
    title: 'Spending Check',
    body: "Each payment is compared with the agent's rules — how much, to whom, and until when. Anything outside the rules is stopped.",
    spec: '₹9,000 is over the ₹5,000 limit → stopped',
  },
  {
    n: '03',
    icon: '🔗',
    title: 'Tamper-Proof Records',
    body: 'Every action is saved in a linked record. If anyone secretly edits an old entry, it shows up right away.',
    spec: 'record #3 edited → flagged',
  },
]

const LOG = [
  ['12:04:11', 'payrollBot', '₹4,200 → Acme Supplies', 'Approved', ''],
  ['12:04:13', 'invoiceAgent', '₹1,150 → Northwind', 'Approved', ''],
  ['12:04:19', 'rogueAgent', '₹9,000 → Attacker Ltd', 'Stopped', 'over the limit'],
  ['12:04:20', 'rogueAgent', '₹100 → Attacker Ltd', 'Stopped', 'not on the allowed list'],
]

// Scattered "dead pixels" around the ribbon, fixed positions so they don't jump.'
const PIXELS = [
  [8, 12, 4], [17, 64, 3], [26, 30, 5], [38, 78, 3], [47, 18, 4], [55, 58, 3],
  [63, 88, 5], [71, 26, 3], [79, 70, 4], [86, 40, 3], [92, 84, 5], [96, 16, 3],
  [33, 52, 3], [68, 46, 4], [12, 90, 3],
]

export default function Landing() {
  return (
    <div className="overflow-x-clip bg-ink">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex min-h-svh flex-col">
        <SiteHeader
          links={NAV}
          action={
            <Link to="/login" className="font-mono text-[13px] text-white transition-colors hover:text-accent">
              Sign in
            </Link>
          }
        />

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-10 px-5 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-10">
          <div>
            <h1 className="rise display text-[clamp(2.3rem,8.2vw,8.25rem)]">
              Securing banks
              <br />
              against <span className="scan whitespace-nowrap">rogue AI</span>
              <sup className="ml-1 align-super font-mono text-[0.14em] font-normal tracking-normal text-neutral-500">®</sup>
            </h1>
            <p className="rise mt-8 max-w-[34rem] font-mono text-[13px] leading-relaxed text-neutral-400 sm:text-sm" style={{ animationDelay: '.12s' }}>
              AgentShield checks every payment an AI agent tries to make. If it breaks the rules you set, we stop it — and
              keep a record that can't be secretly changed.'
            </p>
            <div className="rise mt-9 flex flex-wrap items-center gap-6" style={{ animationDelay: '.2s' }}>
              <Link to="/dashboard" className="btn">
                Go to dashboard <span className="arrow">→</span>
              </Link>
              <a href="#protections" className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-400 underline decoration-neutral-700 underline-offset-4 transition-colors hover:text-white hover:decoration-white">
                How it works
              </a>
            </div>
          </div>

          <StatusCard />
        </div>

        <div className="relative mt-auto h-[40vh] min-h-[260px] sm:h-[44vh]">
          {PIXELS.map(([x, y, s], i) => (
            <span
              key={i}
              className={`absolute bg-neutral-700 ${i % 4 === 0 ? 'blink' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${i * 0.37}s` }}
              aria-hidden="true"
            />
          ))}
          <Ribbon className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent" />
        </div>
      </section>

      <Protections />
      <RequestPath />

      {/* ── Closing call ─────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-24 sm:px-8 md:py-32 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:px-10">
          <h2 className="display text-[clamp(2.6rem,6vw,5.5rem)]">
            See it stop
            <br />a <span className="scan">bad payment.</span>
          </h2>
          <div className="lg:justify-self-end">
            <p className="max-w-xs font-mono text-[13px] leading-relaxed text-neutral-400">
              Set a spending rule, then try a payment that breaks it. It works straight away — no setup needed.
            </p>
            <Link to="/dashboard" className="btn mt-6">
              Try it now <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-4 px-5 py-6 font-mono text-[12px] text-neutral-500 sm:px-8 lg:px-10">
          <span>AgentShield — demo version</span>
          <span>Rules · Checks · Records</span>
        </div>
      </footer>
    </div>
  )
}

function StatusCard() {
  return (
    <aside className="rise relative self-start justify-self-start lg:mt-4 lg:justify-self-end" style={{ animationDelay: '.3s' }}>
      <span className="absolute -top-4 right-3 z-10 flex items-center gap-2 border border-white/70 bg-ink px-2.5 py-1.5 font-mono text-[10px] uppercase leading-tight tracking-[0.1em] text-white">
        <span className="blink h-1.5 w-1.5 bg-danger" />
        Bad payment
        <br />
        stopped
      </span>
      <div className="w-[17rem] border border-white/70 px-5 pb-4 pt-6">
        <div className="label text-neutral-400">Safety checks on:</div>
        <div className="mt-1 font-mono text-6xl font-medium tracking-tight text-white">05</div>
        <div className="mt-4 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">
          Rules · Identity · Alerts
          <br />
          Approval · Records <span className="blink text-accent">/</span>
        </div>
      </div>
    </aside>
  )
}

function Protections() {
  const [ref, inView] = useInView(0.15)
  return (
    <section id="protections" className="border-t border-line">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-24 sm:px-8 md:py-32 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-10">
        <div className="lg:sticky lg:top-10 lg:self-start">
          <p className="label text-accent">01 — Features</p>
          <h2 className="display mt-5 text-[clamp(2.2rem,4.4vw,4rem)]">
            Three checks before any <span className="scan">money moves.</span>
          </h2>
        </div>

        <ol ref={ref} className={`reveal border-t border-line ${inView ? 'in' : ''}`}>
          {PROTECTIONS.map((p, i) => (
            <li
              key={p.n}
              className="group grid grid-cols-[3rem_1fr] gap-x-4 gap-y-3 border-b border-line py-8 transition-colors sm:grid-cols-[4rem_1fr_auto] sm:items-baseline"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <span className="font-mono text-xs text-neutral-500 transition-colors group-hover:text-accent">{p.n}</span>
              <div>
                <h3 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {p.title} <span className="text-lg" aria-hidden="true">{p.icon}</span>
                </h3>
                <p className="mt-3 max-w-md font-mono text-[13px] leading-relaxed text-neutral-400">{p.body}</p>
              </div>
              <code className="col-start-2 justify-self-start whitespace-nowrap border border-line px-2.5 py-1.5 font-mono text-[11px] text-neutral-300 transition-colors group-hover:border-accent/60 sm:col-start-3">
                {p.spec}
              </code>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function RequestPath() {
  const [ref, inView] = useInView(0.25)
  return (
    <section id="path" className="border-t border-line">
      <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label text-accent">02 — How it works</p>
            <h2 className="display mt-5 max-w-2xl text-[clamp(2.2rem,4.4vw,4rem)]">
              Every payment gets <span className="scan">checked first.</span>
            </h2>
          </div>
          <p className="max-w-xs font-mono text-[13px] leading-relaxed text-neutral-400">
            AI agents send payments to AgentShield instead of straight to the bank. We only pass on the ones that follow your rules.
          </p>
        </div>

        {/* Path diagram */}
        <div className="mt-16 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] sm:gap-5 sm:text-xs">
          <span className="border border-line px-3 py-2 text-neutral-300">AI agent</span>
          <Wire />
          <span className="bg-accent px-3 py-2 font-medium text-black">AgentShield</span>
          <Wire delay="1.3s" />
          <span className="border border-line px-3 py-2 text-neutral-300">Bank</span>
        </div>

        {/* Sample decision log */}
        <div ref={ref} className="mt-12 border border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11px] text-neutral-500">
            <span>Activity</span>
            <span>Example</span>
          </div>
          <div className={`reveal overflow-x-auto p-4 font-mono text-[12px] leading-7 sm:text-[13px] ${inView ? 'in' : ''}`}>
            {LOG.map(([time, agent, tx, status, reason], i) => (
              <div key={i} className="grid min-w-[50rem] grid-cols-[6rem_8.5rem_14rem_5.5rem_1fr] gap-3 whitespace-nowrap" style={{ transitionDelay: `${i * 0.35}s` }}>
                <span className="text-neutral-600">{time}</span>
                <span className="text-neutral-300">{agent}</span>
                <span className="text-neutral-400">{tx}</span>
                <span className={status === 'Stopped' ? 'text-danger' : 'text-accent'}>{status}</span>
                <span className="text-neutral-500">{reason}</span>
              </div>
            ))}
            <span className="blink mt-1 inline-block h-4 w-2 bg-neutral-500 align-middle" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Wire({ delay = '0s' }) {
  return (
    <span className="relative h-px bg-line" aria-hidden="true">
      <span className="packet absolute -top-[3px] h-[7px] w-[7px] -translate-x-1/2 bg-accent" style={{ animationDelay: delay }} />
    </span>
  )
}
