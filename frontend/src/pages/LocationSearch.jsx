import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SriLanka3DMap from '../components/three-map/SriLanka3DMap'
import LocationResultTable from '../components/location/LocationResultTable'
import { locationApi, normalizeName } from '../services/locationApi'
import './LocationSearch.css'

const friendlyApiError = 'Unable to load location data right now. Please check the Laravel API and try again.'

export default function LocationSearch() {
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
            <h2>{selected.province?.name_english ? `${selected.province.name_english} District Map` : 'Sri Lanka District Map'}</h2>
          </div>
          <div className="location-map-stage">
            <div className={`location-map-actions${selected.district ? '' : ' is-hidden'}`}>
              <button type="button" onClick={backToDistrict} disabled={!selected.district}>Back to district map</button>
              <button type="button" onClick={resetSelection} disabled={!selected.district}>Reset selection</button>
            </div>
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
              title="Provinces"
              items={provinces}
              selectedId={selected.province?.id}
              onSelect={selectProvince}
              emptyText="No provinces loaded."
            />
            <HierarchyColumn
              title="Districts"
              items={districts}
              selectedId={selected.district?.id}
              onSelect={selectDistrict}
              emptyText="No districts loaded."
            />
            <HierarchyColumn
              title="Divisional Secretariats"
              items={dsList}
              selectedId={selected.ds?.id}
              onSelect={handleDsClick}
              emptyText={selected.district ? 'No DS divisions found.' : 'Select a district first.'}
            />
            <HierarchyColumn
              title="GN Divisions"
              items={gnList}
              selectedId={selected.gn?.id}
              onSelect={handleGnClick}
              emptyText={selected.ds ? 'No GN divisions found.' : 'Select a DS division first.'}
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

function HierarchyColumn({ title, items, selectedId, onSelect, emptyText }) {
  const bodyRef = useRef(null)
  const selectedItem = selectedId ? items.find(item => String(item.id) === String(selectedId)) : null
  const visibleItems = selectedItem
    ? [selectedItem, ...items.filter(item => String(item.id) !== String(selectedId))]
    : items

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
      <div className="location-hierarchy-column__body" ref={bodyRef}>
        {items.length === 0 && <div className="location-hierarchy-empty">{emptyText}</div>}
        {visibleItems.map(item => {
          const isSelected = String(selectedId) === String(item.id)
          return (
            <button
              type="button"
              key={item.id}
              className={isSelected ? 'is-selected' : ''}
              onClick={() => onSelect(item)}
            >
              <strong>{item.name_english || item.name || 'Unnamed area'}</strong>
              {(item.name_sinhala || item.name_tamil) && <span>{item.name_sinhala || item.name_tamil}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
