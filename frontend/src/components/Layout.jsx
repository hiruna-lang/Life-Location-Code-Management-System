import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GovernmentBrand from './GovernmentBrand'
import { useLanguage } from '../context/LanguageContext'

const publicLinks = [
  { to: '/', labelKey: 'locationDirectoryNav', end: true },
  { to: '/listing', labelKey: 'locationListing' },
  { to: '/same-gn', labelKey: 'gnAnalysis' },
  { to: '/about', labelKey: 'aboutService' },
  { to: '/tools', labelKey: 'tools' },
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
  const [languageOpen, setLanguageOpen] = useState(false)
  const navRef = useRef(null)
  const languageRef = useRef(null)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    delete document.documentElement.dataset.theme
    localStorage.removeItem('llcms_theme')
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined

    const closeOnOutsideClick = event => {
      if (!navRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const closeOnEscape = event => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!languageOpen) return undefined
    const closeLanguageMenu = event => {
      if (!languageRef.current?.contains(event.target)) setLanguageOpen(false)
    }
    document.addEventListener('pointerdown', closeLanguageMenu)
    return () => document.removeEventListener('pointerdown', closeLanguageMenu)
  }, [languageOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navClass = ({ isActive }) => `site-nav__link${isActive ? ' is-active' : ''}`

  return (
    <div className={admin ? 'app-shell app-shell--admin' : 'app-shell'}>
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
          <div className="government-header__tools">
            <div className="header-language" ref={languageRef}>
              <button
                className={`header-language__trigger${languageOpen ? ' is-open' : ''}`}
                onClick={() => setLanguageOpen(open => !open)}
                aria-expanded={languageOpen}
                aria-haspopup="menu"
              >
                <span className="header-language__icon" aria-hidden="true">文</span>
                <span>{language === 'si' ? 'සිංහල' : language === 'ta' ? 'தமிழ்' : 'English'}</span>
                <span className="header-language__chevron" aria-hidden="true">⌄</span>
              </button>
              <div className={`header-language__menu${languageOpen ? ' is-open' : ''}`} role="menu">
                <button className={language === 'en' ? 'language-active' : ''} onClick={() => { setLanguage('en'); setLanguageOpen(false) }} role="menuitem">English</button>
                <button className={language === 'si' ? 'language-active' : ''} onClick={() => { setLanguage('si'); setLanguageOpen(false) }} role="menuitem">සිංහල</button>
                <button className={language === 'ta' ? 'language-active' : ''} onClick={() => { setLanguage('ta'); setLanguageOpen(false) }} role="menuitem">தமிழ்</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="site-nav" aria-label="Primary navigation" ref={navRef}>
        <div className="site-container site-nav__inner">
          <button
            className={`site-nav__toggle${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation-menu"
          >
            <span className="site-nav__toggle-label">{t('menu')}</span>
            <span className="site-nav__toggle-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <div id="primary-navigation-menu" className={`site-nav__links${menuOpen ? ' is-open' : ''}`}>
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
                <NavLink
                  to="/login"
                  className={({ isActive }) => `site-nav__link site-nav__link--account${isActive ? ' is-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {t('officerLogin')}
                </NavLink>
              </>
            )}
          </div>
          {user && (
            <div className="site-nav__account">
              <>
                <span className="account-name">{user.name}</span>
                <span className="role-badge">{user.role === 'admin' ? 'System Administrator' : 'Divisional Secretary'}</span>
                <button className="nav-account-button" onClick={handleLogout}>{t('signOut')}</button>
              </>
            </div>
          )}
        </div>
      </nav>

      <main className={admin ? 'site-main' : 'site-main site-main--public'}>
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
