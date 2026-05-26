import { useState, useEffect, useRef } from "react"
import { FileText, Github, Linkedin, Mail, MoreHorizontal } from "lucide-react"
import { ServiceCard } from "./components/ServiceCard"
import { SocialButton } from "./components/SocialButton"
import ServerStats from "./components/ServerStats"

const API = "/api"

const greetings = [
  "Welcome back, boss",
  "The server greets you",
  "Ah, there you are",
  "Ready when you are",
  "No fires today... hopefully",
  "The machines are watching",
  "You again? Good.",
  "Server status: you're here",
  "Let's see if anything's on fire",
  "All hail the administrator",
]

export default function App() {
  const [services, setServices] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const greeting = useRef(greetings[Math.floor(Math.random() * greetings.length)])

  useEffect(() => {
    fetch(`${API}/services`)
      .then(r => r.json())
      .then(setServices)
  }, [])

  const unlockedServices = services.filter(s => !s.locked)
  const lockedServices = services.filter(s => s.locked)

  return (
    <div className="size-full bg-neutral-800 relative flex flex-col">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-yellow-400/40 via-neutral-700/50 to-neutral-800 h-1/2 pointer-events-none" />

      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 bg-neutral-900/60 backdrop-blur-sm border-b border-neutral-700/30">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="nfrastructure" className="h-8 w-auto" />
          <div className="text-lg md:text-xl font-bold text-white">nfrastructure.xyz</div>
        </div>

        {/* Desktop: inline socials + docs */}
        <div className="hidden md:flex items-center gap-2">
          <SocialButton icon={Linkedin} href="https://www.linkedin.com/in/niklasraesalmi/" label="LinkedIn" />
          <SocialButton icon={Mail} href="mailto:niklas.raesalmi@gmail.com" label="Email" />
          <SocialButton icon={Github} href="https://github.com/nraesalmi" label="GitHub" />
          <a
            href="https://docs.nfrastructure.xyz/share/80032tqogr/p/public-docs-KSibYbUW91"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2 ml-4 bg-neutral-700/80 hover:bg-neutral-600/80 text-white rounded-lg transition-colors backdrop-blur-sm border border-neutral-600/50"
          >
            <FileText className="w-5 h-5" />
            Documentation
          </a>
        </div>

        {/* Mobile: menu button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="md:hidden p-2 bg-neutral-700/60 hover:bg-neutral-600/80 text-neutral-300 hover:text-white rounded-lg transition-colors backdrop-blur-sm border border-neutral-600/50"
          aria-label="Menu"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {showMenu && (
        <div className="absolute top-14 right-4 z-20 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-lg p-3 flex flex-col gap-2 shadow-xl md:hidden">
          <a href="https://www.linkedin.com/in/niklasraesalmi/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 bg-neutral-700/60 hover:bg-neutral-600/80 text-neutral-300 hover:text-white rounded-lg transition-colors backdrop-blur-sm border border-neutral-600/50">
            <Linkedin className="w-5 h-5" />
            <span className="text-sm">LinkedIn</span>
          </a>
          <a href="mailto:niklas.raesalmi@gmail.com" className="flex items-center gap-3 px-3 py-2 bg-neutral-700/60 hover:bg-neutral-600/80 text-neutral-300 hover:text-white rounded-lg transition-colors backdrop-blur-sm border border-neutral-600/50">
            <Mail className="w-5 h-5" />
            <span className="text-sm">Email</span>
          </a>
          <a href="https://github.com/nraesalmi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2 bg-neutral-700/60 hover:bg-neutral-600/80 text-neutral-300 hover:text-white rounded-lg transition-colors backdrop-blur-sm border border-neutral-600/50">
            <Github className="w-5 h-5" />
            <span className="text-sm">GitHub</span>
          </a>
          <a
            href="https://docs.nfrastructure.xyz/share/80032tqogr/p/public-docs-KSibYbUW91"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-neutral-700/80 hover:bg-neutral-600/80 text-white rounded-lg transition-colors backdrop-blur-sm border border-neutral-600/50"
          >
            <FileText className="w-5 h-5" />
            Docs
          </a>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{greeting.current}</h1>
          <ServerStats />
        </div>

        {/* Services */}
        {unlockedServices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Services</h2>
              <div className="hidden md:flex items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Healthy
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Offline
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {unlockedServices.map(s => (
                <ServiceCard key={s.name} icon={s.icon} name={s.name} url={s.url} status="online" description={s.description} />
              ))}
            </div>
          </div>
        )}

        {/* Protected Services */}
        {lockedServices.length > 0 && (
          <div className="space-y-3">
            {unlockedServices.length === 0 && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Protected Services</h2>
                <div className="hidden md:flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Healthy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Offline
                  </span>
                </div>
              </div>
            )}
            {unlockedServices.length > 0 && (
              <h2 className="text-xl font-semibold text-white">Protected Services</h2>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {lockedServices.map(s => (
                <ServiceCard key={s.name} icon={s.icon} name={s.name} url={s.url} status="online" description={s.description} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 px-4 md:px-8 py-2 md:py-3 text-center border-t border-neutral-700/30 bg-neutral-800">
        <p className="text-xs text-neutral-500 inline-flex items-center justify-center gap-1.5 flex-wrap">
          <span>© 2026 Niklas Raesalmi · Apache License 2.0</span>
          <span className="hidden md:inline">·</span>
          <a
            href="https://github.com/nraesalmi/homeserver-dashboard/tree/main"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Source Code</span>
          </a>
        </p>
      </div>
    </div>
  )
}
