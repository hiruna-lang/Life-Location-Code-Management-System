import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GovernmentBrand from '../components/GovernmentBrand'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { language, setLanguage, t } = useLanguage()

  const handleSubmit = async event => {
    event.preventDefault()
    setError('')
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : '/verify')
    } catch (err) {
      setError(err.response?.data?.message || t('loginError'))
    }
  }

  return (
    <div className="login-page">
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
      <header className="login-header">
        <div className="site-container"><Link to="/"><GovernmentBrand /></Link></div>
      </header>

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
