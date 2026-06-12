import { useState, useEffect } from "react"

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

export default function PiHoleStats() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchStats = () =>
      fetch("/api/pi-hole")
        .then((r) => r.json())
        .then(setData)

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!data) {
    return null
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 md:p-4 space-y-2">
      <div className="text-sm font-semibold text-white">Pi-Hole Statistics</div>

      <div className="flex flex-wrap gap-2">
        <div className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 min-w-[90px]">
          <div className="text-[10px] text-white/50">Total Queries</div>
          <div className="text-xs font-semibold text-white tabular-nums">{fmt(data.queries_total)}</div>
        </div>
        <div className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 min-w-[90px]">
          <div className="text-[10px] text-white/50">Blocked</div>
          <div className="text-xs font-semibold text-white tabular-nums">{fmt(data.queries_blocked)}</div>
        </div>
        <div className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 min-w-[90px]">
          <div className="text-[10px] text-white/50">Blocked %</div>
          <div className="text-xs font-semibold text-white tabular-nums">{data.blocked_pct}%</div>
        </div>
        <div className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 min-w-[90px]">
          <div className="text-[10px] text-white/50">Domains List</div>
          <div className="text-xs font-semibold text-white tabular-nums">{fmt(data.domains_blocked)}</div>
        </div>
      </div>
    </div>
  )
}
