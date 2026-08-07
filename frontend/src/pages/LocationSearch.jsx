import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SriLanka3DMap from '../components/three-map/SriLanka3DMap'
import LocationResultTable from '../components/location/LocationResultTable'
import { locationApi, normalizeName } from '../services/locationApi'
import { useLanguage } from '../context/LanguageContext'
import './LocationSearch.css'

const friendlyApiError = 'Unable to load location data right now. Please check the Laravel API and try again.'
const provinceButtonColors = ['#2f628f', '#2f6f4e', '#a96f15', '#9f252d', '#6a65a8', '#168b8b', '#7d8b16', '#8a4f2a', '#712b31']
const smoothTransition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
const provinceConnectors = {
  northern: { path: 'M150 127 H220 L265 150', x: 265, y: 150 },
  northcentral: { path: 'M470 91 H430 L300 299', x: 300, y: 299 },
  eastern: { path: 'M470 189 H438 L392 358', x: 392, y: 358 },
  northwestern: { path: 'M150 251 H205 L227 354', x: 227, y: 354 },
  central: { path: 'M470 299 H420 L304 406', x: 304, y: 406 },
  western: { path: 'M150 381 H205 L221 440', x: 221, y: 440 },
  uva: { path: 'M470 419 H425 L368 457', x: 368, y: 457 },
  sabaragamuwa: { path: 'M174 503 H220 L250 452', x: 250, y: 452 },
  southern: { path: 'M448 519 H410 L304 533', x: 304, y: 533 },
}

