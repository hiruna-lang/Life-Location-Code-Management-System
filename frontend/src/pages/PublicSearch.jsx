import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import Table from '../components/Table'
import Pagination from '../components/Pagination'
import { useLanguage } from '../context/LanguageContext'

export default function PublicSearch() {
  const { language, t, localizedName } = useLanguage()
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [dsList, setDsList] = useState([])
  const [gnList, setGnList] = useState([])
  const [villages, setVillages] = useState([])
  const [filters, setFilters] = useState({ province_id: '', district_id: '', ds_id: '', gn_id: '', village_id: '', keyword: '' })
  const [results, setResults] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => { api.get('/provinces').then(r => setProvinces(r.data)) }, [])

  useEffect(() => {
    setFilters(p => ({ ...p, district_id: '', ds_id: '', gn_id: '', village_id: '' }))
    setDistricts([]); setDsList([]); setGnList([]); setVillages([])
    if (filters.province_id) api.get('/districts', { params: { province_id: filters.province_id } }).then(r => setDistricts(r.data))
  }, [filters.province_id])

  useEffect(() => {
    setFilters(p => ({ ...p, ds_id: '', gn_id: '', village_id: '' }))
    setDsList([]); setGnList([]); setVillages([])
    if (filters.district_id) api.get('/divisional-secretariats', { params: { district_id: filters.district_id } }).then(r => setDsList(r.data))
  }, [filters.district_id])

  useEffect(() => {
    setFilters(p => ({ ...p, gn_id: '', village_id: '' }))
    setGnList([]); setVillages([])
    if (filters.ds_id) api.get('/gn-divisions', { params: { ds_id: filters.ds_id } }).then(r => setGnList(r.data))
  }, [filters.ds_id])

  useEffect(() => {
    setFilters(p => ({ ...p, village_id: '' }))
    setVillages([])
    if (filters.gn_id) api.get('/villages', { params: { gn_id: filters.gn_id } }).then(r => setVillages(r.data))
  }, [filters.gn_id])

  const doSearch = useCallback(async (page = 1) => {
    setLoading(true)
    setSearched(true)
    try {
      const params = { ...filters, page, per_page: 25 }
      delete params.village_id
      const { data } = await api.get('/search', { params })
      const rows = filters.village_id ? data.data.filter(row => String(row.village_id) === String(filters.village_id)) : data.data
      setResults(rows)
      setMeta(filters.village_id ? { ...data, total: rows.length, last_page: 1, current_page: 1 } : data)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const clearSearch = () => {
    setFilters({ province_id: '', district_id: '', ds_id: '', gn_id: '', village_id: '', keyword: '' })
    setResults([]); setMeta(null); setSearched(false)
  }

  const exportUrl = type => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value && key !== 'village_id') params.set(key, value) })
    return `/api/export/search/${type}?${params}`
  }

  const fields = [
    { key: 'province_id', label: t('province'), options: provinces, placeholder: t('selectProvince') },
    { key: 'district_id', label: t('district'), options: districts, placeholder: t('selectDistrict'), disabled: !filters.province_id },
    { key: 'ds_id', label: t('ds'), options: dsList, placeholder: t('selectDs'), disabled: !filters.district_id },
    { key: 'gn_id', label: t('gn'), options: gnList, placeholder: t('selectGn'), disabled: !filters.ds_id },
    { key: 'village_id', label: t('village'), options: villages, placeholder: t('selectVillage'), disabled: !filters.gn_id },
  ]

  const resultName = (row, key) => row[`${key}_${language === 'si' ? 'sinhala' : language === 'ta' ? 'tamil' : 'english'}`] || row[key]
  const columns = [
    { key: 'province_name', label: t('province'), render: row => resultName(row, 'province_name') },
    { key: 'district_name', label: t('district'), render: row => resultName(row, 'district_name') },
    { key: 'ds_name', label: t('ds'), render: row => resultName(row, 'ds_name') },
    { key: 'gn_name', label: t('gn'), render: row => resultName(row, 'gn_name') },
    { key: 'gn_code', label: 'GN Code' },
    { key: 'gn_lifecode', label: 'GN Life Code' },
    { key: 'mpa_code', label: 'MPA Code' },
    { key: 'village_name', label: t('village'), render: row => resultName(row, 'village_name') },
    { key: 'village_lifecode', label: 'Village Life Code' },
  ]

  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">{t('publicService')}</span>
        <h1>{t('browseTitle')}</h1>
        <p>{t('browseDesc')}</p>
      </section>

      <section className="search-service">
        <form onSubmit={e => { e.preventDefault(); doSearch(1) }} className="keyword-search">
          <label htmlFor="location-keyword">{t('searchByName')}</label>
          <div className="keyword-search__row">
            <input id="location-keyword" type="search" placeholder={t('searchPlaceholder')}
              value={filters.keyword} onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))} />
            <button className="button button--primary" type="submit">{t('searchDirectory')}</button>
          </div>
        </form>

        <div className="section-divider"><span>{t('browseArea')}</span></div>

        <form onSubmit={e => { e.preventDefault(); doSearch(1) }} className="browse-form">
          {fields.map(field => (
            <div className="browse-form__row" key={field.key}>
              <label htmlFor={field.key}>{field.label}</label>
              <select id={field.key} value={filters[field.key]} disabled={field.disabled}
                onChange={e => setFilters(p => ({ ...p, [field.key]: e.target.value }))}>
                <option value="">{field.placeholder}</option>
                {field.options.map(option => <option key={option.id} value={option.id}>{localizedName(option)}</option>)}
              </select>
              <span className="record-count">{field.options.length || ''}</span>
            </div>
          ))}
          <div className="browse-form__actions">
            <button className="button button--primary" type="submit">{t('viewRecords')}</button>
            <button className="button button--secondary" type="button" onClick={clearSearch}>{t('clear')}</button>
          </div>
        </form>
      </section>

      {searched && (
        <section className="results-section">
          <div className="results-toolbar">
            <div>
              <span className="eyebrow">{t('searchResults')}</span>
              <h2>{loading ? t('searching') : t('recordsFound', { count: meta?.total ?? 0 })}</h2>
            </div>
            <div className="button-row button-row--compact">
              <a className="button button--secondary" href={exportUrl('excel')}>{t('downloadExcel')}</a>
              <a className="button button--secondary" href={exportUrl('pdf')}>{t('downloadPdf')}</a>
            </div>
          </div>
          <Table columns={columns} data={results} loading={loading} emptyMsg={t('noData')} />
          <Pagination meta={meta} onPage={doSearch} />
        </section>
      )}
    </>
  )
}
