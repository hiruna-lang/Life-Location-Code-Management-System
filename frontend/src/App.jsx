import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

import Home                   from './pages/Home'
import PublicSearch            from './pages/PublicSearch'
import SameGnDifferentDs       from './pages/SameGnDifferentDs'
import Login                   from './pages/Login'
import AdminDashboard          from './pages/AdminDashboard'
import DSVerificationDashboard from './pages/DSVerificationDashboard'
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

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"        element={<Layout><Home /></Layout>} />
          <Route path="/search"  element={<Layout><PublicSearch /></Layout>} />
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
          <Route path="/verify" element={
            <RequireAuth>
              <Layout admin><DSVerificationDashboard /></Layout>
            </RequireAuth>
          }/>
          <Route path="/verify/gn/:gnId" element={
            <RequireAuth>
              <Layout admin><GNEdit /></Layout>
            </RequireAuth>
          }/>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
