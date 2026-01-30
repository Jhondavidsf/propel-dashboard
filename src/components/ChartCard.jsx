export default function ChartCard({ title, children, wide = false }) {
  return (
    <div className={`chart-container ${wide ? 'wide' : ''}`}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}
