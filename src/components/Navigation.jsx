export default function Navigation({ activePage, onPageChange }) {
  const pages = [
    { id: 'people', label: 'People' },
    { id: 'organizations', label: 'Organizations' }
  ]

  return (
    <nav className="nav-tabs">
      {pages.map(page => (
        <button
          key={page.id}
          className={`nav-tab ${activePage === page.id ? 'active' : ''}`}
          onClick={() => onPageChange(page.id)}
        >
          {page.label}
        </button>
      ))}
    </nav>
  )
}
