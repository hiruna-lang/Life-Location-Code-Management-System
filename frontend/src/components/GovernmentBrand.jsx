import React from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function GovernmentBrand({ compact = false }) {
  const { t } = useLanguage()
  return (
    <div className={`government-brand${compact ? ' government-brand--compact' : ''}`}>
      <img
        className="government-logo"
        src="/government-logo.jpg"
        alt="Emblem of the Government of Sri Lanka"
      />
      <div className="government-brand__text">
        <div className="government-brand__ministry">{t('ministry')}</div>
        <div className="government-brand__division">{t('division')}</div>
      </div>
    </div>
  )
}
