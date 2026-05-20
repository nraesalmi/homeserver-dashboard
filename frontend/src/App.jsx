import { useState, useEffect, useRef } from "react"
import { FileText, Github, Linkedin, Mail } from "lucide-react"
import { ResourceGauge } from "./components/ResourceGauge"
import { ServiceCard } from "./components/ServiceCard"
import { SocialButton } from "./components/SocialButton"

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
  const [stats, setStats] = useState(null)
  const [services, setServices] = useState([])
  const greeting = useRef(greetings[Math.floor(Math.random() * greetings.length)])

  useEffect(() => {
    const fetchStats = () =>
      fetch(`${API}/stats`)
        .then(r => r.json())
        .then(setStats)

    const fetchServices = () =>
      fetch(`${API}/services`)
        .then(r => r.json())
        .then(setServices)

    fetchStats()
    fetchServices()

    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const unlockedServices = services.filter(s => !s.locked)
  const lockedServices = services.filter(s => s.locked)

  return (
    <div className="size-full bg-neutral-800 relative overflow-auto">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-yellow-400/40 via-neutral-700/50 to-neutral-800 h-1/2 pointer-events-none" />

      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-3 bg-neutral-900/60 backdrop-blur-sm border-b border-neutral-700/30">
        <div className="text-xl font-bold text-white">nfrastructure.xyz</div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-8 py-6 space-y-6">
        {/* Greeting and Resource Gauges */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">{greeting.current}</h1>
          <div className="flex items-center gap-4">
            {stats ? (
              <>
                <ResourceGauge label="CPU" value={stats.cpu} max={100} unit="%" />
                <ResourceGauge label="RAM" value={stats.ram_used} max={stats.ram_total} unit="GB" />
                <ResourceGauge label="Disk" value={stats.disk_used} max={stats.disk_total} unit="GB" />
              </>
            ) : (
              <p className="text-neutral-400">Loading stats...</p>
            )}
          </div>
        </div>

        {/* Services */}
        {unlockedServices.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white">Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {unlockedServices.map(s => (
                <ServiceCard key={s.name} icon={s.icon} name={s.name} url={s.url} status="online" />
              ))}
            </div>
          </div>
        )}

        {/* Protected Services */}
        {lockedServices.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-white">Protected Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {lockedServices.map(s => (
                <ServiceCard key={s.name} icon={s.icon} name={s.name} url={s.url} status="online" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
