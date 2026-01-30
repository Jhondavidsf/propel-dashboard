export default function DataTable({ columns, data, maxHeight = 280 }) {
  return (
    <div className="table-wrapper" style={{ maxHeight }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={row.isTotal ? 'total-row' : ''}>
              {columns.map(col => (
                <td key={col.key} title={row[col.key]}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
