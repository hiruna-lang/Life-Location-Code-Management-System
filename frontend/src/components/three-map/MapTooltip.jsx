export default function MapTooltip({ tooltip }) {
  if (!tooltip) return null

  return (
    <div
      className={`location-map-tooltip location-map-tooltip--${tooltip.placement}`}
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      {tooltip.name}
    </div>
  )
}
