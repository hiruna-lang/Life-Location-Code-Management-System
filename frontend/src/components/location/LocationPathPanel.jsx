export default function LocationPathPanel({ selected, mode, onBackProvince, onBackDistrict, onReset }) {
  const path = [
    { label: 'Sri Lanka', value: 'National map', active: true },
    { label: 'Province', value: selected.province?.name_english, active: Boolean(selected.province) },
    { label: 'District', value: selected.district?.name_english, active: Boolean(selected.district) },
    { label: 'DS', value: selected.ds?.name_english, active: Boolean(selected.ds) },
    { label: 'GN', value: selected.gn?.name_english, active: Boolean(selected.gn) },
  ]

  return (
    <section className="location-side-card">
      <div className="location-side-card__header">
        <span>Selected path</span>
        <h2>Administrative drill-down</h2>
      </div>

      <ol className="location-path">
        {path.map(item => (
          <li key={item.label} className={item.active ? 'is-active' : ''}>
            <span>{item.label}</span>
            <strong>{item.value || 'Not selected'}</strong>
          </li>
        ))}
      </ol>

      <p className="location-guidance">
        {!selected.province && 'Select a province from the 3D national map.'}
        {selected.province && !selected.district && 'Select a district from the 3D district map.'}
        {selected.district && !selected.ds && 'Select a Divisional Secretariat from the list.'}
        {selected.ds && !selected.gn && 'Select a GN division to load village records.'}
        {selected.gn && 'Village records are loaded below.'}
      </p>

      <div className="location-action-grid">
        <button type="button" onClick={onBackProvince} disabled={mode === 'province'}>Back to province map</button>
        <button type="button" onClick={onBackDistrict} disabled={!selected.province}>Back to district map</button>
        <button type="button" onClick={onReset}>Reset selection</button>
      </div>
    </section>
  )
}
