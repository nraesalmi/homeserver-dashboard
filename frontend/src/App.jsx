import { useState, useEffect } from "react"

const API = "/api"

function StatCard({ label, value, unit, sub }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>

      <div style={styles.statValue}>
        {value}
        <span style={styles.statUnit}>{unit}</span>
      </div>

      {sub && <div style={styles.statSub}>{sub}</div>}
    </div>
  )
}

function ServiceCard({ name, url, icon, description, locked }) {
  return (
    <a
      href={url}
      style={styles.serviceCard}
      target="_blank"
      rel="noreferrer"
    >
      {locked && <div style={styles.lockIcon}>🔒</div>}

      <div style={styles.serviceIcon}>{icon}</div>

      <div style={styles.serviceName}>{name}</div>

      <div style={styles.serviceDesc}>{description}</div>
    </a>
  )
}

export default function App() {
  const [stats, setStats] = useState(null)
  const [services, setServices] = useState([])

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
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>nfrastructure</h1>

        <a
          href="https://docs.nfrastructure.xyz/share/80032tqogr/p/public-docs-KSibYbUW91"
          target="_blank"
          rel="noreferrer"
          style={styles.docsButton}
        >
          📚 Documentation
        </a>
      </div>

      <div style={styles.statsRow}>
        {stats ? (
          <>
            <StatCard label="CPU" value={stats.cpu} unit="%" />

            <StatCard
              label="RAM"
              value={stats.ram}
              unit="%"
              sub={`${stats.ram_used} / ${stats.ram_total} GB`}
            />

            <StatCard
              label="Disk"
              value={stats.disk}
              unit="%"
              sub={`${stats.disk_used} / ${stats.disk_total} GB`}
            />
          </>
        ) : (
          <p style={{ color: "#aaa" }}>Loading stats...</p>
        )}
      </div>

      {unlockedServices.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Services</h2>

          <div style={styles.servicesGrid}>
            {unlockedServices.map(s => (
              <ServiceCard key={s.name} {...s} />
            ))}
          </div>
        </>
      )}

      {lockedServices.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Protected Services</h2>

          <div style={styles.servicesGrid}>
            {lockedServices.map(s => (
              <ServiceCard key={s.name} {...s} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f0f0f",
    color: "#fff",
    fontFamily: "sans-serif",
    padding: "40px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px",
  },

  title: {
    fontSize: "2rem",
    color: "#fff",
    margin: 0,
  },

  docsButton: {
    background: "#1f1f1f",
    border: "1px solid #333",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "0.9rem",
    transition: "0.2s",
  },

  statsRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "40px",
    flexWrap: "wrap",
  },

  statCard: {
    background: "#1a1a1a",
    borderRadius: "12px",
    padding: "20px 30px",
    minWidth: "150px",
    flex: 1,
  },

  statLabel: {
    color: "#888",
    fontSize: "0.85rem",
    marginBottom: "8px",
  },

  statValue: {
    fontSize: "2rem",
    fontWeight: "bold",
  },

  statUnit: {
    fontSize: "1rem",
    color: "#888",
    marginLeft: "4px",
  },

  statSub: {
    color: "#666",
    fontSize: "0.75rem",
    marginTop: "4px",
  },

  sectionTitle: {
    fontSize: "1.2rem",
    color: "#888",
    marginBottom: "20px",
    marginTop: "30px",
  },

  servicesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "20px",
  },

  serviceCard: {
    position: "relative",
    background: "#1a1a1a",
    borderRadius: "12px",
    padding: "20px",
    textDecoration: "none",
    color: "#fff",
    textAlign: "center",
    transition: "background 0.2s",
    cursor: "pointer",
  },

  lockIcon: {
    position: "absolute",
    top: "10px",
    right: "10px",
    fontSize: "0.9rem",
    opacity: 0.7,
  },

  serviceIcon: {
    fontSize: "2rem",
    marginBottom: "10px",
  },

  serviceName: {
    fontWeight: "bold",
    marginBottom: "4px",
  },

  serviceDesc: {
    color: "#888",
    fontSize: "0.8rem",
  },
}
