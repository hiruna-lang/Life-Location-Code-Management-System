import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import Table from '../components/Table'
import Pagination from '../components/Pagination'
import { useLanguage } from '../context/LanguageContext'

const provinceMap = {
  northern: { color: '#ff8f66', points: '139,9 197,18 251,91 224,145 179,136 151,181 107,166 91,98 111,54' },
  'north central': { color: '#fff58a', points: '125,164 224,145 281,211 259,294 190,310 145,260 100,244' },
  'north-central': { color: '#fff58a', points: '125,164 224,145 281,211 259,294 190,310 145,260 100,244' },
  'north western': { color: '#ffc233', points: '65,200 125,164 145,260 185,315 150,381 75,365 50,286' },
  'north-western': { color: '#ffc233', points: '65,200 125,164 145,260 185,315 150,381 75,365 50,286' },
  western: { color: '#6ea0f6', points: '61,369 150,381 160,455 93,470 55,430' },
  central: { color: '#fa98a3', points: '165,315 230,295 260,370 225,435 165,455 150,381' },
  sabaragamuwa: { color: '#f06db7', points: '93,470 165,455 210,505 165,540 105,520' },
  southern: { color: '#a9ff3e', points: '165,540 210,505 285,500 330,525 285,555 210,570' },
  uva: { color: '#15d2d2', points: '230,370 300,355 325,430 285,500 210,505 165,455' },
  eastern: { color: '#838900', points: '260,210 320,250 335,380 325,430 300,355 260,370 230,295' },
}

const levelCopy = {
  province: { title: 'Select a province', hint: 'Start with the national map' },
  district: { title: 'Select a district', hint: 'Zoomed province area' },
  ds: { title: 'Select a divisional secretariat', hint: 'District administrative layer' },
  gn: { title: 'Select a GN division', hint: 'DS division layer' },
  village: { title: 'Select a village', hint: 'Village layer' },
}

