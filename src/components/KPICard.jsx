export default function KPICard({ title, value, subtitle, trend, icon, highlight }) {
  return (
    <div className={`kpi-card ${highlight ? 'kpi-highlight' : ''}`}>
      <div className="kpi-header">
        {icon && <span className="kpi-icon">{icon}</span>}
        <h3>{title}</h3>
      </div>
      <div className="kpi-value">{value}</div>
      {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
      {trend && (
        <span className={`kpi-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  )
}
