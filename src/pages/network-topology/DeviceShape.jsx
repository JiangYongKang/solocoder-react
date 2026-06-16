import { DEVICE_TYPE_COLORS, DEVICE_TYPE_SHAPES } from './constants.js'

export default function DeviceShape({
  type,
  x = 0,
  y = 0,
  width = 120,
  height = 80,
  strokeColor = null,
  strokeWidth = 2,
  shape = null,
  colors = null,
}) {
  const shapeType = shape || DEVICE_TYPE_SHAPES[type] || 'rect'
  const colorSet = colors || DEVICE_TYPE_COLORS[type] || { fill: '#94A3B8', stroke: '#64748B' }
  const stroke = strokeColor || colorSet.stroke

  const cx = x + width / 2
  const cy = y + height / 2
  const halfW = width / 2
  const halfH = height / 2

  switch (shapeType) {
    case 'rect':
      return (
        <rect
          x={x + width * 0.04}
          y={y + height * 0.2}
          width={width * 0.92}
          height={height * 0.6}
          rx={Math.min(width, height) * 0.06}
          fill={colorSet.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
    case 'circle': {
      const r = Math.min(halfW, halfH) - Math.min(width, height) * 0.05
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={colorSet.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
    }
    case 'square':
      return (
        <rect
          x={x + width * 0.08}
          y={y + height * 0.1}
          width={width * 0.84}
          height={height * 0.8}
          rx={Math.min(width, height) * 0.06}
          fill={colorSet.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
    case 'hexagon': {
      const rx = halfW - width * 0.06
      const ry = halfH - height * 0.05
      const points = []
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const px = cx + rx * Math.cos(angle)
        const py = cy + ry * Math.sin(angle)
        points.push(`${px},${py}`)
      }
      return (
        <polygon
          points={points.join(' ')}
          fill={colorSet.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
    }
    case 'diamond': {
      const rx = halfW - width * 0.04
      const ry = halfH - height * 0.05
      const pts = `${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}`
      return (
        <polygon
          points={pts}
          fill={colorSet.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
    }
    case 'cloud': {
      const ellipseRx = halfW - width * 0.1
      const ellipseRy = halfH - height * 0.28
      const circle1R = halfH - height * 0.18
      const circle2R = halfH - height * 0.12
      const cx1 = cx - width * 0.15
      const cy1 = cy - height * 0.02
      const cx2 = cx + width * 0.1
      const cy2 = cy - height * 0.1
      return (
        <g>
          <ellipse
            cx={cx}
            cy={cy + height * 0.08}
            rx={ellipseRx}
            ry={ellipseRy}
            fill={colorSet.fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx1}
            cy={cy1}
            r={circle1R}
            fill={colorSet.fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx2}
            cy={cy2}
            r={circle2R}
            fill={colorSet.fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </g>
      )
    }
    default:
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={4}
          fill={colorSet.fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
  }
}
