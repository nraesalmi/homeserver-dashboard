const dotColor = {
  up: "bg-green-500",
  down: "bg-red-500",
  unknown: "bg-neutral-500",
}

export function ServiceCard({ icon, name, status = "unknown", url, description }) {
  const content = (
    <>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-1.5 md:p-2 bg-neutral-800 rounded-lg leading-none text-base md:text-lg">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs md:text-sm font-semibold text-white truncate">{name}</div>
          {description && <div className="hidden md:block text-xs text-neutral-400 truncate">{description}</div>}
        </div>
        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${dotColor[status] || dotColor.unknown}`} />
      </div>
    </>
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-neutral-900/60 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-2.5 md:p-4 hover:bg-neutral-800/60 transition-colors"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-2.5 md:p-4">
      {content}
    </div>
  )
}
