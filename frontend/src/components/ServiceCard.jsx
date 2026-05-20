export function ServiceCard({ icon, name, status = "online", url }) {
  const content = (
    <>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-1.5 md:p-2 bg-neutral-800 rounded-lg leading-none text-base md:text-lg">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs md:text-sm font-medium text-white truncate">{name}</div>
        </div>
        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
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
