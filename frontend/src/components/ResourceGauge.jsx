export function ResourceGauge({ label, value, max, unit }) {
  const percentage = (value / max) * 100

  return (
    <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 rounded-lg px-4 py-2 min-w-[160px]">
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-white mb-0.5">
        {percentage.toFixed(1)} <span className="text-base">%</span>
      </div>
      <div className="text-xs text-neutral-500">
        {value} / {max} {unit}
      </div>
    </div>
  )
}
