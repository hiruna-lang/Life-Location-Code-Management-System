import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import './Tools.css'

const apiEndpoints = [
  ['POST', '/api/login', 'Public', 'Authenticate an authorised officer', '{ email, password }', '{ token, user }'],
  ['GET', '/api/provinces', 'Public', 'List all provinces', 'None', 'Province[]'],
  ['GET', '/api/districts', 'Public', 'List districts; optionally filter by province', 'province_id', 'District[]'],
  ['GET', '/api/divisional-secretariats', 'Public', 'List DS divisions; optionally filter by district', 'district_id', 'DivisionalSecretariat[]'],
  ['GET', '/api/gn-divisions', 'Public', 'List GN divisions; optionally filter by DS division', 'ds_id', 'GnDivision[]'],
  ['GET', '/api/villages', 'Public', 'List villages; optionally filter by GN division', 'gn_id', 'Village[]'],
  ['GET', '/api/location-lookup', 'Public', 'Look up the administrative hierarchy for a location', 'Location identifier or Life Location Code', 'Location hierarchy object'],
  ['GET', '/api/search', 'Public', 'Search locations by name or Life Location Code', 'q and optional filters', 'Search result[]'],
  ['GET', '/api/duplicate-gn', 'Public', 'Find duplicate GN names across DS divisions', 'Optional province, district, DS and GN filters', 'Paginated analysis rows'],
  ['GET', '/api/export/search/excel', 'Public', 'Download location search results as Excel', 'Search filter query parameters', 'XLSX file'],
  ['GET', '/api/export/search/pdf', 'Public', 'Download location search results as PDF', 'Search filter query parameters', 'PDF file'],
  ['GET', '/api/export/duplicate-gn/excel', 'Public', 'Download duplicate GN analysis as Excel', 'Analysis filter query parameters', 'XLSX file'],
  ['GET', '/api/export/duplicate-gn/pdf', 'Public', 'Download duplicate GN analysis as PDF', 'Analysis filter query parameters', 'PDF file'],
  ['POST', '/api/logout', 'Authenticated', 'End the current authenticated session', 'Bearer token', '{ message }'],
  ['GET', '/api/me', 'Authenticated', 'Return the signed-in user', 'Bearer token', 'User object'],
  ['GET', '/api/verification/my-gn-divisions', 'Officer', 'List GN divisions assigned to the officer', 'Bearer token', 'GnDivision[]'],
  ['GET', '/api/verification/gn/{gnId}/villages', 'Officer', 'List villages in an assigned GN division', 'Path: gnId', 'Village[]'],
  ['PUT', '/api/verification/gn/{gnId}', 'Officer', 'Update a GN division record', 'Path: gnId; JSON GN fields', 'Updated GN division'],
  ['PUT', '/api/verification/village/{villageId}', 'Officer', 'Update a village record', 'Path: villageId; JSON village fields', 'Updated village'],
  ['POST', '/api/verification/draft', 'Officer', 'Save verification work as a draft', 'JSON verification data', '{ message, status }'],
  ['POST', '/api/verification/final', 'Officer', 'Submit final verification', 'JSON verification data', '{ message, status }'],
  ['GET', '/api/dashboard/stats', 'Administrator', 'Get dashboard summary statistics', 'Bearer token', 'Statistics object'],
  ['GET', '/api/dashboard/verification-status', 'Administrator', 'Get verification progress', 'Bearer token', 'Verification status[]'],
  ['GET', '/api/dashboard/recent-logs', 'Administrator', 'Get recent system activity', 'Bearer token', 'Log[]'],
  ['GET', '/api/admin/users', 'Administrator', 'List system users', 'Bearer token', 'User[]'],
  ['POST', '/api/admin/users', 'Administrator', 'Create a system user', 'JSON user fields', 'Created user'],
  ['PUT', '/api/admin/users/{id}', 'Administrator', 'Update a system user', 'Path: id; JSON user fields', 'Updated user'],
  ['DELETE', '/api/admin/users/{id}', 'Administrator', 'Delete a system user', 'Path: id', '{ message }'],
  ['POST', '/api/admin/ds/{dsId}/lock', 'Administrator', 'Lock a DS division', 'Path: dsId', '{ message, status }'],
  ['POST', '/api/admin/ds/{dsId}/unlock', 'Administrator', 'Unlock a DS division', 'Path: dsId', '{ message, status }'],
  ['GET', '/api/admin/api-logs', 'Administrator', 'List API access logs', 'Optional pagination and filters', 'Paginated API logs'],
  ['GET', '/api/admin/api-logs/summary', 'Administrator', 'Get API usage summary', 'Optional date filters', 'Summary object'],
].map(([method, endpoint, access, purpose, input, response]) => ({ method, endpoint, access, purpose, input, response }))

