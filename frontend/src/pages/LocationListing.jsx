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
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingDs, setLoadingDs] = useState(false)
  const [loadingGn, setLoadingGn] = useState(false)

  const [results, setResults] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterText, setFilterText] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const resultsRef = useRef(null)

  useEffect(() => {
    locationApi.provinces().then(setProvinces).catch(() => {})
  }, [])

  const loadAllDistricts = useCallback(async () => {
    setLoadingDistricts(true)
    try {
      const groups = await Promise.all(
        provinces.map(p => locationApi.districts(p.id).catch(() => []))
      )
      const all = groups.flat()
      setDistricts(all)
    } catch {
      setDistricts([])
    } finally {
      setLoadingDistricts(false)
    }
  }, [provinces])

  const loadAllDs = useCallback(async (districtScope) => {
    setLoadingDs(true)
    try {
      const groups = await Promise.all(
        districtScope.map(d => locationApi.divisionalSecretariats(d.id).catch(() => []))
      )
      const all = groups.flat()
      setDsList(all)
    } catch {
      setDsList([])
    } finally {
      setLoadingDs(false)
    }
  }, [])

  const loadAllGn = useCallback(async (dsScope) => {
    setLoadingGn(true)
    try {
      const groups = await Promise.all(
        dsScope.map(ds => locationApi.gnDivisions(ds.id).catch(() => []))
      )
      const all = groups.flat()
      setGnList(all)
    } catch {
      setGnList([])
    } finally {
      setLoadingGn(false)
    }
  }, [])

  const handleProvinceChange = useCallback(async (e) => {
    const val = e.target.value
    setSelectedProvince(val)
    setSelectedDistrict('')
    setSelectedDs('')
    setSelectedGn('')
    setDsList([])
    setGnList([])

    if (val === '' || val === 'none') {
      setDistricts([])
      return
    }
    if (val === 'all') {
      await loadAllDistricts()
      return
    }
    setLoadingDistricts(true)
    try {
      const data = await locationApi.districts(val)
      setDistricts(data)
    } catch {
      setDistricts([])
    } finally {
      setLoadingDistricts(false)
    }
  }, [loadAllDistricts])

  const handleDistrictChange = useCallback(async (e) => {
    const val = e.target.value
    setSelectedDistrict(val)
    setSelectedDs('')
    setSelectedGn('')
    setGnList([])

    if (val === '' || val === 'none') {
      setDsList([])
      return
    }
    if (val === 'all') {
      await loadAllDs(districts)
      return
    }
    setLoadingDs(true)
    try {
      const data = await locationApi.divisionalSecretariats(val)
      setDsList(data)
    } catch {
      setDsList([])
    } finally {
      setLoadingDs(false)
    }
  }, [districts, loadAllDs])

  const handleDsChange = useCallback(async (e) => {
    const val = e.target.value
    setSelectedDs(val)
    setSelectedGn('')

    if (val === '' || val === 'none') {
      setGnList([])
      return
    }
    if (val === 'all') {
      await loadAllGn(dsList)
      return
    }
    setLoadingGn(true)
    try {
      const data = await locationApi.gnDivisions(val)
      setGnList(data)
    } catch {
      setGnList([])
    } finally {
      setLoadingGn(false)
    }
  }, [dsList, loadAllGn])

  const handleGnChange = useCallback((e) => {
    setSelectedGn(e.target.value)
  }, [])

  const isProvinceNone = selectedProvince === 'none'
  const isDistrictNone = selectedDistrict === 'none'
  const isDsNone = selectedDs === 'none'
  const isGnNone = selectedGn === 'none'
  const hasNoneSelected = isProvinceNone || isDistrictNone || isDsNone || isGnNone

  useEffect(() => {
    if (hasNoneSelected) {
      setIncludeVillages(false)
    }
  }, [hasNoneSelected])

  const handleSearch = useCallback(async (page = 1) => {
    setLoading(true)
    setHasSearched(true)
    setCurrentPage(page)
    setFilterText('')

    try {
      const params = {
        per_page: RESULTS_PER_PAGE,
        page,
        include_villages: hasNoneSelected ? '0' : (includeVillages ? '1' : '0'),
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
  }, [selectedProvince, selectedDistrict, selectedDs, selectedGn, includeVillages, hasNoneSelected])

  const handlePageChange = useCallback((newPage) => {
    handleSearch(newPage)
  }, [handleSearch])

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
  }, [])

  const formatResultPath = (row) => {
    const parts = []
    if (row.province_name) {
      const name = localizedName({ name_english: row.province_name, name_sinhala: row.province_name_sinhala, name_tamil: row.province_name_tamil }) || row.province_name
      const code = row.province_lifecode || row.province_code || ''
      parts.push({ name, code })
    }
    if (row.district_name) {
      const name = localizedName({ name_english: row.district_name, name_sinhala: row.district_name_sinhala, name_tamil: row.district_name_tamil }) || row.district_name
      const code = row.district_lifecode || row.district_code || ''
      parts.push({ name, code })
    }
    if (row.ds_name) {
      const name = localizedName({ name_english: row.ds_name, name_sinhala: row.ds_name_sinhala, name_tamil: row.ds_name_tamil }) || row.ds_name
      const code = row.ds_lifecode || row.ds_code || ''
      parts.push({ name, code })
    }
    if (row.gn_name) {
      const name = localizedName({ name_english: row.gn_name, name_sinhala: row.gn_name_sinhala, name_tamil: row.gn_name_tamil }) || row.gn_name
      const code = row.gn_lifecode || row.gn_code || ''
      parts.push({ name, code })
    }
    if (row.village_name) {
      const name = localizedName({ name_english: row.village_name, name_sinhala: row.village_name_sinhala, name_tamil: row.village_name_tamil }) || row.village_name
      const code = row.village_lifecode || ''
      parts.push({ name, code })
    }
    return parts
  }

  const showDistrictSelect = !isProvinceNone
  const showDsSelect = !isProvinceNone && !isDistrictNone
  const showGnSelect = !isProvinceNone && !isDistrictNone && !isDsNone

  return (
    <div className="location-listing-page">
      <header className="location-listing-heading">
        <span>{t('locationListing')}</span>
        <h1>{t('listingTitle')}</h1>
        <p>{t('listingDescription')}</p>
      </header>

      <div className="location-listing-layout">
        <aside className="location-listing-filters">
          <div className="filter-group">
            <label htmlFor="filter-province">{t('province')}</label>
            <select
              id="filter-province"
              value={selectedProvince}
              onChange={handleProvinceChange}
            >
              <option value="">{t('selectProvince')}</option>
              <option value="all">{t('allOption')}</option>
              <option value="none">{t('noneOption')}</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{localizedName(p)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-district">{t('district')}</label>
            <select
              id="filter-district"
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!showDistrictSelect}
            >
              <option value="">
                {loadingDistricts ? 'Loading…' : isProvinceNone ? t('noneOption') : t('selectDistrict')}
              </option>
              {showDistrictSelect && (
                <>
                  <option value="all">{t('allOption')}</option>
                  <option value="none">{t('noneOption')}</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{localizedName(d)}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-ds">{t('ds')}</label>
            <select
              id="filter-ds"
              value={selectedDs}
              onChange={handleDsChange}
              disabled={!showDsSelect}
            >
              <option value="">
                {loadingDs ? 'Loading…' : isDistrictNone ? t('noneOption') : t('selectDs')}
              </option>
              {showDsSelect && (
                <>
                  <option value="all">{t('allOption')}</option>
                  <option value="none">{t('noneOption')}</option>
                  {dsList.map(ds => (
                    <option key={ds.id} value={ds.id}>{localizedName(ds)}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-gn">{t('gn')}</label>
            <select
              id="filter-gn"
              value={selectedGn}
              onChange={handleGnChange}
              disabled={!showGnSelect}
            >
              <option value="">
                {loadingGn ? 'Loading…' : isDsNone ? t('noneOption') : t('selectGn')}
              </option>
              {showGnSelect && (
                <>
                  <option value="all">{t('allOption')}</option>
                  <option value="none">{t('noneOption')}</option>
                  {gnList.map(gn => (
                    <option key={gn.id} value={gn.id}>{localizedName(gn)}</option>
                  ))}
                </>
              )}
            </select>
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

        <section className="location-listing-results" ref={resultsRef}>
          <div className="results-header">
            <div className="results-search-icon" aria-hidden="true">🔍</div>
            <h2>{t('searchResults')}</h2>
          </div>

          {hasSearched && (
            <div className="results-filter-bar">
              <input
                type="search"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder={t('filterResults')}
                aria-label={t('filterResults')}
              />
              {totalCount > 0 && (
                <span className="results-count">{t('resultsCount', { count: totalCount })}</span>
              )}
            </div>
          )}

          <div className="results-body">
            {loading && (
              <div className="results-loading">
                <span className="results-spinner" />
                {t('searching')}
              </div>
            )}

            {!loading && hasSearched && filteredResults.length === 0 && (
              <div className="results-empty">{t('noResultsFound')}</div>
            )}

            {!loading && !hasSearched && results.length === 0 && (
              <div className="results-placeholder">{t('clickToSelect')}</div>
            )}

            {!loading && filteredResults.length > 0 && (
              <ul className="results-list">
                {filteredResults.map((row, idx) => {
                  const pathParts = formatResultPath(row)
                  return (
                    <li key={row.village_id || row.gn_id || row.ds_id || row.district_id || row.province_id || idx}>
                      <button
                        type="button"
                        className="result-item"
                        onClick={() => handleResultClick(row)}
                      >
                        <span className="result-path">
                          {pathParts.map((part, i) => (
                            <span key={i} className="result-path-segment">
                              {i > 0 && <span className="result-path-sep" aria-hidden="true">{'>'}</span>}
                              <span className="result-path-name">{part.name}</span>
                              {part.code && <span className="result-path-code">({part.code})</span>}
                            </span>
                          ))}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {!loading && totalPages > 1 && (
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
      </div>
    </div>
  )
}