const normalize = value => String(value || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim()

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

  useEffect(() => { api.get('/v1/locations/provinces').then(r => setProvinces(r.data)) }, [])

  useEffect(() => {
    setFilters(p => ({ ...p, district_id: '', ds_id: '', gn_id: '', village_id: '' }))
    setDistricts([]); setDsList([]); setGnList([]); setVillages([])
    if (filters.province_id) api.get('/v1/locations/districts', { params: { province_id: filters.province_id } }).then(r => setDistricts(r.data))
  }, [filters.province_id])

  useEffect(() => {
    setFilters(p => ({ ...p, ds_id: '', gn_id: '', village_id: '' }))
    setDsList([]); setGnList([]); setVillages([])
    if (filters.district_id) api.get('/v1/locations/divisional-secretariats', { params: { district_id: filters.district_id } }).then(r => setDsList(r.data))
  }, [filters.district_id])

  useEffect(() => {
    setFilters(p => ({ ...p, gn_id: '', village_id: '' }))
    setGnList([]); setVillages([])
    if (filters.ds_id) api.get('/v1/locations/gn-divisions', { params: { ds_id: filters.ds_id } }).then(r => setGnList(r.data))
  }, [filters.ds_id])

  useEffect(() => {
    setFilters(p => ({ ...p, village_id: '' }))
    setVillages([])
    if (filters.gn_id) api.get('/v1/locations/villages', { params: { gn_id: filters.gn_id } }).then(r => setVillages(r.data))
  }, [filters.gn_id])

  const doSearch = useCallback(async (page = 1) => {
    setLoading(true)
    setSearched(true)
    try {
      const params = { ...filters, page, per_page: 25 }
      delete params.village_id
      const { data } = await api.get('/v1/search', { params })
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

  const selectArea = (key, value) => {
    setFilters(p => ({ ...p, [key]: String(value) }))
    setResults([])
    setMeta(null)
    setSearched(false)
  }

  const selected = {
    province: provinces.find(item => String(item.id) === String(filters.province_id)),
    district: districts.find(item => String(item.id) === String(filters.district_id)),
    ds: dsList.find(item => String(item.id) === String(filters.ds_id)),
    gn: gnList.find(item => String(item.id) === String(filters.gn_id)),
    village: villages.find(item => String(item.id) === String(filters.village_id)),
  }

  const mapLevel = !filters.province_id ? 'province'
    : !filters.district_id ? 'district'
      : !filters.ds_id ? 'ds'
        : !filters.gn_id ? 'gn'
          : 'village'

  const mapItems = {
    province: provinces,
    district: districts,
    ds: dsList,
    gn: gnList,
    village: villages,
  }[mapLevel]

  const mapKey = {
    province: 'province_id',
    district: 'district_id',
    ds: 'ds_id',
    gn: 'gn_id',
    village: 'village_id',
  }[mapLevel]

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

        <section className="map-browser" aria-label="Administrative map browser">
          <div className="map-browser__stage">
            <div className="map-browser__heading">
              <span>{levelCopy[mapLevel].hint}</span>
              <h2>{levelCopy[mapLevel].title}</h2>
            </div>

            {mapLevel === 'province' ? (
              <SriLankaProvinceMap
                provinces={provinces}
                selectedId={filters.province_id}
                localizedName={localizedName}
                onSelect={id => selectArea('province_id', id)}
              />
            ) : (
              <AdministrativeMap
                level={mapLevel}
                items={mapItems}
                selectedId={filters[mapKey]}
                localizedName={localizedName}
                onSelect={id => selectArea(mapKey, id)}
              />
            )}
          </div>

          <aside className="map-browser__panel">
            <span className="eyebrow">Current path</span>
            <ol className="map-path">
              {fields.map(field => {
                const pathKey = field.key.replace('_id', '')
                const activeItem = selected[pathKey]
                return (
                  <li key={field.key} className={activeItem ? 'is-selected' : ''}>
                    <span>{field.label}</span>
                    <strong>{activeItem ? localizedName(activeItem) : field.placeholder}</strong>
                  </li>
                )
              })}
            </ol>

            <div className="map-browser__actions">
              <button className="button button--primary button--full" type="button" onClick={() => doSearch(1)}>{t('viewRecords')}</button>
              <button className="button button--secondary button--full" type="button" onClick={clearSearch}>{t('clear')}</button>
            </div>
          </aside>
        </section>
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

function SriLankaProvinceMap({ provinces, selectedId, localizedName, onSelect }) {
  return (
    <div className="sri-lanka-map" aria-label="Sri Lanka province map">
      <svg viewBox="0 0 390 590" role="img" aria-label="Clickable Sri Lanka province map">
        <defs>
          <filter id="provinceShadow" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="16" stdDeviation="10" floodColor="#172c45" floodOpacity=".2" />
          </filter>
        </defs>
        <g className="sri-lanka-map__land" filter="url(#provinceShadow)">
          {provinces.map(province => {
            const key = normalize(province.name_english)
            const shape = provinceMap[key] || provinceMap[key.replace(' ', '-')]
            if (!shape) return null
            const isSelected = String(selectedId) === String(province.id)
            return (
              <g
                key={province.id}
                role="button"
                tabIndex="0"
                className={`province-shape ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelect(province.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') onSelect(province.id)
                }}
              >
                <polygon points={shape.points} fill={shape.color} />
                <title>{localizedName(province)}</title>
              </g>
            )
          })}
        </g>
      </svg>
      <div className="province-legend">
        {provinces.map(province => {
          const key = normalize(province.name_english)
          const shape = provinceMap[key] || provinceMap[key.replace(' ', '-')]
          return (
            <button
              type="button"
              key={province.id}
              className={String(selectedId) === String(province.id) ? 'is-selected' : ''}
              onClick={() => onSelect(province.id)}
            >
              <span style={{ background: shape?.color || '#c49a42' }} />
              {localizedName(province)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AdministrativeMap({ level, items, selectedId, localizedName, onSelect }) {
  return (
    <div className={`admin-map admin-map--${level}`}>
      <div className="admin-map__surface">
        {items.length ? items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`admin-region admin-region--${index % 8} ${String(selectedId) === String(item.id) ? 'is-selected' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{localizedName(item)}</strong>
          </button>
        )) : (
          <div className="admin-map__empty">Loading administrative areas...</div>
        )}
      </div>
    </div>
  )
}