export default function LocationSearch() {
  const { t, localizedName } = useLanguage()
  const [provinces, setProvinces] = useState([])
  const [allDistricts, setAllDistricts] = useState([])
  const [districts, setDistricts] = useState([])
  const [dsList, setDsList] = useState([])
  const [gnList, setGnList] = useState([])
  const [villages, setVillages] = useState([])
  const [selected, setSelected] = useState({
    province: null,
    district: null,
    districtFeature: null,
    ds: null,
    gn: null,
  })
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)
  const [apiError, setApiError] = useState('')
  const [directoryQuery, setDirectoryQuery] = useState('')
  const [lookupResults, setLookupResults] = useState([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupSelection, setLookupSelection] = useState(null)
  const resultTableRef = useRef(null)
  const lookupRequestRef = useRef(0)

  const loadAllDistrictsFor = async provinceList => {
    const districtGroups = await Promise.all(
      provinceList.map(province => locationApi.districts(province.id)
        .then(items => items.map(item => ({ ...item, province_id: item.province_id || province.id })))
        .catch(() => []))
    )
    const flattenedDistricts = districtGroups.flat()
    if (provinceList.length > 0 && flattenedDistricts.length === 0) {
      throw new Error('District API returned no records for all provinces.')
    }
    return flattenedDistricts
  }

  useEffect(() => {
    let mounted = true

    async function loadProvinces() {
      setLoadingInitial(true)
      try {
        const data = await locationApi.provinces()
        if (!mounted) return
        setProvinces(data)

        const loadedDistricts = await loadAllDistrictsFor(data)
        if (mounted) {
          setAllDistricts(loadedDistricts)
          setDistricts(loadedDistricts)
        }
      } catch (error) {
        if (mounted) setApiError(friendlyApiError)
      } finally {
        if (mounted) setLoadingInitial(false)
      }
    }

    loadProvinces()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const query = directoryQuery.trim()
    if (query.length < 2) {
      setLookupResults([])
      setLookupLoading(false)
      return undefined
    }

    const requestId = ++lookupRequestRef.current
    const timer = window.setTimeout(async () => {
      setLookupLoading(true)
      try {
        const data = await locationApi.lookup(query)
        if (requestId === lookupRequestRef.current) setLookupResults(data)
      } catch (error) {
        if (requestId === lookupRequestRef.current) setApiError(friendlyApiError)
      } finally {
        if (requestId === lookupRequestRef.current) setLookupLoading(false)
      }
    }, 280)

    return () => window.clearTimeout(timer)
  }, [directoryQuery])

  const matchApiRecord = (records, geoJsonName, type) => {
    const normalizedGeoJsonName = normalizeName(geoJsonName)
    const match = records.find(record => normalizeName(record.name_english) === normalizedGeoJsonName)
    if (!match) {
      console.warn(`Unmatched GeoJSON ${type} name: ${geoJsonName}`)
    }
    return match
  }

  const selectProvince = async province => {
    setSelected({ province, district: null, districtFeature: null, ds: null, gn: null })
    setDsList([])
    setGnList([])
    setVillages([])
    setApiError('')
    setLoadingPanel(true)

    try {
      const data = await locationApi.districts(province.id)
      setDistricts(data)
    } catch (error) {
      setApiError(friendlyApiError)
    } finally {
      setLoadingPanel(false)
    }
  }

  const selectDistrict = async (district, feature = null) => {
    const districtProvince = provinces.find(province => String(province.id) === String(district.province_id)) || selected.province
    const provinceDistricts = allDistricts.filter(item => String(item.province_id) === String(district.province_id))

    setSelected(current => ({ ...current, province: districtProvince, district, districtFeature: feature, ds: null, gn: null }))
    setDistricts(provinceDistricts.length ? provinceDistricts : districts)
    setDsList([])
    setGnList([])
    setVillages([])
    setApiError('')
    setLoadingPanel(true)

    try {
      const data = await locationApi.divisionalSecretariats(district.id)
      setDsList(data)
    } catch (error) {
      setApiError(friendlyApiError)
    } finally {
      setLoadingPanel(false)
    }
  }

  const handleDistrictClick = async feature => {
    if (loadingInitial) {
      setApiError('Location data is still loading. Please try again in a moment.')
      return
    }

    const districtName = feature.properties?.shapeName || ''
    let records = allDistricts.length ? allDistricts : districts
    let district = matchApiRecord(records, districtName, 'district')

    if (!district && provinces.length) {
      try {
        records = await loadAllDistrictsFor(provinces)
        setAllDistricts(records)
        if (!selected.province) setDistricts(records)
        district = matchApiRecord(records, districtName, 'district')
      } catch (error) {
        setApiError(friendlyApiError)
        return
      }
    }

    if (!district) {
      setApiError(`"${districtName}" could not be matched with the district records from the API.`)
      return
    }
    await selectDistrict(district, feature)
  }

  const handleDsClick = async ds => {
    setSelected(current => ({ ...current, ds, gn: null }))
    setGnList([])
    setVillages([])
    setApiError('')
    setLoadingPanel(true)

    try {
      const data = await locationApi.gnDivisions(ds.id)
      setGnList(data)
    } catch (error) {
      setApiError(friendlyApiError)
    } finally {
      setLoadingPanel(false)
    }
  }

  const handleGnClick = async gn => {
    setSelected(current => ({ ...current, gn }))
    setVillages([])
    setApiError('')
    setLoadingVillages(true)

    try {
      const data = await locationApi.villages(gn.id)
      setVillages(data)
    } catch (error) {
      setApiError(friendlyApiError)
    } finally {
      setLoadingVillages(false)
    }
  }

  useEffect(() => {
    if (!selected.gn || loadingVillages || lookupSelection || !resultTableRef.current) return
    resultTableRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [selected.gn, loadingVillages, villages, lookupSelection])

  const resetSelection = () => {
    setDistricts(allDistricts)
    setSelected({ province: null, district: null, districtFeature: null, ds: null, gn: null })
    setDsList([])
    setGnList([])
    setVillages([])
    setApiError('')
  }

  const backToDistrict = () => {
    if (!selected.province) {
      resetSelection()
      return
    }
    setDistricts(allDistricts.filter(item => String(item.province_id) === String(selected.province.id)))
    setSelected(current => ({ ...current, district: null, districtFeature: null, ds: null, gn: null }))
    setDsList([])
    setGnList([])
    setVillages([])
  }

  const chooseLookupResult = result => {
    setLookupSelection(result)
    setLookupOpen(false)
    setApiError('')
  }

  const closeLookupSelection = () => {
    setLookupSelection(null)
  }

  return (
    <div className="location-search-page">
      <DirectoryLookup
        query={directoryQuery}
        setQuery={setDirectoryQuery}
        results={lookupResults}
        loading={lookupLoading}
        open={lookupOpen}
        setOpen={setLookupOpen}
        onSelect={chooseLookupResult}
        localizedName={localizedName}
      />

      <motion.section
        className="location-dashboard"
        layout
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <motion.div className="location-map-card" layout transition={{ duration: 0.22, ease: 'easeOut' }}>
          <div className="location-map-stage">
            <AnimatePresence>
              {selected.district && (
                <motion.div
                  className="location-map-actions"
                  initial={{ opacity: 0, y: 10, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 10, x: '-50%' }}
                  transition={smoothTransition}
                >
                  <button type="button" onClick={backToDistrict}>{t('backToDistrictMap')}</button>
                  <button type="button" onClick={resetSelection}>{t('resetSelection')}</button>
                </motion.div>
              )}
            </AnimatePresence>
            <ProvinceButtonRow
              provinces={provinces}
              selectedId={selected.province?.id}
              onSelect={selectProvince}
              localizedName={localizedName}
            />
            <SriLanka3DMap
              selectedFeatureName={selected.districtFeature?.properties?.shapeName || selected.district?.name_english}
              selectedProvinceId={selected.province?.id}
              districtRecords={allDistricts}
              showAllDistricts
              onDistrictClick={handleDistrictClick}
            />
          </div>
        </motion.div>

        <motion.section
          className="location-hierarchy-card"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={smoothTransition}
        >
          <AnimatePresence>
            {apiError && (
              <motion.div
                className="location-panel-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={smoothTransition}
              >
                {apiError}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {loadingPanel && (
              <motion.div
                className="location-panel-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                role="status"
              >
                <span className="location-loading-spinner" />
                Loading next administrative level...
              </motion.div>
            )}
          </AnimatePresence>

          <div className="location-hierarchy-grid">
            <HierarchyColumn
              title={t('district')}
              items={districts}
              selectedId={selected.district?.id}
              onSelect={selectDistrict}
              emptyText={t('noDistricts')}
              searchLabel={t('searchArea', { area: t('district') })}
              noMatchesText={t('noMatchingRecords')}
              localizedName={localizedName}
            />
            <HierarchyColumn
              title={t('ds')}
              items={dsList}
              selectedId={selected.ds?.id}
              onSelect={handleDsClick}
              emptyText={selected.district ? t('noDsDivisions') : t('selectDistrictFirst')}
              searchLabel={t('searchArea', { area: t('ds') })}
              noMatchesText={t('noMatchingRecords')}
              localizedName={localizedName}
            />
            <HierarchyColumn
              title={t('gn')}
              items={gnList}
              selectedId={selected.gn?.id}
              onSelect={handleGnClick}
              emptyText={selected.ds ? t('noGnDivisions') : t('selectDsFirst')}
              searchLabel={t('searchArea', { area: t('gn') })}
              noMatchesText={t('noMatchingRecords')}
              localizedName={localizedName}
            />
          </div>
        </motion.section>
      </motion.section>

      <AnimatePresence>
        {(selected.gn || villages.length > 0 || loadingVillages) && (
          <motion.div
            ref={resultTableRef}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={smoothTransition}
          >
            <LocationResultTable villages={villages} loading={loadingVillages} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lookupSelection && (
          <LocationDetailModal
            result={lookupSelection}
            onClose={closeLookupSelection}
            localizedName={localizedName}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const lookupTypeLabels = {
  province: 'Province',
  district: 'District',
  ds: 'Divisional Secretariat',
  gn: 'GN Division',
  village: 'Village',
}

function DirectoryLookup({ query, setQuery, results, loading, open, setOpen, onSelect, localizedName }) {
  const showResults = open && query.trim().length >= 2

  return (
    <motion.section
      className="location-directory-lookup"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smoothTransition}
    >
      <div className="location-directory-lookup__intro location-directory-lookup__intro--compact">
        <strong>Search the national location directory</strong>
        <p>Find a province, district, DS division, GN division, village, or Life Location Code.</p>
      </div>
      <div className="location-directory-lookup__control">
        <span className="location-directory-lookup__icon" aria-hidden="true">⌕</span>
        <input
          id="directory-search"
          type="search"
          value={query}
          onChange={event => { setQuery(event.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Type a location name or Life Location Code"
          aria-label="Search all administrative locations"
          aria-expanded={showResults}
          autoComplete="off"
        />
        {loading && <span className="location-directory-lookup__spinner" aria-label="Searching" />}
        {query && !loading && (
          <button type="button" className="location-directory-lookup__clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>
        )}
        <button
          type="button"
          className="location-directory-lookup__submit"
          onClick={() => setOpen(true)}
          aria-label="Search directory"
        >
          <span>Search</span><b aria-hidden="true">›</b>
        </button>
        <AnimatePresence>
          {showResults && (
            <motion.div
              className="location-directory-results"
              initial={{ opacity: 0, y: -6, scale: .99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: .99 }}
              transition={smoothTransition}
            >
              {!loading && results.length === 0 && <div className="location-directory-results__empty">No matching locations found.</div>}
              {results.map(result => (
                <button type="button" key={`${result.type}-${result.id}`} onClick={() => onSelect(result)}>
                  <span className={`location-directory-results__type is-${result.type}`}>{lookupTypeLabels[result.type]}</span>
                  <span className="location-directory-results__copy">
                    <strong>{localizedName(result) || result.name_english}</strong>
                    <small>{lookupPath(result)}</small>
                  </span>
                  <span className="location-directory-results__code">{result.lifecode || '—'}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}

function LocationDetailModal({ result, onClose, localizedName }) {
  useEffect(() => {
    const closeOnEscape = event => { if (event.key === 'Escape') onClose() }
    const previousStyles = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      overscrollBehavior: document.body.style.overscrollBehavior,
    }
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousStyles.overflow
      document.body.style.paddingRight = previousStyles.paddingRight
      document.body.style.overscrollBehavior = previousStyles.overscrollBehavior
    }
  }, [])

  const levels = [
    ['Province', result.province_name, result.province_lifecode],
    ['District', result.district_name, result.district_lifecode],
    ['Divisional Secretariat', result.ds_name, result.ds_lifecode],
    ['GN Division', result.gn_name, result.gn_lifecode],
    ['Village', result.type === 'village' ? localizedName(result) || result.name_english : null, result.type === 'village' ? result.lifecode : null],
  ].filter(([, name]) => name)

  return (
    <motion.div
      className="location-detail-backdrop"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0 }}
      onMouseDown={onClose}
    >
      <motion.article
        className="location-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-detail-title"
        initial={{ opacity: 0, y: 18, scale: .985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: .99 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="location-detail-modal__header">
          <div className="location-detail-modal__header-main">
            <span className="location-detail-modal__location-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/><path d="M7.5 18.5h9"/></svg>
            </span>
            <div>
              <span className="location-detail-modal__eyebrow">{lookupTypeLabels[result.type]} found</span>
              <h2 id="location-detail-title">{localizedName(result) || result.name_english}</h2>
              <div className="location-detail-modal__header-code">
                <small>Life Location Code</small>
                <strong>{result.lifecode || 'Not available'}</strong>
              </div>
              <p>Official administrative hierarchy and Life Location Code</p>
            </div>
          </div>
          <div className="location-detail-modal__header-ornament" aria-hidden="true">
            <svg viewBox="0 0 360 160" preserveAspectRatio="xMidYMid slice">
              <path d="M20 152C91 104 143 103 221 129s112 3 152-31" />
              <path d="M-8 166C76 108 145 117 216 143s111 8 157-24" />
              <g transform="translate(250 42)">
                <path d="M36 61C19 49 17 28 35 13c13 16 15 32 1 48Z" />
                <path d="M39 61C56 49 58 28 40 13c-13 16-15 32-1 48Z" />
                <path d="M35 62C16 62 4 49 7 31c17 5 27 15 28 31Z" />
                <path d="M40 62c19 0 31-13 28-31-17 5-27 15-28 31Z" />
                <path d="M37 63C19 72 4 68 0 52c16-3 28 1 37 11Z" />
                <path d="M38 63c18 9 33 5 37-11-16-3-28 1-37 11Z" />
                <path d="M8 72h59" />
              </g>
            </svg>
          </div>
          <button type="button" onClick={onClose} aria-label="Close location details">×</button>
        </div>
        <div className="location-detail-modal__path">
          {levels.map(([label, name, code], index) => (
            <div key={label} className={index === levels.length - 1 ? 'is-current' : ''}>
              <span className="location-detail-modal__step-icon" aria-hidden="true">
                {index === levels.length - 1 ? (
                  <svg viewBox="0 0 24 24"><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/><path d="M7.5 18.5h9"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><path d="M3 9h18L12 3 3 9Z"/><path d="M5 10v7M9 10v7M15 10v7M19 10v7M3 19h18M2 21h20"/></svg>
                )}
              </span>
              <p><small>{label}</small><strong>{name}</strong></p>
              <em>{code || '—'}</em>
            </div>
          ))}
        </div>
        <div className="location-detail-modal__footer">
          <div className="location-detail-modal__notice">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.7 7.5 9.5 4.4-1.8 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-5"/></svg>
            <span>This is the official location hierarchy and Life Location Code maintained by the National Administrative Data Service.</span>
          </div>
          <button type="button" onClick={onClose}>Continue browsing <span aria-hidden="true">›</span></button>
        </div>
      </motion.article>
    </motion.div>
  )
}

function lookupPath(result) {
  return [result.province_name, result.district_name, result.ds_name, result.gn_name]
    .filter(Boolean)
    .join('  ›  ')
}

function ProvinceButtonRow({ provinces, selectedId, onSelect, localizedName }) {
  if (provinces.length === 0) return null
  const selectedProvince = provinces.find(province => String(province.id) === String(selectedId))
  const selectedProvinceKey = selectedProvince
    ? normalizeName(selectedProvince.name_english || selectedProvince.name || '')
    : ''

  return (
    <div className="location-province-orbit" aria-label="Select province">
      <svg className="location-province-connectors" viewBox="0 0 620 650" aria-hidden="true">
        {Object.entries(provinceConnectors).map(([provinceKey, connector]) => (
          <g
            key={provinceKey}
            className={
              selectedProvinceKey
                ? provinceKey === selectedProvinceKey ? 'is-selected' : 'is-muted'
                : ''
            }
          >
            <path d={connector.path} />
            <circle cx={connector.x} cy={connector.y} r="4" />
          </g>
        ))}
      </svg>
      {provinces.map((province, index) => {
        const isSelected = String(selectedId) === String(province.id)
        const position = getProvincePosition(province, index)
        return (
          <motion.button
            type="button"
            key={province.id}
            className={`${isSelected ? 'is-selected ' : ''}province-position-${position}`}
            style={{ '--province-color': provinceButtonColors[index % provinceButtonColors.length] }}
            onClick={() => onSelect(province)}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...smoothTransition, delay: index * 0.035 }}
            whileTap={{ scale: 0.97 }}
          >
            <strong>{localizedName(province) || province.name || 'Unnamed area'}</strong>
            {getLocationCode(province) && <span className="province-code">Code: {getLocationCode(province)}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}

function getProvincePosition(province, fallbackIndex) {
  const name = normalizeName(province.name_english || province.name || '')
  const positions = {
    northern: 'left-top',
    northcentral: 'right-top',
    eastern: 'right-upper',
    northwestern: 'left-upper',
    central: 'right-middle',
    western: 'left-middle',
    uva: 'right-lower',
    sabaragamuwa: 'left-lower',
    southern: 'right-bottom',
  }

  return positions[name] || [
    'left-top', 'right-top', 'right-upper', 'left-upper', 'right-middle',
    'left-middle', 'right-lower', 'left-lower', 'right-bottom',
  ][fallbackIndex % 9]
}

function HierarchyColumn({ title, items, selectedId, onSelect, emptyText, searchLabel, noMatchesText, localizedName }) {
  const bodyRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const selectedItem = selectedId ? items.find(item => String(item.id) === String(selectedId)) : null
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredItems = normalizedSearch
    ? items.filter(item => {
      const code = getLocationCode(item)
      return [
        localizedName(item),
        item.name_english,
        item.name_sinhala,
        item.name_tamil,
        code,
      ].some(value => String(value || '').toLowerCase().includes(normalizedSearch))
    })
    : items
  const visibleItems = selectedItem && filteredItems.some(item => String(item.id) === String(selectedId))
    ? [selectedItem, ...filteredItems.filter(item => String(item.id) !== String(selectedId))]
    : filteredItems

  useEffect(() => {
    if (!bodyRef.current || !selectedId) return
    bodyRef.current.scrollTo({
      top: 0,
      behavior: 'auto',
    })
  }, [selectedId, items])

  return (
    <motion.div className="location-hierarchy-column" layout transition={smoothTransition}>
      <div className="location-hierarchy-column__title">{title}</div>
      <div className="location-hierarchy-search">
        <input
          type="search"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder={searchLabel}
          aria-label={searchLabel}
        />
      </div>
      <motion.div className="location-hierarchy-column__body" ref={bodyRef} layout>
        <AnimatePresence mode="popLayout" initial={false}>
        {items.length === 0 && (
          <motion.div
            key={`empty-${emptyText}`}
            className="location-hierarchy-empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={smoothTransition}
          >
            {emptyText}
          </motion.div>
        )}
        {items.length > 0 && visibleItems.length === 0 && (
          <motion.div
            key="no-matches"
            className="location-hierarchy-empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={smoothTransition}
          >
            {noMatchesText}
          </motion.div>
        )}
        {visibleItems.map(item => {
          const isSelected = String(selectedId) === String(item.id)
          const locationCode = getLocationCode(item)
          return (
            <motion.button
              type="button"
              key={item.id}
              className={isSelected ? 'is-selected' : ''}
              onClick={() => onSelect(item)}
              layout
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={smoothTransition}
              whileTap={{ scale: 0.985 }}
            >
              <strong>{localizedName(item) || item.name || 'Unnamed area'}</strong>
              {locationCode && <span className="location-code">Life Location Code: {locationCode}</span>}
            </motion.button>
          )
        })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function getLocationCode(item) {
  return item.lifecode
    || item.code
    || item.province_code
    || item.district_code
    || item.divisional_secretariat_code
    || item.grama_niladhari_division_code
    || item.village_code
    || ''
}
