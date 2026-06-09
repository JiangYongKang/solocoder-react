import { useMemo } from 'react'
import { calculateTemperatureChartLayout } from './weatherUtils.js'

const TemperatureChart = ({ forecast }) => {
  const layout = useMemo(
    () => calculateTemperatureChartLayout(forecast, { width: 600, height: 260 }),
    [forecast]
  )

  return (
    <svg
      className="weather-chart"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {layout.gridLines.map((g, i) => (
        <line
          key={`grid-${i}`}
          x1={g.x1}
          y1={g.y1}
          x2={g.x2}
          y2={g.y2}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeDasharray="4 4"
        />
      ))}

      {layout.yTicks.map((t, i) => (
        <text
          key={`yt-${i}`}
          x={t.x - 8}
          y={t.y + 4}
          textAnchor="end"
          fontSize="12"
          fill="currentColor"
          fillOpacity="0.7"
        >
          {t.label}
        </text>
      ))}

      {layout.xTicks.map((t, i) => (
        <text
          key={`xt-${i}`}
          x={t.x}
          y={t.y + 24}
          textAnchor="middle"
          fontSize="12"
          fill="currentColor"
          fillOpacity={t.data?.isToday ? '1' : '0.7'}
          fontWeight={t.data?.isToday ? '600' : '400'}
        >
          {t.label}
        </text>
      ))}

      <path
        d={layout.lowPathD}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d={layout.highPathD}
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {layout.lowPoints.map((p, i) => (
        <circle
          key={`lp-${i}`}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#3b82f6"
          stroke="white"
          strokeWidth="2"
        />
      ))}

      {layout.highPoints.map((p, i) => (
        <circle
          key={`hp-${i}`}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#ef4444"
          stroke="white"
          strokeWidth="2"
        />
      ))}

      {layout.lowPoints.map((p, i) => (
        <text
          key={`lt-${i}`}
          x={p.x}
          y={p.y - 10}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#3b82f6"
          stroke="white"
          strokeWidth="3"
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {p.value}°C
        </text>
      ))}

      {layout.highPoints.map((p, i) => (
        <text
          key={`ht-${i}`}
          x={p.x}
          y={p.y - 10}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#ef4444"
          stroke="white"
          strokeWidth="3"
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {p.value}°C
        </text>
      ))}
    </svg>
  )
}

export default TemperatureChart
