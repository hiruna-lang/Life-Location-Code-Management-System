import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import DistrictMesh from './DistrictMesh'
import MapTooltip from './MapTooltip'
import { normalizeName } from '../../services/locationApi'

const MAP_ERROR = 'Map boundary file not found. Please add the GeoJSON file to frontend/public/maps.'
const CAMERA_POSITION = [0, -0.2, 12]
const CAMERA_ZOOM = 72
const MAP_VIEWPORT_FILL = 0.86
const MAP_GROUP_SCALE = 1
const MAP_GROUP_ROTATION = [-0.16, 0, 0.015]
const MAP_GROUP_POSITION = [0, 0.08, 0]

const districtColors = ['#82343d', '#98444e', '#c19a45', '#356f96', '#38775a', '#887729', '#a63d45', '#7068a8']

const getGeoBounds = geoJson => {
  const bounds = {
    minLon: Infinity,
    maxLon: -Infinity,
    minLat: Infinity,
    maxLat: -Infinity,
  }

  const visit = coordinates => {
    if (!Array.isArray(coordinates)) return
    if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
      const [longitude, latitude] = coordinates
      bounds.minLon = Math.min(bounds.minLon, longitude)
      bounds.maxLon = Math.max(bounds.maxLon, longitude)
      bounds.minLat = Math.min(bounds.minLat, latitude)
      bounds.maxLat = Math.max(bounds.maxLat, latitude)
      return
    }
    coordinates.forEach(visit)
  }

  geoJson?.features?.forEach(feature => visit(feature.geometry?.coordinates))
  return bounds
}

