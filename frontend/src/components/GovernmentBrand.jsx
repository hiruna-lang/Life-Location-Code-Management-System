import React from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function GovernmentBrand({ compact = false }) {
  const { t } = useLanguage()
  return (
    <div className={`government-brand${compact ? ' government-brand--compact' : ''}`}>
      <div className="government-emblem-frame">
        <img
          className="government-logo"
          src="/government-logo-transparent.png"
          alt="Emblem of the Government of Sri Lanka"
        />
      </div>
      <div className="government-brand__text">
        <div className="government-brand__ministry">{t('lifeLocationCode')}</div>
        <div className="government-brand__division">{t('nationalService')}</div>
      </div>
    </div>
  )
}