const downloadFile = (content, filename, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const csvCell = value => `"${String(value).replaceAll('"', '""')}"`

export default function Tools() {
  const [query, setQuery] = useState('')
  const [access, setAccess] = useState('All')

  const visibleEndpoints = useMemo(() => {
    const search = query.trim().toLowerCase()
    return apiEndpoints.filter(item => {
      const matchesAccess = access === 'All' || item.access === access
      const matchesSearch = !search || Object.values(item).some(value => String(value).toLowerCase().includes(search))
      return matchesAccess && matchesSearch
    })
  }, [query, access])

  const downloadJson = () => downloadFile(
    JSON.stringify({ name: 'Life Location Code API', baseUrl: '/api', endpoints: apiEndpoints }, null, 2),
    'life-location-code-api.json',
    'application/json',
  )

  const downloadCsv = () => {
    const headings = ['Method', 'Endpoint', 'Access', 'Purpose', 'Input / Parameters', 'Response Format']
    const rows = apiEndpoints.map(item => [item.method, item.endpoint, item.access, item.purpose, item.input, item.response])
    downloadFile([headings, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n'), 'life-location-code-api.csv', 'text/csv;charset=utf-8')
  }

  return (
    <div className="tools-page">
      <motion.section className="tools-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
        <div>
          <span className="tools-eyebrow">Developer resources</span>
          <h1>API Tools</h1>
          <p>View and download the endpoints available in the Life Location Code Management System.</p>
        </div>
        <div className="tools-hero__actions">
          <button onClick={downloadJson}><span>↓</span> Download JSON</button>
          <button onClick={downloadCsv}><span>↓</span> Download CSV</button>
        </div>
      </motion.section>

      <section className="tools-catalogue">
        <div className="tools-catalogue__heading">
          <div>
            <span>API catalogue</span>
            <h2>Available endpoints</h2>
          </div>
          <strong>{visibleEndpoints.length} of {apiEndpoints.length}</strong>
        </div>
        <div className="tools-filters">
          <label>
            <span>Search APIs</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by endpoint, method, or purpose" />
          </label>
          <label>
            <span>Access level</span>
            <select value={access} onChange={event => setAccess(event.target.value)}>
              {['All', 'Public', 'Authenticated', 'Officer', 'Administrator'].map(option => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="tools-table-wrap">
          <table className="tools-table">
            <thead><tr><th>Method</th><th>Endpoint</th><th>Access</th><th>Purpose</th><th>Input / parameters</th><th>Response</th></tr></thead>
            <tbody>
              {visibleEndpoints.map(item => (
                <tr key={`${item.method}-${item.endpoint}`}>
                  <td><span className={`method method--${item.method.toLowerCase()}`}>{item.method}</span></td>
                  <td><code>{item.endpoint}</code></td>
                  <td><span className="access-badge">{item.access}</span></td>
                  <td>{item.purpose}</td>
                  <td>{item.input}</td>
                  <td>{item.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleEndpoints.length && <div className="tools-empty">No APIs match the selected filters.</div>}
        </div>
      </section>
    </div>
  )
}
