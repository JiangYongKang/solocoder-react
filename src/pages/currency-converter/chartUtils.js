const INTERPOLATABLE_KEYS = ['x', 'y', 'value']

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

export function resampleData(data, targetCount) {
  if (data.length === targetCount) return data
  if (data.length === 0) return []
  if (targetCount === 1) {
    const mid = data[Math.floor(data.length / 2)]
    return [{ ...mid }]
  }

  const result = []
  const step = (data.length - 1) / (targetCount - 1)

  for (let i = 0; i < targetCount; i++) {
    const pos = i * step
    const idx = Math.floor(pos)
    const frac = pos - idx
    const nextIdx = Math.min(idx + 1, data.length - 1)

    const curr = data[idx]
    const next = data[nextIdx]

    const point = { ...curr }
    for (const key of INTERPOLATABLE_KEYS) {
      if (typeof curr[key] === 'number' && typeof next[key] === 'number') {
        point[key] = curr[key] + (next[key] - curr[key]) * frac
      }
    }

    result.push(point)
  }

  return result
}

export function interpolateLayout(fromLayout, toLayout, progress) {
  if (!fromLayout || fromLayout.points.length === 0) return toLayout
  if (progress >= 1) return toLayout

  const p = easeOutCubic(progress)

  const pointCount = toLayout.points.length
  const fromPoints = fromLayout.points.length === pointCount
    ? fromLayout.points
    : resampleData(fromLayout.points, pointCount).map((d, i) => {
        const x = toLayout.points[i]?.x || 0
        return { ...d, x }
      })

  const points = toLayout.points.map((to, i) => {
    const fromPt = fromPoints[i] || to
    const fromY = typeof fromPt.y === 'number' ? fromPt.y : to.y
    const fromValue = typeof fromPt.value === 'number' ? fromPt.value : to.value
    return {
      ...to,
      y: fromY + (to.y - fromY) * p,
      value: fromValue + (to.value - fromValue) * p,
    }
  })

  const pathD = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(' ')

  const yTicks = toLayout.yTicks.map((to, i) => {
    const fromT = fromLayout.yTicks[i] || to
    const fromVal = typeof fromT.value === 'number' ? fromT.value : to.value
    const fromY = typeof fromT.y === 'number' ? fromT.y : to.y
    const val = fromVal + (to.value - fromVal) * p
    return {
      ...to,
      y: fromY + (to.y - fromY) * p,
      value: val,
      label: val.toFixed(4),
    }
  })

  const gridLines = toLayout.gridLines.map((to, i) => {
    const fromG = fromLayout.gridLines[i] || to
    const fromY1 = typeof fromG.y1 === 'number' ? fromG.y1 : to.y1
    const fromY2 = typeof fromG.y2 === 'number' ? fromG.y2 : to.y2
    return {
      ...to,
      y1: fromY1 + (to.y1 - fromY1) * p,
      y2: fromY2 + (to.y2 - fromY2) * p,
    }
  })

  const hoverAreas = toLayout.hoverAreas.map((to, i) => ({
    ...to,
    point: points[i] || to.point,
  }))

  return {
    ...toLayout,
    points,
    pathD,
    yTicks,
    gridLines,
    hoverAreas,
  }
}
