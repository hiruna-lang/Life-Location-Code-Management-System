export default function MapTooltip({ tooltip }) {
  if (!tooltip) return null

  return (
    <div className="location-map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      {tooltip.name}
    </div>
  )
}
