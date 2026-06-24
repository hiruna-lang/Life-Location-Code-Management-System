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

export default function ProvinceMesh({ feature, projection, color, selected, onClick, onHover, onLeave }) {
  const meshRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const shapes = useMemo(() => createShapes(feature, projection), [feature, projection])
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shapes, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.018,
    bevelSegments: 2,
  }), [shapes])

  useFrame(() => {
    if (!meshRef.current) return
    const targetZ = selected ? 0.11 : hovered ? 0.07 : 0
    meshRef.current.position.z += (targetZ - meshRef.current.position.z) * 0.16
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      castShadow
      receiveShadow
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
      onClick={event => {
        event.stopPropagation()
        onClick(feature)
      }}
    >
      <meshStandardMaterial
        color={selected || hovered ? '#d5a64a' : color}
        roughness={0.44}
        metalness={0.06}
        emissive={hovered ? '#3a1618' : '#000000'}
        emissiveIntensity={hovered ? 0.08 : 0}
      />
    </mesh>
  )
}
