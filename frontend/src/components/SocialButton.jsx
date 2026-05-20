export function SocialButton({ icon: Icon, href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 bg-neutral-700/60 hover:bg-neutral-600/80 text-neutral-300 hover:text-white rounded-lg transition-colors backdrop-blur-sm border border-neutral-600/50"
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
    </a>
  )
}
