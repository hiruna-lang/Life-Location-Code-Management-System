import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GovernmentBrand from './GovernmentBrand'
import { useLanguage } from '../context/LanguageContext'

const publicLinks = [
  { to: '/', labelKey: 'home', end: true },
  { to: '/search', labelKey: 'locationSearch' },
  { to: '/same-gn', labelKey: 'gnAnalysis' },
]

const adminLinks = [
  { to: '/admin', labelKey: 'dashboard', adminOnly: true, end: true },
  { to: '/admin/reports', labelKey: 'reports', adminOnly: true },
  { to: '/admin/api-logs', labelKey: 'apiLogs', adminOnly: true },
]

const officerLinks = [
  { to: '/ds-dashboard', label: 'DS Dashboard', end: true },
  { to: '/ds-gn-verification', label: 'GN Division Modification' },
]

export default function Layout({ children, admin = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navClass = ({ isActive }) => `site-nav__link${isActive ? ' is-active' : ''}`

  return (
    <div className={admin ? 'app-shell app-shell--admin' : 'app-shell'}>
      <div className="utility-bar">
        <div className="site-container utility-bar__inner">
          <span>{t('officialService')}</span>
          <div className="utility-bar__links">
            <button className={language === 'si' ? 'language-active' : ''} onClick={() => setLanguage('si')}>සිංහල</button>
            <button className={language === 'ta' ? 'language-active' : ''} onClick={() => setLanguage('ta')}>தமிழ்</button>
            <button className={language === 'en' ? 'language-active' : ''} onClick={() => setLanguage('en')}>English</button>
          </div>
        </div>
      </div>

      <header className="government-header">
        <div className="site-container government-header__inner">
          {user ? (
            <GovernmentBrand />
          ) : (
            <Link to="/" aria-label="Life Location Code home">
              <GovernmentBrand />
            </Link>
          )}
          <div className="government-header__service">
            <span className="government-header__service-kicker">{t('nationalService')}</span>
            <strong>{t('lifeLocationCode')}</strong>
          </div>
        </div>
      </header>

      <nav className="site-nav" aria-label="Primary navigation">
        <div className="site-container site-nav__inner">
          <button className="site-nav__toggle" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen}>
            <span>{t('menu')}</span><span aria-hidden="true">☰</span>
          </button>
          <div className={`site-nav__links${menuOpen ? ' is-open' : ''}`}>
            {user?.role === 'admin' ? (
              <>
                <NavLink to="/admin" end className={navClass} onClick={() => setMenuOpen(false)}>
                  {t('dashboard')}
                </NavLink>
                {publicLinks.filter(link => link.to !== '/').map(link => (
                  <NavLink key={link.to} {...link} className={navClass} onClick={() => setMenuOpen(false)}>
                    {t(link.labelKey)}
                  </NavLink>
                ))}
                {adminLinks.filter(link => link.to !== '/admin').map(link => (
                  <NavLink key={link.to} {...link} className={navClass} onClick={() => setMenuOpen(false)}>
                    {t(link.labelKey)}
                  </NavLink>
                ))}
              </>
            ) : user?.role === 'officer' ? (
              <>
                <NavLink to="/ds-dashboard" end className={navClass} onClick={() => setMenuOpen(false)}>
                  DS Dashboard
                </NavLink>
                {publicLinks.filter(link => link.to !== '/' && link.to !== '/same-gn').map(link => (
                  <NavLink key={link.to} {...link} className={navClass} onClick={() => setMenuOpen(false)}>
                    {t(link.labelKey)}
                  </NavLink>
                ))}
                {officerLinks.filter(link => link.to !== '/ds-dashboard').map(link => (
                  <NavLink key={link.to} to={link.to} end={link.end} className={navClass} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </NavLink>
                ))}
              </>
            ) : (
              <>
                {publicLinks.map(link => (
                  <NavLink key={link.to} {...link} className={navClass} onClick={() => setMenuOpen(false)}>
                    {t(link.labelKey)}
                  </NavLink>
                ))}
              </>
            )}
          </div>
          <div className="site-nav__account">
            {user ? (
              <>
                <span className="account-name">{user.name}</span>
                <span className="role-badge">{user.role === 'admin' ? 'System Administrator' : 'Divisional Secretary'}</span>
                <button className="nav-account-button" onClick={handleLogout}>{t('signOut')}</button>
              </>
            ) : (
              <Link className="nav-account-button" to="/login">{t('officerLogin')}</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="site-main">
        <div className={admin ? 'site-container site-container--wide' : 'site-container'}>
          {children}
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-container site-footer__inner">
          <div>
            <strong>{t('footerTitle')}</strong>
            <span>{t('footerDivision')}</span>
          </div>
          <div className="site-footer__meta">
            <span>{t('developedBy')}</span>
            <span>{t('rights')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