export default function SriLanka3DMap({
  selectedFeatureName,
  selectedProvinceId,
  districtRecords = [],
  showAllDistricts = false,
  onDistrictClick,
}) {
  const [districtGeoJson, setDistrictGeoJson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadMaps() {
      setLoading(true)
      setError('')
      try {
        const districtResponse = await fetch('/maps/sri_lanka_districts.geojson')

        if (!districtResponse.ok) {
          throw new Error(MAP_ERROR)
        }

        const districtData = await districtResponse.json()

        if (mounted) {
          setDistrictGeoJson(districtData)
        }
      } catch (err) {
        if (mounted) setError(MAP_ERROR)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadMaps()
    return () => { mounted = false }
  }, [])

  const activeGeoJson = useMemo(() => {
    const allDistrictFeatures = districtGeoJson?.features || []
    const districtNameSet = new Set(districtRecords.map(district => normalizeName(district.name_english)))
    const features = showAllDistricts || !districtNameSet.size
      ? allDistrictFeatures
      : allDistrictFeatures.filter(feature => districtNameSet.has(normalizeName(feature.properties?.shapeName)))

    return districtGeoJson ? { ...districtGeoJson, features } : null
  }, [districtGeoJson, districtRecords, showAllDistricts])

  const districtProvinceByName = useMemo(() => {
    return districtRecords.reduce((lookup, district) => {
      lookup.set(normalizeName(district.name_english), district.province_id)
      return lookup
    }, new Map())
  }, [districtRecords])

  const features = activeGeoJson?.features || []

  const showTooltip = (feature, event) => {
    const mapBounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - mapBounds.left
    setTooltip({
      name: feature.properties?.shapeName || 'Administrative area',
      x,
      y: Math.min(Math.max(event.clientY - mapBounds.top, 24), mapBounds.height - 24),
      placement: x > mapBounds.width * 0.62 ? 'left' : 'right',
    })
  }

  if (loading) {
    return <div className="location-map-state">Loading 3D boundary map...</div>
  }

  if (error) {
    return <div className="location-map-state location-map-state--error">{error}</div>
  }

  return (
    <div className="location-map-canvas">
      <Canvas shadows dpr={[1, 1.75]} gl={{ alpha: true }} camera={{ position: CAMERA_POSITION, zoom: CAMERA_ZOOM }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.25} />
          <directionalLight
            castShadow
            position={[3.8, -5.2, 8.5]}
            intensity={2.2}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <OrthographicCamera makeDefault position={CAMERA_POSITION} zoom={CAMERA_ZOOM} />
          <MapScene
            activeGeoJson={activeGeoJson}
            features={features}
            selectedFeatureName={selectedFeatureName}
            selectedProvinceId={selectedProvinceId}
            districtProvinceByName={districtProvinceByName}
            onDistrictClick={onDistrictClick}
            onHover={showTooltip}
            onLeave={() => setTooltip(null)}
          />
          <OrbitControls
            enabled={false}
            enablePan={false}
            enableRotate={false}
            enableZoom={false}
            target={[0, 0, 0]}
            minZoom={CAMERA_ZOOM}
            maxZoom={CAMERA_ZOOM}
            minPolarAngle={0.72}
            maxPolarAngle={1.26}
            rotateSpeed={0.3}
            zoomSpeed={0.45}
          />
        </Suspense>
      </Canvas>
      <MapTooltip tooltip={tooltip} />
    </div>
  )
}

function MapScene({
  activeGeoJson,
  features,
  selectedFeatureName,
  selectedProvinceId,
  districtProvinceByName,
  onDistrictClick,
  onHover,
  onLeave,
}) {
  const { viewport } = useThree()

  const projection = useMemo(() => {
    if (!activeGeoJson || !viewport.width || !viewport.height) return null

    const bounds = getGeoBounds(activeGeoJson)
    const centerLon = (bounds.minLon + bounds.maxLon) / 2
    const centerLat = (bounds.minLat + bounds.maxLat) / 2
    const lonRange = bounds.maxLon - bounds.minLon
    const latRange = bounds.maxLat - bounds.minLat
    const longitudeCompression = Math.cos((centerLat * Math.PI) / 180)
    const targetWidth = viewport.width * MAP_VIEWPORT_FILL
    const targetHeight = viewport.height * MAP_VIEWPORT_FILL
    const mapScale = Math.min(
      targetWidth / Math.max(lonRange * longitudeCompression, 0.001),
      targetHeight / Math.max(latRange, 0.001),
    )

    if (import.meta.env.DEV) {
      console.info('3D map fit', {
        mode: activeGeoJson.features?.[0]?.properties?.shapeType || 'map',
        viewportWidth: Number(viewport.width.toFixed(2)),
        viewportHeight: Number(viewport.height.toFixed(2)),
        targetWidth: Number(targetWidth.toFixed(2)),
        targetHeight: Number(targetHeight.toFixed(2)),
        lonRange: Number(lonRange.toFixed(4)),
        latRange: Number(latRange.toFixed(4)),
        mapScale: Number(mapScale.toFixed(4)),
        finalWidth: Number((lonRange * longitudeCompression * mapScale).toFixed(2)),
        finalHeight: Number((latRange * mapScale).toFixed(2)),
      })
    }

    return ([longitude, latitude]) => {
      return [
        (longitude - centerLon) * longitudeCompression * mapScale,
        (latitude - centerLat) * mapScale,
      ]
    }
  }, [activeGeoJson, viewport.height, viewport.width])

  if (!projection) return null

  return (
    <group rotation={MAP_GROUP_ROTATION} position={MAP_GROUP_POSITION} scale={[MAP_GROUP_SCALE, MAP_GROUP_SCALE, 1]}>
      {features.map((feature, index) => {
        const name = feature.properties?.shapeName
        const selected = normalizeName(selectedFeatureName) === normalizeName(name)
        const featureProvinceId = districtProvinceByName.get(normalizeName(name))
        const inSelectedProvince = selectedProvinceId && String(featureProvinceId) === String(selectedProvinceId)
        const dimmed = Boolean(selectedProvinceId) && !inSelectedProvince

        return (
          <DistrictMesh
            key={`${name}-${index}`}
            feature={feature}
            projection={projection}
            color={districtColors[index % districtColors.length]}
            selected={selected}
            provincePeer={inSelectedProvince && !selected}
            dimmed={dimmed}
            onClick={onDistrictClick}
            onHover={onHover}
            onLeave={onLeave}
          />
        )
      })}
    </group>
  )
}
