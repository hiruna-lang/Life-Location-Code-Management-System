import React from 'react'

const styles = {
  wrap: { background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { background: 'var(--navy)', color: '#fff', padding: '11px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', letterSpacing: '.2px' },
  td: { padding: '10px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  empty: { padding: 40, textAlign: 'center', color: 'var(--text-muted)' },
}

export default function Table({ columns, data, loading, emptyMsg = 'No data found.' }) {
  return (
    <div style={styles.wrap}>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>{columns.map(column => <th key={column.key} style={{ ...styles.th, ...(column.style || {}) }}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} style={styles.empty}>Loading records…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} style={styles.empty}>{emptyMsg}</td></tr>
            ) : data.map((row, index) => (
              <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#faf9f8' }}>
                {columns.map(column => (
                  <td key={column.key} style={{ ...styles.td, ...(column.style || {}) }}>
                    {column.render ? column.render(row) : (row[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
