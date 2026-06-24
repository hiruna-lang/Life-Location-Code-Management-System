export default function LocationListPanel({ title, eyebrow, items, loading, error, selectedId, onSelect, emptyText }) {
  return (
    <section className="location-side-card location-side-card--list">
      <div className="location-side-card__header">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>

      {error && <div className="location-panel-error">{error}</div>}
      {loading && <div className="location-panel-empty">Loading records...</div>}
      {!loading && !error && items.length === 0 && <div className="location-panel-empty">{emptyText}</div>}

      {!loading && !error && items.length > 0 && (
        <div className="location-list">
          {items.map(item => (
            <button
              type="button"
              key={item.id}
              className={String(selectedId) === String(item.id) ? 'is-selected' : ''}
              onClick={() => onSelect(item)}
            >
              <span>{item.name_english || item.name || 'Unnamed area'}</span>
              <small>{item.name_sinhala || item.name_tamil || 'Administrative record'}</small>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
