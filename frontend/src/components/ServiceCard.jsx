export function ServiceCard({ icon, name, status = "online", url }) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-neutral-800 rounded-lg leading-none text-lg">{icon}</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{name}</div>
        </div>
        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
    </>
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-neutral-900/60 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-4 hover:bg-neutral-800/60 transition-colors"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="bg-neutral-900/60 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-4">
      {content}
    </div>
  )
}
