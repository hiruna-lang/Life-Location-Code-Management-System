import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GovernmentBrand from '../components/GovernmentBrand'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [languageOpen, setLanguageOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const languageRef = useRef(null)
  const navRef = useRef(null)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    if (!languageOpen) return undefined
    const closeLanguageMenu = event => {
      if (!languageRef.current?.contains(event.target)) setLanguageOpen(false)
    }
    document.addEventListener('pointerdown', closeLanguageMenu)
    return () => document.removeEventListener('pointerdown', closeLanguageMenu)
  }, [languageOpen])

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeMenu = event => {
      if (!navRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const closeOnEscape = event => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : '/ds-dashboard')
    } catch (err) {
      setError(err.response?.data?.message || t('loginError'))
    }
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="site-container">
          <Link to="/"><GovernmentBrand /></Link>
          <div className="government-header__service government-header__service--ministry">
            <span className="government-header__service-kicker">{t('division')}</span>
            <strong>{t('ministry')}</strong>
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

      <nav className="site-nav login-site-nav" aria-label="Primary navigation" ref={navRef}>
        <div className="site-container site-nav__inner">
          <button
            className={`site-nav__toggle${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen(open => !open)}
            aria-expanded={menuOpen}
            aria-controls="login-navigation-menu"
          >
            <span className="site-nav__toggle-label">{t('menu')}</span>
            <span className="site-nav__toggle-icon" aria-hidden="true"><span /><span /><span /></span>
          </button>
          <div id="login-navigation-menu" className={`site-nav__links${menuOpen ? ' is-open' : ''}`}>
            <NavLink to="/" end className="site-nav__link" onClick={() => setMenuOpen(false)}>{t('locationDirectoryNav')}</NavLink>
            <NavLink to="/listing" className="site-nav__link" onClick={() => setMenuOpen(false)}>{t('locationListing')}</NavLink>
            <NavLink to="/about" className="site-nav__link" onClick={() => setMenuOpen(false)}>{t('aboutService')}</NavLink>
            <NavLink to="/tools" className="site-nav__link" onClick={() => setMenuOpen(false)}>{t('tools')}</NavLink>
            <NavLink to="/login" className="site-nav__link site-nav__link--account is-active" onClick={() => setMenuOpen(false)}>{t('officerLogin')}</NavLink>
          </div>
        </div>
      </nav>

      <main className="login-main">
        <div className="login-card">
          <div className="login-card__heading">
            <span className="eyebrow">{t('securePortal')}</span>
            <h1>{t('signInTitle')}</h1>
            <p>{t('authorisedOnly')}</p>
          </div>

          {error && <div className="alert alert--error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="government-form">
            <div className="form-field">
              <label htmlFor="email">{t('email')}</label>
              <input id="email" type="email" autoComplete="username" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-field">
              <label htmlFor="password">{t('password')}</label>
              <input id="password" type="password" autoComplete="current-password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <button className="button button--primary button--full" type="submit" disabled={loading}>
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          <div className="login-card__help">
            <strong>{t('accessHelp')}</strong>
            <p>{t('accessHelpText')}</p>
          </div>
          <Link className="back-link" to="/">{t('returnPublic')}</Link>
        </div>
      </main>
      <footer className="login-footer">{t('developedBy')}</footer>
    </div>
  )
}
