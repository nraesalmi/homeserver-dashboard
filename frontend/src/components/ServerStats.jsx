import { useState, useEffect, useId } from "react"
import { Activity, MemoryStick, HardDrive, ArrowUp, ArrowDown, Clock, Gauge } from "lucide-react"

function formatBytes(bytes) {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)), units.length - 1)
  return (bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1) + " " + units[i]
}

function formatBytesPerSec(bytes) {
  const bps = Math.abs(bytes)
  if (bps < 1024) return bps.toFixed(0) + " B/s"
  if (bps < 1024 ** 2) return (bps / 1024).toFixed(1) + " KB/s"
  if (bps < 1024 ** 3) return (bps / 1024 ** 2).toFixed(2) + " MB/s"
  return (bps / 1024 ** 3).toFixed(2) + " GB/s"
}

function polyPoints(vals, w, h, min, range, pad) {
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * (w - pad * 2) + pad
      const y = h - pad - ((v - min) / range) * (h - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

function Sparkline({ data, width = 240, height = 80, color = "#22c55e", label, series }) {
  const id = useId()
  const lines = series || [{ data, color }]
  const allVals = lines.flatMap((l) => l.data.map((d) => (typeof d === "number" ? d : d)))
  if (allVals.length < 2) return null

  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const range = max - min || 1
  const pad = 2

  return (
    <div className="flex flex-col">
      {label && <span className="text-xs text-white/50 mb-1 font-medium">{label}</span>}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxWidth: width, height }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {lines.length === 1 && (
            <linearGradient id={`spark-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>
        {lines.length === 1 && (
          <polygon fill={`url(#spark-fill-${id})`} points={`${pad},${height} ${polyPoints(lines[0].data, width, height, min, range, pad)} ${width - pad},${height}`} />
        )}
        {lines.map((l, i) => (
          <polyline key={i} fill="none" stroke={l.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={polyPoints(l.data, width, height, min, range, pad)} />
        ))}
        <text x={pad} y={pad + 10} fill="white" fillOpacity="0.6" fontSize="10" fontFamily="monospace">
          {max.toFixed(1)}
        </text>
        <text x={pad} y={height - pad} fill="white" fillOpacity="0.6" fontSize="10" fontFamily="monospace">
          {min.toFixed(1)}
        </text>
      </svg>
    </div>
  )
}

export default function ServerStats() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [uptimeData, setUptimeData] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/server-stats")
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setData(json)
        setError(false)
      } catch {
        setError(true)
      }
    }
    const fetchUptime = async () => {
      try {
        const res = await fetch("/api/uptime")
        if (!res.ok) throw new Error("Failed to fetch")
        setUptimeData(await res.json())
      } catch {
        /* ignore */
      }
    }
    fetchStats()
    fetchUptime()
    const statInterval = setInterval(fetchStats, 30000)
    const uptimeInterval = setInterval(fetchUptime, 60000)
    return () => {
      clearInterval(statInterval)
      clearInterval(uptimeInterval)
    }
  }, [])

  const uptimeAvg = uptimeData
    ? (() => {
        const vals = Object.values(uptimeData).map((m) => m.uptime_24h)
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      })()
    : null

  if (error && !data) {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center text-white/40 text-sm">
        Server stats unavailable
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center text-white/40 text-sm">
        Loading stats…
      </div>
    )
  }

  const cpuHistory = data.history?.map((h) => h.cpu) ?? []
  const loadHistory = data.history?.map((h) => h.load) ?? []

  const splitNet = (v) => {
    const bps = Math.abs(v || 0)
    if (bps >= 1024 ** 3) return {v: (bps / 1024 ** 3).toFixed(2), u: "GB/s"}
    if (bps >= 1024 ** 2) return {v: (bps / 1024 ** 2).toFixed(1), u: "MB/s"}
    if (bps >= 1024) return {v: (bps / 1024).toFixed(0), u: "KB/s"}
    return {v: bps.toFixed(0), u: "B/s"}
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Sparkline data={cpuHistory} color="#22c55e" label="CPU Usage %" width={280} height={90} />
        <Sparkline data={loadHistory} color="#a78bfa" label="Load Average" width={280} height={90} />
      </div>

      <div className="hidden md:grid grid-cols-2 gap-4">
        <Sparkline
          series={[
            { data: data.history?.map((h) => h.network_sent) ?? [], color: "#22c55e" },
            { data: data.history?.map((h) => h.network_recv) ?? [], color: "#38bdf8" },
          ]}
          label="Network (↑ sent / ↓ recv)"
          width={280}
          height={90}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-1 md:flex-nowrap md:justify-start md:gap-4 md:overflow-x-auto pb-1">
        <div className="flex flex-col items-center md:flex-row md:items-center md:gap-1.5 shrink-0 bg-white/[0.04] rounded-lg px-1.5 md:px-2.5 py-1.5">
          <MemoryStick size={13} className="text-sky-400 shrink-0" />
          <div className="text-center md:text-left">
            <div className="text-[10px] text-white/50 leading-tight">Memory</div>
            <div className="text-[11px] md:text-sm font-semibold text-white tabular-nums">{data.memory?.toFixed(1)}%</div>
          </div>
        </div>
        <div className="flex flex-col items-center md:flex-row md:items-center md:gap-1.5 shrink-0 bg-white/[0.04] rounded-lg px-1.5 md:px-2.5 py-1.5">
          <HardDrive size={13} className="text-amber-400 shrink-0" />
          <div className="text-center md:text-left">
            <div className="text-[10px] text-white/50 leading-tight">Disk</div>
            <div className="text-[11px] md:text-sm font-semibold text-white tabular-nums">{data.disk?.toFixed(1)}%</div>
          </div>
        </div>
        <div className="flex flex-col items-center md:flex-row md:items-center md:gap-1.5 shrink-0 bg-white/[0.04] rounded-lg px-1.5 md:px-2.5 py-1.5 md:hidden">
          <Activity size={13} className="text-emerald-400 shrink-0" />
          <div className="text-center md:text-left">
            <div className="text-[10px] text-white/50 leading-tight">Network</div>
            <div className="text-[11px] md:text-sm font-semibold text-white tabular-nums flex gap-1 justify-center md:justify-start">
              {(() => { const f = splitNet(data.network_sent); return (
              <span className="flex items-center gap-0.5">
                <ArrowUp size={9} className="text-emerald-400" />
                {f.v}
                <span className="text-[9px] md:text-[11px] text-white/40 font-normal">{f.u}</span>
              </span>
              )})()}
              {(() => { const f = splitNet(data.network_recv); return (
              <span className="flex items-center gap-0.5">
                <ArrowDown size={9} className="text-sky-400" />
                {f.v}
                <span className="text-[9px] md:text-[11px] text-white/40 font-normal">{f.u}</span>
              </span>
              )})()}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center md:flex-row md:items-center md:gap-1.5 shrink-0 bg-white/[0.04] rounded-lg px-1.5 md:px-2.5 py-1.5">
          <Gauge size={13} className="text-purple-400 shrink-0" />
          <div className="text-center md:text-left">
            <div className="text-[10px] text-white/50 leading-tight">Uptime</div>
            <div className="text-[11px] md:text-sm font-semibold text-white tabular-nums">{uptimeAvg !== null ? uptimeAvg.toFixed(1) + "%" : "—"}</div>
          </div>
        </div>
      </div>

      {data.last_updated && (
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <Clock size={12} />
          Last updated: {new Date(data.last_updated).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
