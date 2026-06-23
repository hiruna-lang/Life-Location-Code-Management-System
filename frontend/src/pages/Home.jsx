import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function Home() {
  const { t } = useLanguage()
  const hierarchy = ['province', 'district', 'ds', 'gn', 'village']

  return (
    <>
      <section className="service-title-band">
        <span>{t('governmentSriLanka')}</span>
        <h1>{t('lifeLocationCode')}</h1>
        <p>{t('officialReference')}</p>
      </section>

      <section className="home-intro">
        <div className="home-intro__content">
          <span className="eyebrow">{t('nationalDirectory')}</span>
          <h2>{t('findAccurate')}</h2>
          <p>{t('homeDescription')}</p>
          <div className="button-row">
            <Link className="button button--primary" to="/search">{t('searchCodes')}</Link>
            <Link className="button button--secondary" to="/same-gn">{t('viewAnalysis')}</Link>
          </div>
        </div>
        <div className="home-intro__panel">
          <span className="home-intro__panel-label">{t('hierarchy')}</span>
          <ol className="hierarchy-list">
            {hierarchy.map((item, index) => (
              <li key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{t(item)}</strong></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="service-grid" aria-label={t('publicService')}>
        <Link className="service-card" to="/search">
          <span className="service-card__number">01</span>
          <div><h3>{t('locationServiceTitle')}</h3><p>{t('locationServiceDesc')}</p><span className="text-link">{t('openService')} →</span></div>
        </Link>
        <Link className="service-card" to="/same-gn">
          <span className="service-card__number">02</span>
          <div><h3>{t('analysisTitle')}</h3><p>{t('analysisDesc')}</p><span className="text-link">{t('viewAnalysis')} →</span></div>
        </Link>
        <Link className="service-card" to="/login">
          <span className="service-card__number">03</span>
          <div><h3>{t('officerPortal')}</h3><p>{t('officerPortalDesc')}</p><span className="text-link">{t('officerLogin')} →</span></div>
        </Link>
      </section>

      <aside className="information-notice"><strong>{t('publicService')}</strong><p>{t('noAccount')}</p></aside>
    </>
  )
}
