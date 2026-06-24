import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import SriLanka3DMap from '../components/three-map/SriLanka3DMap'
import LocationResultTable from '../components/location/LocationResultTable'
import { locationApi, normalizeName } from '../services/locationApi'
import './LocationSearch.css'

const friendlyApiError = 'Unable to load location data right now. Please check the Laravel API and try again.'

export default function LocationSearch() {
  const [mode, setMode] = useState('province')
  const [provinces, setProvinces] = useState([])
  const [allDistricts, setAllDistricts] = useState([])
  const [districts, setDistricts] = useState([])
  const [dsList, setDsList] = useState([])
  const [gnList, setGnList] = useState([])
  const [villages, setVillages] = useState([])
  const [selected, setSelected] = useState({
    province: null,
    provinceFeature: null,
    district: null,
    districtFeature: null,
    ds: null,
    gn: null,
  })
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProvinces() {
      try {
        const data = await locationApi.provinces()
        if (!mounted) return
        setProvinces(data)

        const districtGroups = await Promise.all(
          data.map(province => locationApi.districts(province.id)
            .then(items => items.map(item => ({ ...item, province_id: item.province_id || province.id })))
            .catch(() => []))
        )
        if (mounted) setAllDistricts(districtGroups.flat())
      } catch (error) {
        if (mounted) setApiError(friendlyApiError)
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

  const selectProvince = async (province, feature = null) => {
    setSelected({ province, provinceFeature: feature, district: null, districtFeature: null, ds: null, gn: null })
    setDistricts([])
    setDsList([])
    setGnList([])
    setVillages([])
    setApiError('')
    setLoadingPanel(true)

    try {
      const data = await locationApi.districts(province.id)
      setDistricts(data)
      setMode('district')
    } catch (error) {
      setApiError(friendlyApiError)
    } finally {
      setLoadingPanel(false)
    }
  }

  const handleProvinceClick = async feature => {
    const provinceName = feature.properties?.shapeName || ''
    const province = matchApiRecord(provinces, provinceName, 'province')
    if (!province) return
    await selectProvince(province, feature)
  }

  const selectDistrict = async (district, feature = null) => {
    const districtProvince = provinces.find(province => String(province.id) === String(district.province_id)) || selected.province

    setSelected(current => ({ ...current, province: districtProvince, district, districtFeature: feature, ds: null, gn: null }))
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
    const districtName = feature.properties?.shapeName || ''
    const district = matchApiRecord(allDistricts.length ? allDistricts : districts, districtName, 'district')
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

  const resetSelection = () => {
    setMode('province')
    setSelected({ province: null, provinceFeature: null, district: null, districtFeature: null, ds: null, gn: null })
    setDistricts([])
    setDsList([])
    setGnList([])
    setVillages([])
    setApiError('')
  }

  const backToProvince = () => resetSelection()

  const backToDistrict = () => {
    if (!selected.province) return
    setMode('district')
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
            <span>{mode === 'province' ? 'National province layer' : 'District boundary layer'}</span>
            <h2>{mode === 'province' ? '3D Sri Lanka Province Map' : `${selected.province?.name_english || 'Sri Lanka'} District Map`}</h2>
          </div>
          <SriLanka3DMap
            mode={mode}
            selectedFeatureName={mode === 'district' ? selected.districtFeature?.properties?.shapeName : selected.provinceFeature?.properties?.shapeName}
            selectedProvinceFeature={selected.provinceFeature}
            districtRecords={allDistricts}
            showAllDistricts
            onProvinceClick={handleProvinceClick}
            onDistrictClick={handleDistrictClick}
          />
          {selected.district && (
            <div className="location-map-actions">
              <button type="button" onClick={backToProvince}>Back to province map</button>
              <button type="button" onClick={backToDistrict}>Back to district map</button>
              <button type="button" onClick={resetSelection}>Reset selection</button>
            </div>
          )}
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
              emptyText={selected.province ? 'No districts found.' : 'Select a province first.'}
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
        <LocationResultTable villages={villages} loading={loadingVillages} />
      )}
    </div>
  )
}

function HierarchyColumn({ title, items, selectedId, onSelect, emptyText }) {
  return (
    <div className="location-hierarchy-column">
      <div className="location-hierarchy-column__title">{title}</div>
      <div className="location-hierarchy-column__body">
        {items.length === 0 && <div className="location-hierarchy-empty">{emptyText}</div>}
        {items.map(item => (
          <button
            type="button"
            key={item.id}
            className={String(selectedId) === String(item.id) ? 'is-selected' : ''}
            onClick={() => onSelect(item)}
          >
            <strong>{item.name_english || item.name || 'Unnamed area'}</strong>
            {(item.name_sinhala || item.name_tamil) && <span>{item.name_sinhala || item.name_tamil}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
