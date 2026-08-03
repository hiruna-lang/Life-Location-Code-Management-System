import React from 'react'

const languages = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'si', label: 'Sinhala', nativeLabel: 'සිංහල' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
]

export default function LanguageSelectModal({ show, onSelect, onClose }) {
  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 10,
          width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>
            Select Letter Language
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0 4px',
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Choose the language for the official letter:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onSelect(lang.code)}
                style={{
                  padding: '14px 20px',
                  border: '2px solid var(--border)',
                  borderRadius: 8,
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.background = 'var(--surface)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = '#fff'
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', minWidth: 40 }}>
                  {lang.nativeLabel}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
