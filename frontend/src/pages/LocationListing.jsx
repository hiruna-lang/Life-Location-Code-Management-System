import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { locationApi } from '../services/locationApi'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/axios'
import './LocationListing.css'

const RESULTS_PER_PAGE = 10

export default function LocationListing() {
  const { t, localizedName } = useLanguage()

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [dsList, setDsList] = useState([])
  const [gnList, setGnList] = useState([])

  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedDs, setSelectedDs] = useState('')
  const [selectedGn, setSelectedGn] = useState('')

  const [includeVillages, setIncludeVillages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPicker, setLoadingPicker] = useState(false)

  const [results, setResults] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterText, setFilterText] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [sortBy, setSortBy] = useState('name')

  const [activePicker, setActivePicker] = useState(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerSort, setPickerSort] = useState('name')

  const resultsRef = useRef(null)
  const pickerRef = useRef(null)

  useEffect(() => {
    locationApi.provinces().then(setProvinces).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activePicker) return
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          !e.target.closest('.filter-field')) {
        setActivePicker(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activePicker])

  const loadAllDistricts = useCallback(async () => {
    setLoadingPicker(true)
    try {
      const groups = await Promise.all(
        provinces.map(p => locationApi.districts(p.id).catch(() => []))
      )
      setDistricts(groups.flat())
    } catch {
      setDistricts([])
    } finally {
      setLoadingPicker(false)
    }
  }, [provinces])

  const loadAllDs = useCallback(async (districtScope) => {
    setLoadingPicker(true)
    try {
      const groups = await Promise.all(
        districtScope.map(d => locationApi.divisionalSecretariats(d.id).catch(() => []))
      )
      setDsList(groups.flat())
    } catch {
      setDsList([])
    } finally {
      setLoadingPicker(false)
    }
  }, [])

  const loadAllGn = useCallback(async (dsScope) => {
    setLoadingPicker(true)
    try {
      const groups = await Promise.all(
        dsScope.map(ds => locationApi.gnDivisions(ds.id).catch(() => []))
      )
      setGnList(groups.flat())
    } catch {
      setGnList([])
    } finally {
      setLoadingPicker(false)
    }
  }, [])

  const isProvinceNone = selectedProvince === 'none'
  const isDistrictNone = selectedDistrict === 'none'
  const isDsNone = selectedDs === 'none'
  const isGnNone = selectedGn === 'none'
  const hasNoneSelected = isProvinceNone || isDistrictNone || isDsNone || isGnNone

  useEffect(() => {
    if (hasNoneSelected) setIncludeVillages(false)
  }, [hasNoneSelected])

  const openPicker = useCallback(async (level) => {
    if (activePicker === level) {
      setActivePicker(null)
      return
    }
    setPickerSearch('')
    setPickerSort('name')
    setActivePicker(level)

    if (level === 'province') {
      if (provinces.length === 0) {
        setLoadingPicker(true)
        try {
          const data = await locationApi.provinces()
          setProvinces(data)
        } catch { /* empty */ }
        setLoadingPicker(false)
      }
      return
    }

    if (level === 'district') {
      setLoadingPicker(true)
      try {
        if (selectedProvince && selectedProvince !== 'all' && selectedProvince !== 'none') {
          const data = await locationApi.districts(selectedProvince)
          setDistricts(data)
        } else if (districts.length === 0) {
          await loadAllDistricts()
        }
      } catch { setDistricts([]) }
      setLoadingPicker(false)
      return
    }

    if (level === 'ds') {
      setLoadingPicker(true)
      try {
        if (selectedDistrict && selectedDistrict !== 'all' && selectedDistrict !== 'none') {
          const data = await locationApi.divisionalSecretariats(selectedDistrict)
          setDsList(data)
        } else if (selectedProvince && selectedProvince !== 'all' && selectedProvince !== 'none') {
          const provDistricts = districts.filter(d => String(d.province_id) === String(selectedProvince))
          if (provDistricts.length > 0) await loadAllDs(provDistricts)
          else setDsList([])
        } else if (dsList.length === 0) {
          await loadAllDs(districts)
        }
      } catch { setDsList([]) }
      setLoadingPicker(false)
      return
    }

    if (level === 'gn') {
      setLoadingPicker(true)
      try {
        if (selectedDs && selectedDs !== 'all' && selectedDs !== 'none') {
          const data = await locationApi.gnDivisions(selectedDs)
          setGnList(data)
        } else if (selectedDistrict && selectedDistrict !== 'all' && selectedDistrict !== 'none') {
          const distDs = dsList.filter(ds => String(ds.district_id) === String(selectedDistrict))
          if (distDs.length > 0) await loadAllGn(distDs)
          else setGnList([])
        } else if (gnList.length === 0) {
          await loadAllGn(dsList)
        }
      } catch { setGnList([]) }
      setLoadingPicker(false)
      return
    }
  }, [activePicker, provinces, districts, dsList, selectedProvince, selectedDistrict, selectedDs, loadAllDistricts, loadAllDs, loadAllGn])

  const pickerItems = useMemo(() => {
    if (!activePicker) return []
    let items = []
    const normalize = s => String(s || '').toLowerCase()

    if (activePicker === 'province') {
      items = provinces.map(p => ({
        id: String(p.id),
        name: localizedName(p),
        code: p.lifecode || p.province_code || '',
        raw: p,
      }))
    } else if (activePicker === 'district') {
      items = districts.map(d => ({
        id: String(d.id),
        name: localizedName(d),
        code: d.lifecode || d.district_code || '',
        raw: d,
      }))
    } else if (activePicker === 'ds') {
      const isAllDistricts = selectedDistrict === 'all' || selectedDistrict === ''
      items = dsList.map(ds => {
        const parentDistrict = districts.find(d => String(d.id) === String(ds.district_id))
        return {
          id: String(ds.id),
          name: localizedName(ds),
          code: ds.lifecode || ds.divisional_secretariat_code || '',
          parentName: isAllDistricts && parentDistrict ? localizedName(parentDistrict) : null,
          raw: ds,
        }
      })
    } else if (activePicker === 'gn') {
      const isAllDs = selectedDs === 'all' || selectedDs === ''
      items = gnList.map(gn => {
        const parentDs = dsList.find(ds => String(ds.id) === String(gn.divisional_secretariat_id))
        return {
          id: String(gn.id),
          name: localizedName(gn),
          code: gn.lifecode || gn.grama_niladhari_division_code || '',
          parentName: isAllDs && parentDs ? localizedName(parentDs) : null,
          raw: gn,
        }
      })
    }

    if (pickerSearch.trim()) {
      const term = normalize(pickerSearch)
      items = items.filter(item =>
        normalize(item.name).includes(term) ||
        normalize(item.code).includes(term) ||
        (item.parentName && normalize(item.parentName).includes(term))
      )
    }

    items.sort((a, b) => {
      if (pickerSort === 'code') {
        return String(a.code).localeCompare(String(b.code))
      }
      return String(a.name).localeCompare(String(b.name))
    })

    return items
  }, [activePicker, provinces, districts, dsList, gnList, pickerSearch, pickerSort, localizedName, selectedDistrict, selectedDs])

  const handlePickerSelect = useCallback(async (level, id) => {
    if (level === 'province') {
      setSelectedProvince(id)
      setSelectedDistrict('')
      setSelectedDs('')
      setSelectedGn('')
      setDsList([])
      setGnList([])
      if (id === 'all') {
        await loadAllDistricts()
      } else {
        setDistricts([])
      }
    } else if (level === 'district') {
      setSelectedDistrict(id)
      setSelectedDs('')
      setSelectedGn('')
      setGnList([])
      if (id === 'all' && selectedProvince && selectedProvince !== 'none') {
        setLoadingPicker(true)
        try {
          const provDistricts = selectedProvince === 'all' ? districts : districts
          await loadAllDs(provDistricts)
        } catch { setDsList([]) }
        setLoadingPicker(false)
      } else {
        setDsList([])
      }
    } else if (level === 'ds') {
      setSelectedDs(id)
      setSelectedGn('')
      if (id === 'all') {
        setLoadingPicker(true)
        try {
          const dsScope = selectedDistrict === 'all' ? dsList : dsList
          await loadAllGn(dsScope)
        } catch { setGnList([]) }
        setLoadingPicker(false)
      } else {
        setGnList([])
      }
    } else if (level === 'gn') {
      setSelectedGn(id)
    }
    setActivePicker(null)
  }, [districts, dsList, selectedProvince, selectedDistrict, loadAllDistricts, loadAllDs, loadAllGn])

  const clearField = useCallback((level, e) => {
    e.stopPropagation()
    if (level === 'province') {
      setSelectedProvince('')
      setSelectedDistrict('')
      setSelectedDs('')
      setSelectedGn('')
      setDistricts([])
      setDsList([])
      setGnList([])
    } else if (level === 'district') {
      setSelectedDistrict('')
      setSelectedDs('')
      setSelectedGn('')
      setDsList([])
      setGnList([])
    } else if (level === 'ds') {
      setSelectedDs('')
      setSelectedGn('')
      setGnList([])
    } else if (level === 'gn') {
      setSelectedGn('')
    }
  }, [])

  const getFieldValue = (level) => {
    if (level === 'province') {
      if (!selectedProvince) return ''
      if (selectedProvince === 'all') return t('allProvinces')
      if (selectedProvince === 'none') return t('noneOption')
      const p = provinces.find(x => String(x.id) === String(selectedProvince))
      return p ? localizedName(p) : ''
    }
    if (level === 'district') {
      if (!selectedDistrict) return ''
      if (selectedDistrict === 'all') return t('allDistricts')
      if (selectedDistrict === 'none') return t('noneOption')
      const d = districts.find(x => String(x.id) === String(selectedDistrict))
      return d ? localizedName(d) : ''
    }
    if (level === 'ds') {
      if (!selectedDs) return ''
      if (selectedDs === 'all') return t('allDs')
      if (selectedDs === 'none') return t('noneOption')
      const ds = dsList.find(x => String(x.id) === String(selectedDs))
      return ds ? localizedName(ds) : ''
    }
    if (level === 'gn') {
      if (!selectedGn) return ''
      if (selectedGn === 'all') return t('allGn')
      if (selectedGn === 'none') return t('noneOption')
      const gn = gnList.find(x => String(x.id) === String(selectedGn))
      return gn ? localizedName(gn) : ''
    }
    return ''
  }

  const getPickerLabel = (level) => {
    if (level === 'province') return t('selectProvince')
    if (level === 'district') return t('selectDistrict')
    if (level === 'ds') return t('selectDs')
    if (level === 'gn') return t('selectGn')
    return ''
  }

  const handleSearch = useCallback(async (page = 1, sortOverride = null) => {
    setLoading(true)
    setHasSearched(true)
    setCurrentPage(page)
    setFilterText('')
    setActivePicker(null)

    const activeSort = sortOverride !== null ? sortOverride : sortBy

    try {
      const params = {
        per_page: RESULTS_PER_PAGE,
        page,
        include_villages: hasNoneSelected ? '0' : (includeVillages ? '1' : '0'),
        sort_by: activeSort,
      }
      if (selectedProvince) params.province_id = selectedProvince
      if (selectedDistrict) params.district_id = selectedDistrict
      if (selectedDs) params.ds_id = selectedDs
      if (selectedGn) params.gn_id = selectedGn

      const { data } = await api.get('/search', { params })
      setResults(data.data || [])
      setTotalPages(data.last_page || 1)
      setTotalCount(data.total || 0)
    } catch {
      setResults([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [selectedProvince, selectedDistrict, selectedDs, selectedGn, includeVillages, hasNoneSelected, sortBy])

  const handlePageChange = useCallback((newPage) => {
    handleSearch(newPage)
  }, [handleSearch])

  const handleExport = useCallback(async (format) => {
    const params = {
      include_villages: hasNoneSelected ? '0' : (includeVillages ? '1' : '0'),
      sort_by: sortBy,
    }
    if (selectedProvince) params.province_id = selectedProvince
    if (selectedDistrict) params.district_id = selectedDistrict
    if (selectedDs) params.ds_id = selectedDs
    if (selectedGn) params.gn_id = selectedGn

    const query = new URLSearchParams(params).toString()
    const url = format === 'excel'
      ? `/export/listing/excel?${query}`
      : `/export/listing/pdf?${query}`

    try {
      const response = await api.get(url, { responseType: 'blob' })
      const contentType = response.headers['content-type']
      if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/vnd') || contentType.includes('octet-stream'))) {
        const blob = new Blob([response.data], { type: contentType })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = format === 'excel' ? 'location_listing.xlsx' : 'location_listing.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
      }
    } catch {
      window.open(`/api${url}`, '_blank')
    }
  }, [selectedProvince, selectedDistrict, selectedDs, selectedGn, includeVillages, hasNoneSelected, sortBy])

  const filteredResults = useMemo(() => {
    if (!filterText.trim()) return results
    const term = filterText.toLowerCase()
    return results.filter(row => {
      const fields = [
        row.province_name, row.province_name_sinhala, row.province_name_tamil,
        row.province_lifecode, row.province_code,
        row.district_name, row.district_name_sinhala, row.district_name_tamil,
        row.district_lifecode, row.district_code,
        row.ds_name, row.ds_name_sinhala, row.ds_name_tamil,
        row.ds_lifecode, row.ds_code,
        row.gn_name, row.gn_name_sinhala, row.gn_name_tamil,
        row.gn_lifecode, row.gn_code,
        row.village_name, row.village_name_sinhala, row.village_name_tamil,
        row.village_lifecode,
      ]
      return fields.some(f => String(f || '').toLowerCase().includes(term))
    })
  }, [results, filterText])

  const tableColumns = useMemo(() => {
    if (filteredResults.length === 0) return []
    const first = filteredResults[0]
    const cols = []
    if (first.province_name) {
      cols.push({ key: 'province_name', label: t('province'), nameFields: ['province_name', 'province_name_sinhala', 'province_name_tamil'] })
      cols.push({ key: 'province_lifecode', label: t('province') + ' (LC)', raw: 'province_lifecode' })
    }
    if (first.district_name) {
      cols.push({ key: 'district_name', label: t('district'), nameFields: ['district_name', 'district_name_sinhala', 'district_name_tamil'] })
      cols.push({ key: 'district_lifecode', label: t('district') + ' (LC)', raw: 'district_lifecode' })
    }
    if (first.ds_name) {
      cols.push({ key: 'ds_name', label: t('ds'), nameFields: ['ds_name', 'ds_name_sinhala', 'ds_name_tamil'] })
      cols.push({ key: 'ds_lifecode', label: t('ds') + ' (LC)', raw: 'ds_lifecode' })
    }
    if (first.gn_name) {
      cols.push({ key: 'gn_name', label: t('gn'), nameFields: ['gn_name', 'gn_name_sinhala', 'gn_name_tamil'] })
      cols.push({ key: 'gn_lifecode', label: t('gn') + ' (LC)', raw: 'gn_lifecode' })
    }
    if (first.village_name) {
      cols.push({ key: 'village_name', label: t('village'), nameFields: ['village_name', 'village_name_sinhala', 'village_name_tamil'] })
      cols.push({ key: 'village_lifecode', label: t('village') + ' (LC)', raw: 'village_lifecode' })
    }
    return cols
  }, [filteredResults, t])

  const handleResultClick = useCallback((row) => {
    if (row.province_id) setSelectedProvince(String(row.province_id))
    if (row.district_id) setSelectedDistrict(String(row.district_id))
    if (row.ds_id) setSelectedDs(String(row.ds_id))
    if (row.gn_id) setSelectedGn(String(row.gn_id))
    setResults([])
    setHasSearched(false)
    setFilterText('')
    setTotalCount(0)
    setTotalPages(1)
    setCurrentPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const formatResultPath = (row) => {
    const parts = []
    if (row.province_name) {
      parts.push({
        name: localizedName({ name_english: row.province_name, name_sinhala: row.province_name_sinhala, name_tamil: row.province_name_tamil }) || row.province_name,
        code: row.province_lifecode || row.province_code || '',
      })
    }
    if (row.district_name) {
      parts.push({
        name: localizedName({ name_english: row.district_name, name_sinhala: row.district_name_sinhala, name_tamil: row.district_name_tamil }) || row.district_name,
        code: row.district_lifecode || row.district_code || '',
      })
    }
    if (row.ds_name) {
      parts.push({
        name: localizedName({ name_english: row.ds_name, name_sinhala: row.ds_name_sinhala, name_tamil: row.ds_name_tamil }) || row.ds_name,
        code: row.ds_lifecode || row.ds_code || '',
      })
    }
    if (row.gn_name) {
      parts.push({
        name: localizedName({ name_english: row.gn_name, name_sinhala: row.gn_name_sinhala, name_tamil: row.gn_name_tamil }) || row.gn_name,
        code: row.gn_lifecode || row.gn_code || '',
      })
    }
    if (row.village_name) {
      parts.push({
        name: localizedName({ name_english: row.village_name, name_sinhala: row.village_name_sinhala, name_tamil: row.village_name_tamil }) || row.village_name,
        code: row.village_lifecode || '',
      })
    }
    return parts
  }

  const isDistrictDisabled = isProvinceNone
  const isDsDisabled = isProvinceNone || isDistrictNone
  const isGnDisabled = isProvinceNone || isDistrictNone || isDsNone

  return (
    <div className="location-listing-page">
      <header className="location-listing-heading">
        <span>{t('locationListing')}</span>
        <h1>{t('listingTitle')}</h1>
        <p>{t('listingDescription')}</p>
      </header>

      <div className="location-listing-top">
        <aside className="location-listing-filters">
          <div
            className={`filter-field${activePicker === 'province' ? ' filter-field--active' : ''}`}
            onClick={() => openPicker('province')}
          >
            <label>{t('province')}</label>
            <div className="filter-field__value">
              <span>{getFieldValue('province') || t('selectProvince')}</span>
              {selectedProvince && (
                <button type="button" className="filter-field__clear" onClick={(e) => clearField('province', e)} aria-label={t('clearSelection')}>×</button>
              )}
            </div>
          </div>

          <div
            className={`filter-field${isDistrictDisabled ? ' filter-field--disabled' : ''}${activePicker === 'district' ? ' filter-field--active' : ''}`}
            onClick={() => !isDistrictDisabled && openPicker('district')}
          >
            <label>{t('district')}</label>
            <div className="filter-field__value">
              <span>{isDistrictDisabled ? '—' : (getFieldValue('district') || t('selectDistrict'))}</span>
              {selectedDistrict && !isDistrictDisabled && (
                <button type="button" className="filter-field__clear" onClick={(e) => clearField('district', e)} aria-label={t('clearSelection')}>×</button>
              )}
            </div>
          </div>

          <div
            className={`filter-field${isDsDisabled ? ' filter-field--disabled' : ''}${activePicker === 'ds' ? ' filter-field--active' : ''}`}
            onClick={() => !isDsDisabled && openPicker('ds')}
          >
            <label>{t('ds')}</label>
            <div className="filter-field__value">
              <span>{isDsDisabled ? '—' : (getFieldValue('ds') || t('selectDs'))}</span>
              {selectedDs && !isDsDisabled && (
                <button type="button" className="filter-field__clear" onClick={(e) => clearField('ds', e)} aria-label={t('clearSelection')}>×</button>
              )}
            </div>
          </div>

          <div
            className={`filter-field${isGnDisabled ? ' filter-field--disabled' : ''}${activePicker === 'gn' ? ' filter-field--active' : ''}`}
            onClick={() => !isGnDisabled && openPicker('gn')}
          >
            <label>{t('gn')}</label>
            <div className="filter-field__value">
              <span>{isGnDisabled ? '—' : (getFieldValue('gn') || t('selectGn'))}</span>
              {selectedGn && !isGnDisabled && (
                <button type="button" className="filter-field__clear" onClick={(e) => clearField('gn', e)} aria-label={t('clearSelection')}>×</button>
              )}
            </div>
          </div>

          <label className={`filter-checkbox${hasNoneSelected ? ' filter-checkbox--disabled' : ''}`}>
            <input
              type="checkbox"
              checked={includeVillages}
              disabled={hasNoneSelected}
              onChange={e => setIncludeVillages(e.target.checked)}
            />
            {t('includeVillages')}
          </label>

          <button
            type="button"
            className="filter-search-btn"
            onClick={() => handleSearch(1)}
            disabled={loading}
          >
            {loading ? t('searching') : t('searchLocations')}
          </button>
        </aside>

        <section className="location-listing-picker" ref={pickerRef}>
          {activePicker ? (
            <>
              <div className="picker-header">
                <h3>{getPickerLabel(activePicker)}</h3>
                <div className="picker-controls">
                  <input
                    type="search"
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    placeholder={t('filterResults')}
                    className="picker-search"
                    autoFocus
                  />
                  <select
                    value={pickerSort}
                    onChange={e => setPickerSort(e.target.value)}
                    className="picker-sort"
                  >
                    <option value="name">{t('sortName')}</option>
                    <option value="code">{t('sortOrder')}</option>
                  </select>
                </div>
              </div>
              <div className="picker-body">
                {loadingPicker ? (
                  <div className="picker-loading"><span className="results-spinner" /></div>
                ) : pickerItems.length === 0 ? (
                  <div className="picker-empty">{t('noResultsFound')}</div>
                ) : (
                  <ul className="picker-list">
                    <li>
                      <button
                        type="button"
                        className="picker-item picker-item--special"
                        onClick={() => handlePickerSelect(activePicker, 'all')}
                      >
                        <span className="picker-item-name">{t('allOption')}</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="picker-item picker-item--special"
                        onClick={() => handlePickerSelect(activePicker, 'none')}
                      >
                        <span className="picker-item-name">{t('noneOption')}</span>
                      </button>
                    </li>
                    {pickerItems.map(item => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="picker-item"
                          onClick={() => handlePickerSelect(activePicker, item.id)}
                        >
                          <span className="picker-item-name">
                            {item.parentName && <span className="picker-item-parent">{item.parentName} {'>'} </span>}
                            {item.name}
                          </span>
                          {item.code && <span className="picker-item-code">{item.code}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="picker-placeholder">
              <p>{t('clickToSelect')}</p>
            </div>
          )}
        </section>
      </div>

      {hasSearched && (
        <section className="location-listing-results" ref={resultsRef}>
          <div className="results-top-bar">
            <div className="results-top-left">
              <h2>{t('searchResults')}</h2>
              {totalCount > 0 && (
                <span className="results-count">{t('resultsCount', { count: totalCount })}</span>
              )}
            </div>
            <div className="results-top-right">
              <div className="results-sort">
                <label>{t('sortBy')}:</label>
                <select value={sortBy} onChange={e => { const val = e.target.value; setSortBy(val); if (hasSearched) handleSearch(1, val) }}>
                  <option value="name">{t('sortName')}</option>
                  <option value="code">{t('sortOrder')}</option>
                </select>
              </div>
              <div className="results-exports">
                <button type="button" className="export-btn export-btn--excel" onClick={() => handleExport('excel')}>
                  {t('downloadExcel')}
                </button>
                <button type="button" className="export-btn export-btn--pdf" onClick={() => handleExport('pdf')}>
                  {t('downloadPdf')}
                </button>
              </div>
            </div>
          </div>

          <div className="results-filter-bar">
            <input
              type="search"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder={t('filterResults')}
              aria-label={t('filterResults')}
            />
          </div>

          <div className="results-body">
            {loading && (
              <div className="results-loading">
                <span className="results-spinner" />
                {t('searching')}
              </div>
            )}

            {!loading && filteredResults.length === 0 && (
              <div className="results-empty">{t('noResultsFound')}</div>
            )}

            {!loading && filteredResults.length > 0 && (
              <div className="results-table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      {tableColumns.map(col => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((row, idx) => (
                      <tr
                        key={row.village_id || row.gn_id || row.ds_id || row.district_id || row.province_id || idx}
                        className="results-table-row"
                        onClick={() => handleResultClick(row)}
                      >
                        {tableColumns.map(col => (
                          <td key={col.key}>
                            {col.nameFields
                              ? localizedName({
                                  name_english: row[col.nameFields[0]],
                                  name_sinhala: row[col.nameFields[1]],
                                  name_tamil: row[col.nameFields[2]],
                                }) || row[col.nameFields[0]]
                              : row[col.raw] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="results-pagination">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                {t('previous')}
              </button>
              <span className="pagination-info">{t('pageOf', { current: currentPage, total: totalPages })}</span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                {t('next')}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
