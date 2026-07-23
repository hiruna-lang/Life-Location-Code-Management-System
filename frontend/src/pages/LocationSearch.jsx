import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SriLanka3DMap from '../components/three-map/SriLanka3DMap'
import LocationResultTable from '../components/location/LocationResultTable'
import { locationApi, normalizeName } from '../services/locationApi'
import { useLanguage } from '../context/LanguageContext'
import './LocationSearch.css'

const friendlyApiError = 'Unable to load location data right now. Please check the Laravel API and try again.'
const provinceButtonColors = ['#2f628f', '#2f6f4e', '#a96f15', '#9f252d', '#6a65a8', '#168b8b', '#7d8b16', '#8a4f2a', '#712b31']

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
  const resultTableRef = useRef(null)

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
    if (!selected.gn || loadingVillages || !resultTableRef.current) return
    resultTableRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [selected.gn, loadingVillages, villages])

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

  const selectedProvinceName = selected.province ? localizedName(selected.province) : ''

  return (
    <div className="location-search-page">
      <motion.section
        className="location-dashboard"
        layout
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <motion.div className="location-map-card" layout transition={{ duration: 0.22, ease: 'easeOut' }}>
          <div className="location-map-card__header">
            <span>District boundary layer</span>
            <h2>{selectedProvinceName ? `${selectedProvinceName} District Map` : 'Sri Lanka District Map'}</h2>
          </div>
          <div className="location-map-stage">
            <div className={`location-map-actions${selected.district ? '' : ' is-hidden'}`}>
              <button type="button" onClick={backToDistrict} disabled={!selected.district}>{t('backToDistrictMap')}</button>
              <button type="button" onClick={resetSelection} disabled={!selected.district}>{t('resetSelection')}</button>
            </div>
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

        <section className="location-hierarchy-card">
          {apiError && <div className="location-panel-error">{apiError}</div>}
          {loadingPanel && <div className="location-panel-empty">Loading next administrative level...</div>}

          <div className="location-hierarchy-grid">
            <HierarchyColumn
              title={t('district')}
              items={districts}
              selectedId={selected.district?.id}
              onSelect={selectDistrict}
              emptyText="No districts loaded."
              localizedName={localizedName}
            />
            <HierarchyColumn
              title={t('ds')}
              items={dsList}
              selectedId={selected.ds?.id}
              onSelect={handleDsClick}
              emptyText={selected.district ? 'No DS divisions found.' : 'Select a district first.'}
              localizedName={localizedName}
            />
            <HierarchyColumn
              title={t('gn')}
              items={gnList}
              selectedId={selected.gn?.id}
              onSelect={handleGnClick}
              emptyText={selected.ds ? 'No GN divisions found.' : 'Select a DS division first.'}
              localizedName={localizedName}
            />
          </div>
        </section>
      </motion.section>

      {(selected.gn || villages.length > 0 || loadingVillages) && (
        <div ref={resultTableRef}>
          <LocationResultTable villages={villages} loading={loadingVillages} />
        </div>
      )}
    </div>
  )
}

function ProvinceButtonRow({ provinces, selectedId, onSelect, localizedName }) {
  if (provinces.length === 0) return null

  return (
    <div className="location-province-orbit" aria-label="Select province">
      <svg className="location-province-connectors" viewBox="0 0 620 650" aria-hidden="true">
        <g>
          <path d="M150 127 H220 L265 150" />
          <circle cx="265" cy="150" r="4" />
        </g>
        <g>
          <path d="M470 91 H430 L310 275" />
          <circle cx="310" cy="275" r="4" />
        </g>
        <g>
          <path d="M470 189 H438 L397 370" />
          <circle cx="397" cy="370" r="4" />
        </g>
        <g>
          <path d="M150 251 H215 L235 350" />
          <circle cx="235" cy="350" r="4" />
        </g>
        <g>
          <path d="M470 299 H420 L325 375" />
          <circle cx="325" cy="375" r="4" />
        </g>
        <g>
          <path d="M150 381 H220 L230 435" />
          <circle cx="230" cy="435" r="4" />
        </g>
        <g>
          <path d="M470 419 H425 L365 455" />
          <circle cx="365" cy="455" r="4" />
        </g>
        <g>
          <path d="M174 503 H225 L285 470" />
          <circle cx="285" cy="470" r="4" />
        </g>
        <g>
          <path d="M448 519 H410 L325 545" />
          <circle cx="325" cy="545" r="4" />
        </g>
      </svg>
      {provinces.map((province, index) => {
        const isSelected = String(selectedId) === String(province.id)
        const position = getProvincePosition(province, index)
        return (
          <button
            type="button"
            key={province.id}
            className={`${isSelected ? 'is-selected ' : ''}province-position-${position}`}
            style={{ '--province-color': provinceButtonColors[index % provinceButtonColors.length] }}
            onClick={() => onSelect(province)}
          >
            <strong>{localizedName(province) || province.name || 'Unnamed area'}</strong>
            {getLocationCode(province) && <span className="province-code">Code: {getLocationCode(province)}</span>}
          </button>
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

function HierarchyColumn({ title, items, selectedId, onSelect, emptyText, localizedName }) {
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
    <div className="location-hierarchy-column">
      <div className="location-hierarchy-column__title">{title}</div>
      <div className="location-hierarchy-search">
        <input
          type="search"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder={`Search ${title}`}
          aria-label={`Search ${title}`}
        />
      </div>
      <div className="location-hierarchy-column__body" ref={bodyRef}>
        {items.length === 0 && <div className="location-hierarchy-empty">{emptyText}</div>}
        {items.length > 0 && visibleItems.length === 0 && <div className="location-hierarchy-empty">No matching records.</div>}
        {visibleItems.map(item => {
          const isSelected = String(selectedId) === String(item.id)
          const locationCode = getLocationCode(item)
          return (
            <button
              type="button"
              key={item.id}
              className={isSelected ? 'is-selected' : ''}
              onClick={() => onSelect(item)}
            >
              <strong>{localizedName(item) || item.name || 'Unnamed area'}</strong>
              {locationCode && <span className="location-code">Life Location Code: {locationCode}</span>}
            </button>
          )
        })}
      </div>
    </div>
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
