import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

import About                  from './pages/About'
import Tools                  from './pages/Tools'
import LocationSearch          from './pages/LocationSearch'
import LocationListing         from './pages/LocationListing'
import SameGnDifferentDs       from './pages/SameGnDifferentDs'
import Login                   from './pages/Login'
import AdminDashboard          from './pages/AdminDashboard'
import DSVerificationDashboard from './pages/DSVerificationDashboard'
import GNDivisionVerification  from './pages/GNDivisionVerification'
import GNEdit                  from './pages/GNEdit'
import Reports                 from './pages/Reports'
import ApiLogs                 from './pages/ApiLogs'
import NotFound                from './pages/NotFound'
import Layout                  from './components/Layout'

function RequireAuth({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function LegacyGNRedirect() {
  const { gnId } = useParams()
  return <Navigate to={`/ds-gn-verification/gn/${gnId}`} replace />
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"        element={<Layout><LocationSearch /></Layout>} />
          <Route path="/listing" element={<Layout><LocationListing /></Layout>} />
          <Route path="/about"   element={<Layout><About /></Layout>} />
          <Route path="/tools"   element={<Layout><Tools /></Layout>} />
          <Route path="/same-gn" element={<Layout><SameGnDifferentDs /></Layout>} />
          <Route path="/login"   element={<Login />} />

          {/* Admin only */}
          <Route path="/admin" element={
            <RequireAuth role="admin">
              <Layout admin><AdminDashboard /></Layout>
            </RequireAuth>
          }/>
          <Route path="/admin/reports" element={
            <RequireAuth role="admin">
              <Layout admin><Reports /></Layout>
            </RequireAuth>
          }/>
          <Route path="/admin/api-logs" element={
            <RequireAuth role="admin">
              <Layout admin><ApiLogs /></Layout>
            </RequireAuth>
          }/>

          {/* Officer */}
          <Route path="/ds-dashboard" element={
            <RequireAuth>
              <Layout admin><DSVerificationDashboard /></Layout>
            </RequireAuth>
          }/>
          <Route path="/ds-gn-verification" element={
            <RequireAuth>
              <Layout admin><GNDivisionVerification /></Layout>
            </RequireAuth>
          }/>
          <Route path="/verify" element={<Navigate to="/ds-dashboard" replace />} />
          <Route path="/ds-gn-verification/gn/:gnId" element={
            <RequireAuth>
              <Layout admin><GNEdit /></Layout>
            </RequireAuth>
          }/>
          <Route path="/verify/gn/:gnId" element={<LegacyGNRedirect />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
