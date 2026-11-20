import { useEffect, useRef } from 'react'

// A twisting ribbon of "ledger blocks" — the audit hash chain as an object.
// Pure CSS 3D: each block is a plane positioned and shaded every frame.

const N = 64
const BLOCKED = 41 // the one block that fails its check
const HASHES = Array.from({ length: N }, (_, i) => ((i * 2654435761) >>> 0).toString(16).padStart(8, '0').slice(0, 6))

export default function Ribbon({ className = '' }) {
  const wrap = useRef(null)
  const blocks = useRef([])

  useEffect(() => {
    const el = wrap.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let raf = 0
    let visible = true
    let w = el.clientWidth
    let h = el.clientHeight
    // (Re)start drawing; also used when the size or visibility changes.
    function schedule() {
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(() => {
      w = el.clientWidth
      h = el.clientHeight
      schedule()
    })

    function frame(now) {
      if (!w || !h) return
      const t = (reduced ? 4000 : now - start) / 1000
      const bw = Math.min(Math.max(w / 17, 36), 92)
      const bh = bw * 1.55
      for (let i = 0; i < N; i++) {
        const node = blocks.current[i]
        if (!node) continue
        const u = i / (N - 1)
        const a1 = u * 4.6 + t * 0.5
        const a2 = u * 2.0 - t * 0.28
        const x = -0.08 * w + u * 1.16 * w
        const y = h * 0.52 + Math.sin(a1) * h * 0.18 + Math.sin(a2) * h * 0.08
        // Align each block with the path's slope so the ribbon reads as one band.
        const dy = Math.cos(a1) * 4.6 * h * 0.18 + Math.cos(a2) * 2.0 * h * 0.08
        const slope = Math.atan2(dy, 1.16 * w)
        // Blocks sit at an angle like falling dominoes; a travelling wave twists them.
        const twist = 0.75 + Math.sin(u * 4.2 - t * 0.65) * 0.5
        const tilt = Math.sin(u * 3.3 + t * 0.45) * 0.35
        const z = Math.sin(u * 2.7 + t * 0.4) * 110
        node.style.width = `${bw}px`
        node.style.height = `${bh}px`
        node.style.transform =
          `translate3d(${x - bw / 2}px, ${y - bh / 2}px, ${z}px) rotateZ(${slope}rad) rotateX(${tilt}rad) rotateY(${twist}rad)`
        node.style.setProperty('--l', (0.15 + 0.85 * Math.abs(Math.cos(twist - 0.35))).toFixed(3))
        node.style.setProperty('--hue', (214 + Math.sin(u * 6.0 + t * 0.3) * 14).toFixed(1))
      }
      if (!reduced && visible) raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      schedule()
    })

    ro.observe(el)
    io.observe(el)
    frame(performance.now())
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <div
      ref={wrap}
      className={`pointer-events-none overflow-hidden [perspective:1100px] ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 [transform-style:preserve-3d]">
        {HASHES.map((hash, i) => (
          <div
            key={i}
            ref={(n) => (blocks.current[i] = n)}
            className={`absolute left-0 top-0 flex items-end p-1.5 font-mono text-[8px] leading-none [backface-visibility:visible] ${
              i === BLOCKED ? 'ribbon-blocked' : 'ribbon-block'
            }`}
          >
            <span className="opacity-60">{i === BLOCKED ? 'BLOCK' : hash}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
