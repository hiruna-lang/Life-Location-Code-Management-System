import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const createShapes = (feature, projection) => {
  const geometry = feature.geometry
  if (!geometry) return []

  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : []

  return polygons.flatMap(polygon => {
    const [outerRing, ...holes] = polygon
    if (!outerRing?.length) return []

    const shape = new THREE.Shape()
    outerRing.forEach(([longitude, latitude], index) => {
      const [x, y] = projection([longitude, latitude])
      if (index === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })

    holes.forEach(ring => {
      const path = new THREE.Path()
      ring.forEach(([longitude, latitude], index) => {
        const [x, y] = projection([longitude, latitude])
        if (index === 0) path.moveTo(x, y)
        else path.lineTo(x, y)
      })
      shape.holes.push(path)
    })

    return shape
  })
}

const createOutlineGeometry = (feature, projection) => {
  const geometry = feature.geometry
  const positions = []
  if (!geometry) return new THREE.BufferGeometry()

  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : []

  polygons.forEach(polygon => {
    polygon.forEach(ring => {
      if (!ring?.length) return
      ring.forEach((point, index) => {
        const nextPoint = ring[(index + 1) % ring.length]
        const [x1, y1] = projection(point)
        const [x2, y2] = projection(nextPoint)
        positions.push(x1, y1, 0.225, x2, y2, 0.225)
      })
    })
  })

  const outlineGeometry = new THREE.BufferGeometry()
  outlineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return outlineGeometry
}

export default function DistrictMesh({
  feature,
  projection,
  color,
  selected,
  provincePeer = false,
  dimmed = false,
  onClick,
  onHover,
  onLeave,
}) {
  const meshRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const shapes = useMemo(() => createShapes(feature, projection), [feature, projection])
  const outlineGeometry = useMemo(() => createOutlineGeometry(feature, projection), [feature, projection])
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shapes, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.014,
    bevelSegments: 2,
  }), [shapes])
  const ashColor = useMemo(() => {
    const muted = new THREE.Color(color)
    muted.lerp(new THREE.Color('#d6d5cf'), 0.82)
    return `#${muted.getHexString()}`
  }, [color])

  useFrame(() => {
    if (!meshRef.current) return
    const targetZ = dimmed ? 0 : selected ? 0.13 : hovered ? 0.08 : provincePeer ? 0.04 : 0
    meshRef.current.position.z += (targetZ - meshRef.current.position.z) * 0.18
  })

  const fillColor = dimmed
    ? ashColor
    : selected
      ? '#d9aa4d'
      : color

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      castShadow={!dimmed}
      receiveShadow={!dimmed}
      onPointerMove={event => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
        setHovered(true)
        onHover(feature, event.nativeEvent)
      }}
      onPointerOut={event => {
        event.stopPropagation()
        document.body.style.cursor = 'default'
        setHovered(false)
        onLeave()
      }}
      onPointerDown={event => {
        event.stopPropagation()
        onClick(feature)
      }}
    >
      <meshStandardMaterial
        color={fillColor}
        roughness={dimmed ? 0.68 : 0.48}
        metalness={dimmed ? 0.02 : 0.05}
        emissive={!dimmed && (hovered || selected) ? '#331517' : '#000000'}
        emissiveIntensity={!dimmed && (hovered || selected) ? 0.08 : 0}
        transparent={false}
        opacity={1}
      />
      <lineSegments geometry={outlineGeometry} renderOrder={4} raycast={() => null}>
        <lineBasicMaterial
          color={dimmed ? '#8f8a7e' : selected ? '#3f2116' : '#6e4b18'}
          transparent
          opacity={dimmed ? 0.55 : 0.95}
          depthTest={false}
        />
      </lineSegments>
    </mesh>
  )
}
