import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import SriLanka3DMap from '../components/three-map/SriLanka3DMap'
import LocationListPanel from '../components/location/LocationListPanel'
import LocationResultTable from '../components/location/LocationResultTable'
import { locationApi, normalizeName } from '../services/locationApi'
import './LocationSearch.css'

const friendlyApiError = 'Unable to load location data right now. Please check the Laravel API and try again.'

export default function LocationSearch() {
  const [mode, setMode] = useState('province')
  const [query, setQuery] = useState('')
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

  const handleProvinceClick = async feature => {
    const provinceName = feature.properties?.shapeName || ''
    const province = matchApiRecord(provinces, provinceName, 'province')
    if (!province) return

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

  const handleDistrictClick = async feature => {
    const districtName = feature.properties?.shapeName || ''
    const district = matchApiRecord(allDistricts.length ? allDistricts : districts, districtName, 'district')
    if (!district) {
      setApiError(`"${districtName}" could not be matched with the district records from the API.`)
      return
    }

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

  const activeList = selected.district
    ? selected.ds
      ? gnList
      : dsList
    : []

  const listConfig = selected.district
    ? selected.ds
      ? {
          title: 'GN divisions',
          eyebrow: selected.ds.name_english,
          items: gnList,
          selectedId: selected.gn?.id,
          onSelect: handleGnClick,
          emptyText: 'No GN divisions found for this DS division.',
        }
      : {
          title: 'Divisional Secretariats',
          eyebrow: selected.district.name_english,
          items: dsList,
          selectedId: selected.ds?.id,
          onSelect: handleDsClick,
          emptyText: 'No Divisional Secretariats found for this district.',
        }
    : {
        title: 'Next step',
        eyebrow: 'Map selection',
        items: [],
        selectedId: null,
        onSelect: () => {},
        emptyText: selected.province ? 'Select a district from the 3D map.' : 'Select a province from the 3D national map.',
      }

  const filteredListConfig = useMemo(() => {
    const term = normalizeName(query)
    if (!term || !listConfig.items.length) return listConfig

    return {
      ...listConfig,
      items: listConfig.items.filter(item => {
        return [item.name_english, item.name_sinhala, item.name_tamil]
          .filter(Boolean)
          .some(value => normalizeName(value).includes(term))
      }),
    }
  }, [listConfig, query])

  const searchMatches = useMemo(() => {
    const term = normalizeName(query)
    if (!term) return []

    const groups = [
      ['Province', provinces],
      ['District', districts],
      ['DS', dsList],
      ['GN', gnList],
      ['Village', villages],
    ]

    return groups.flatMap(([type, records]) => records
      .filter(record => [record.name_english, record.name_sinhala, record.name_tamil]
        .filter(Boolean)
        .some(value => normalizeName(value).includes(term)))
      .slice(0, 4)
      .map(record => ({ type, record })))
      .slice(0, 12)
  }, [districts, dsList, gnList, provinces, query, villages])

  return (
    <div className="location-search-page">
      <motion.section
        className={`location-dashboard ${selected.district ? 'location-dashboard--with-side' : ''}`}
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

        <motion.aside
          className="location-side"
          aria-hidden={!selected.district}
          animate={{ opacity: selected.district ? 1 : 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {selected.district && (
            <>
              <LocationListPanel
                title={filteredListConfig.title}
                eyebrow={filteredListConfig.eyebrow}
                items={filteredListConfig.items}
                loading={loadingPanel}
                error={apiError}
                selectedId={filteredListConfig.selectedId}
                onSelect={filteredListConfig.onSelect}
                emptyText={filteredListConfig.emptyText}
              />
            </>
          )}
        </motion.aside>
      </motion.section>

      {(selected.gn || villages.length > 0 || loadingVillages) && (
        <LocationResultTable villages={villages} loading={loadingVillages} />
      )}
    </div>
  )
}
