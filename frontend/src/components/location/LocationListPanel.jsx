import { AnimatePresence, motion } from 'framer-motion'

export default function LocationListPanel({ title, eyebrow, items, loading, error, selectedId, onSelect, emptyText }) {
  return (
    <section className="location-side-card location-side-card--list">
      <div className="location-side-card__header">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div key="error" className="location-panel-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            {error}
          </motion.div>
        )}
        {loading && (
          <motion.div key="loading" className="location-panel-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            Loading records...
          </motion.div>
        )}
        {!loading && !error && items.length === 0 && (
          <motion.div key="empty" className="location-panel-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            {emptyText}
          </motion.div>
        )}

        {!loading && !error && items.length > 0 && (
          <motion.div key={`${title}-${eyebrow}`} className="location-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
