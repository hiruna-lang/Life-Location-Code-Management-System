const columns = [
  'name_english',
  'name_sinhala',
  'name_tamil',
  'lifecode',
  'village_code',
  'pcode',
]

export default function LocationResultTable({ villages, loading }) {
  const getValue = (village, column) => {
    if (column === 'lifecode') return village.lifecode || village.village_lifecode || '-'
    return village[column] || '-'
  }

  return (
    <section className="location-results-card">
      <div className="location-results-card__header">
        <span>Village result table</span>
        <h2>{loading ? 'Loading villages...' : `${villages.length} village records`}</h2>
      </div>

      <div className="location-table-wrap">
        <table className="location-result-table">
          <thead>
            <tr>
              {columns.map(column => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {!loading && villages.length === 0 && (
              <tr>
                <td colSpan={columns.length}>No village records loaded.</td>
              </tr>
            )}
            {villages.map(village => (
              <tr key={village.id || `${village.name_english}-${village.pcode}`}>
                {columns.map(column => <td key={column}>{getValue(village, column)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
