export function ResourceGauge({ label, value, max, unit }) {
  const percentage = (value / max) * 100

  return (
    <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 rounded-lg px-2 py-1.5 md:px-4 md:py-2 min-w-[90px] md:min-w-[160px]">
      <div className="text-xs md:text-xs text-neutral-400 mb-0.5 md:mb-1">{label}</div>
      <div className="text-xl md:text-2xl font-bold text-white mb-0.5">
        {percentage.toFixed(1)} <span className="text-xs md:text-base">%</span>
      </div>
      <div className="text-xs md:text-xs text-neutral-500">
        {value} / {max} {unit}
      </div>
    </div>
  )
}
