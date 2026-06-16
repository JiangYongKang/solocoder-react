import { COMMAND_PARAM_COUNT } from './constants.js'

export function generateId(prefix = 'node') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function clampZoom(zoom, min = 0.1, max = 10) {
  return Math.max(min, Math.min(max, zoom))
}

export function screenToWorld(sx, sy, panX, panY, zoom) {
  return { x: (sx - panX) / zoom, y: (sy - panY) / zoom }
}

export function worldToScreen(wx, wy, panX, panY, zoom) {
  return { x: wx * zoom + panX, y: wy * zoom + panY }
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function parsePathCommands(d) {
  if (!d || typeof d !== 'string') return []

  const commands = []
  const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g
  let match

  while ((match = regex.exec(d)) !== null) {
    const cmd = match[1]
    const paramStr = match[2].trim()
    const numbers = paramStr.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || []
    const params = numbers.map(Number)
    const isRelative = cmd === cmd.toLowerCase()
    const upperCmd = cmd.toUpperCase()

    if (upperCmd === 'Z') {
      commands.push({ type: 'Z', relative: isRelative, params: [] })
      continue
    }

    const paramCount = COMMAND_PARAM_COUNT[upperCmd]
    if (paramCount === 0) {
      commands.push({ type: upperCmd, relative: isRelative, params: [] })
      continue
    }

    if (paramCount > 0 && params.length > 0) {
      for (let i = 0; i < params.length; i += paramCount) {
        const chunk = params.slice(i, i + paramCount)
        if (chunk.length >= paramCount) {
          commands.push({ type: upperCmd, relative: isRelative, params: chunk })
        }
      }
    }
  }

  return commands
}

export function serializePathCommands(commands) {
  if (!commands || commands.length === 0) return ''

  let prevType = ''
  return commands
    .map((cmd) => {
      const typeChar = cmd.relative ? cmd.type.toLowerCase() : cmd.type
      if (cmd.type === 'Z') {
        prevType = ''
        return 'Z'
      }

      const prefix = cmd.type !== prevType ? typeChar + ' ' : ' '
      prevType = cmd.type
      return prefix + cmd.params.map((p) => roundNumber(p)).join(' ')
    })
    .join('')
    .trim()
}

function roundNumber(n, digits = 2) {
  const factor = Math.pow(10, digits)
  return Math.round(n * factor) / factor
}

export function toAbsoluteCommands(commands) {
  const result = []
  let cx = 0
  let cy = 0
  let startX = 0
  let startY = 0

  for (const cmd of commands) {
    if (cmd.type === 'Z') {
      result.push({ type: 'Z', relative: false, params: [] })
      cx = startX
      cy = startY
      continue
    }

    const rel = cmd.relative
    const p = cmd.params
    const upper = cmd.type

    switch (upper) {
      case 'M': {
        const x = rel ? cx + p[0] : p[0]
        const y = rel ? cy + p[1] : p[1]
        result.push({ type: 'M', relative: false, params: [x, y] })
        startX = x
        startY = y
        cx = x
        cy = y
        break
      }
      case 'L': {
        const x = rel ? cx + p[0] : p[0]
        const y = rel ? cy + p[1] : p[1]
        result.push({ type: 'L', relative: false, params: [x, y] })
        cx = x
        cy = y
        break
      }
      case 'C': {
        const x1 = rel ? cx + p[0] : p[0]
        const y1 = rel ? cy + p[1] : p[1]
        const x2 = rel ? cx + p[2] : p[2]
        const y2 = rel ? cy + p[3] : p[3]
        const x = rel ? cx + p[4] : p[4]
        const y = rel ? cy + p[5] : p[5]
        result.push({ type: 'C', relative: false, params: [x1, y1, x2, y2, x, y] })
        cx = x
        cy = y
        break
      }
      case 'Q': {
        const x1 = rel ? cx + p[0] : p[0]
        const y1 = rel ? cy + p[1] : p[1]
        const x = rel ? cx + p[2] : p[2]
        const y = rel ? cy + p[3] : p[3]
        result.push({ type: 'Q', relative: false, params: [x1, y1, x, y] })
        cx = x
        cy = y
        break
      }
      case 'A': {
        const rx = p[0]
        const ry = p[1]
        const rotation = p[2]
        const largeArc = p[3]
        const sweep = p[4]
        const x = rel ? cx + p[5] : p[5]
        const y = rel ? cy + p[6] : p[6]
        result.push({ type: 'A', relative: false, params: [rx, ry, rotation, largeArc, sweep, x, y] })
        cx = x
        cy = y
        break
      }
    }
  }

  return result
}

export function extractNodes(commands) {
  const absCmds = toAbsoluteCommands(commands)
  const nodes = []
  let prevCmd = null

  for (let i = 0; i < absCmds.length; i++) {
    const cmd = absCmds[i]

    if (cmd.type === 'M') {
      nodes.push({
        type: 'M',
        x: cmd.params[0],
        y: cmd.params[1],
        handleIn: null,
        handleOut: null,
        cmdIndex: i,
      })
    } else if (cmd.type === 'L') {
      nodes.push({
        type: 'L',
        x: cmd.params[0],
        y: cmd.params[1],
        handleIn: null,
        handleOut: null,
        cmdIndex: i,
      })
    } else if (cmd.type === 'C') {
      const node = {
        type: 'C',
        x: cmd.params[4],
        y: cmd.params[5],
        handleIn: { x: cmd.params[2], y: cmd.params[3] },
        handleOut: { x: cmd.params[2], y: cmd.params[3] },
        cmdIndex: i,
      }
      if (prevCmd) {
        node.handleIn = { x: cmd.params[0], y: cmd.params[1] }
      }
      nodes.push(node)
    } else if (cmd.type === 'Q') {
      const node = {
        type: 'Q',
        x: cmd.params[2],
        y: cmd.params[3],
        handleIn: { x: cmd.params[0], y: cmd.params[1] },
        handleOut: { x: cmd.params[0], y: cmd.params[1] },
        cmdIndex: i,
      }
      nodes.push(node)
    } else if (cmd.type === 'A') {
      nodes.push({
        type: 'A',
        x: cmd.params[5],
        y: cmd.params[6],
        handleIn: null,
        handleOut: null,
        arcParams: {
          rx: cmd.params[0],
          ry: cmd.params[1],
          rotation: cmd.params[2],
          largeArc: cmd.params[3],
          sweep: cmd.params[4],
        },
        cmdIndex: i,
      })
    } else if (cmd.type === 'Z') {
      if (nodes.length > 0) {
        const first = nodes[0]
        nodes.push({
          type: 'Z',
          x: first.x,
          y: first.y,
          handleIn: null,
          handleOut: null,
          cmdIndex: i,
        })
      }
    }

    prevCmd = cmd
  }

  return nodes
}

export function nodesToCommands(nodes) {
  if (!nodes || nodes.length === 0) return []

  const commands = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    if (i === 0 || node.type === 'M') {
      commands.push({ type: 'M', relative: false, params: [node.x, node.y] })
      continue
    }

    if (node.type === 'Z') {
      commands.push({ type: 'Z', relative: false, params: [] })
      continue
    }

    if (node.type === 'L' || (node.handleIn === null && node.handleOut === null && node.type !== 'A')) {
      commands.push({ type: 'L', relative: false, params: [node.x, node.y] })
      continue
    }

    if (node.type === 'A' && node.arcParams) {
      const ap = node.arcParams
      commands.push({
        type: 'A',
        relative: false,
        params: [ap.rx, ap.ry, ap.rotation, ap.largeArc, ap.sweep, node.x, node.y],
      })
      continue
    }

    if (node.type === 'Q' || (node.handleIn && node.handleIn === node.handleOut)) {
      const hx = node.handleIn ? node.handleIn.x : node.x
      const hy = node.handleIn ? node.handleIn.y : node.y
      commands.push({ type: 'Q', relative: false, params: [hx, hy, node.x, node.y] })
      continue
    }

    if (node.type === 'C' || (node.handleIn && node.handleOut)) {
      const h1x = node.handleIn ? node.handleIn.x : node.x
      const h1y = node.handleIn ? node.handleIn.y : node.y
      const h2x = node.handleOut ? node.handleOut.x : node.x
      const h2y = node.handleOut ? node.handleOut.y : node.y
      commands.push({ type: 'C', relative: false, params: [h1x, h1y, h2x, h2y, node.x, node.y] })
      continue
    }

    commands.push({ type: 'L', relative: false, params: [node.x, node.y] })
  }

  return commands
}

export function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  }
}

export function quadraticBezierPoint(p0, p1, p2, t) {
  const mt = 1 - t
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  }
}

export function splitCubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t
  const p01 = { x: mt * p0.x + t * p1.x, y: mt * p0.y + t * p1.y }
  const p12 = { x: mt * p1.x + t * p2.x, y: mt * p1.y + t * p2.y }
  const p23 = { x: mt * p2.x + t * p3.x, y: mt * p2.y + t * p3.y }
  const p012 = { x: mt * p01.x + t * p12.x, y: mt * p01.y + t * p12.y }
  const p123 = { x: mt * p12.x + t * p23.x, y: mt * p12.y + t * p23.y }
  const p0123 = { x: mt * p012.x + t * p123.x, y: mt * p012.y + t * p123.y }

  return {
    left: { p0, p1: p01, p2: p012, p3: p0123 },
    right: { p0: p0123, p1: p123, p2: p23, p3 },
  }
}

export function splitQuadraticBezier(p0, p1, p2, t) {
  const mt = 1 - t
  const p01 = { x: mt * p0.x + t * p1.x, y: mt * p0.y + t * p1.y }
  const p12 = { x: mt * p1.x + t * p2.x, y: mt * p1.y + t * p2.y }
  const p012 = { x: mt * p01.x + t * p12.x, y: mt * p01.y + t * p12.y }

  return {
    left: { p0, p1: p01, p2: p012 },
    right: { p0: p012, p1: p12, p2 },
  }
}

export function findNearestPointOnCubic(p0, p1, p2, p3, px, py, steps = 50) {
  let minDist = Infinity
  let bestT = 0

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const pt = cubicBezierPoint(p0, p1, p2, p3, t)
    const d = distance(pt.x, pt.y, px, py)
    if (d < minDist) {
      minDist = d
      bestT = t
    }
  }

  let lo = Math.max(0, bestT - 1 / steps)
  let hi = Math.min(1, bestT + 1 / steps)
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2
    const t1 = (lo + mid) / 2
    const t2 = (mid + hi) / 2
    const pt1 = cubicBezierPoint(p0, p1, p2, p3, t1)
    const pt2 = cubicBezierPoint(p0, p1, p2, p3, t2)
    if (distance(pt1.x, pt1.y, px, py) < distance(pt2.x, pt2.y, px, py)) {
      hi = mid
    } else {
      lo = mid
    }
  }

  return { t: (lo + hi) / 2, dist: minDist, point: cubicBezierPoint(p0, p1, p2, p3, (lo + hi) / 2) }
}

export function findNearestPointOnQuadratic(p0, p1, p2, px, py, steps = 50) {
  let minDist = Infinity
  let bestT = 0

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const pt = quadraticBezierPoint(p0, p1, p2, t)
    const d = distance(pt.x, pt.y, px, py)
    if (d < minDist) {
      minDist = d
      bestT = t
    }
  }

  let lo = Math.max(0, bestT - 1 / steps)
  let hi = Math.min(1, bestT + 1 / steps)
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2
    const t1 = (lo + mid) / 2
    const t2 = (mid + hi) / 2
    const pt1 = quadraticBezierPoint(p0, p1, p2, t1)
    const pt2 = quadraticBezierPoint(p0, p1, p2, t2)
    if (distance(pt1.x, pt1.y, px, py) < distance(pt2.x, pt2.y, px, py)) {
      hi = mid
    } else {
      lo = mid
    }
  }

  return { t: (lo + hi) / 2, dist: minDist, point: quadraticBezierPoint(p0, p1, p2, (lo + hi) / 2) }
}

export function findNearestPointOnLine(x1, y1, x2, y2, px, py) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  let t = 0
  if (lenSq > 0) {
    t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
  }
  const pt = { x: x1 + t * dx, y: y1 + t * dy }
  return { t, dist: distance(pt.x, pt.y, px, py), point: pt }
}

export function insertNodeOnSegment(commands, segIndex, t) {
  const absCmds = toAbsoluteCommands(commands)
  if (segIndex < 0 || segIndex >= absCmds.length) return commands

  const cmd = absCmds[segIndex]
  if (cmd.type === 'Z' || cmd.type === 'M') return commands

  const prevPoint = getSegmentStart(absCmds, segIndex)
  if (!prevPoint) return commands

  let newCmd1 = null
  let newCmd2 = null

  if (cmd.type === 'C') {
    const p0 = prevPoint
    const p1 = { x: cmd.params[0], y: cmd.params[1] }
    const p2 = { x: cmd.params[2], y: cmd.params[3] }
    const p3 = { x: cmd.params[4], y: cmd.params[5] }
    const split = splitCubicBezier(p0, p1, p2, p3, t)
    newCmd1 = { type: 'C', relative: false, params: [split.left.p1.x, split.left.p1.y, split.left.p2.x, split.left.p2.y, split.left.p3.x, split.left.p3.y] }
    newCmd2 = { type: 'C', relative: false, params: [split.right.p1.x, split.right.p1.y, split.right.p2.x, split.right.p2.y, split.right.p3.x, split.right.p3.y] }
  } else if (cmd.type === 'Q') {
    const p0 = prevPoint
    const p1 = { x: cmd.params[0], y: cmd.params[1] }
    const p2 = { x: cmd.params[2], y: cmd.params[3] }
    const split = splitQuadraticBezier(p0, p1, p2, t)
    newCmd1 = { type: 'Q', relative: false, params: [split.left.p1.x, split.left.p1.y, split.left.p2.x, split.left.p2.y] }
    newCmd2 = { type: 'Q', relative: false, params: [split.right.p1.x, split.right.p1.y, split.right.p2.x, split.right.p2.y] }
  } else if (cmd.type === 'L') {
    const pt = {
      x: prevPoint.x + t * (cmd.params[0] - prevPoint.x),
      y: prevPoint.y + t * (cmd.params[1] - prevPoint.y),
    }
    newCmd1 = { type: 'L', relative: false, params: [pt.x, pt.y] }
    newCmd2 = { type: 'L', relative: false, params: [cmd.params[0], cmd.params[1]] }
  } else if (cmd.type === 'A') {
    const midX = prevPoint.x + t * (cmd.params[5] - prevPoint.x)
    const midY = prevPoint.y + t * (cmd.params[6] - prevPoint.y)
    newCmd1 = { type: 'L', relative: false, params: [midX, midY] }
    newCmd2 = { type: 'A', relative: false, params: [...cmd.params.slice(0, 5), cmd.params[5], cmd.params[6]] }
  }

  if (!newCmd1 || !newCmd2) return commands

  const newCmds = [...absCmds.slice(0, segIndex), newCmd1, newCmd2, ...absCmds.slice(segIndex + 1)]
  return newCmds
}

export function deleteNode(commands, nodeIndex) {
  const absCmds = toAbsoluteCommands(commands)
  if (absCmds.length <= 2) return commands

  let segIndex = -1
  let count = 0

  for (let i = 0; i < absCmds.length; i++) {
    if (absCmds[i].type !== 'Z') {
      if (count === nodeIndex) {
        segIndex = i
        break
      }
      count++
    }
  }

  if (segIndex <= 0) return commands

  const prevPoint = getSegmentStart(absCmds, segIndex)
  const nextPoint = getSegmentEnd(absCmds, segIndex)

  if (!prevPoint || !nextPoint) return commands

  const newCmd = { type: 'L', relative: false, params: [nextPoint.x, nextPoint.y] }
  const newCmds = [...absCmds.slice(0, segIndex - 1), ...absCmds.slice(segIndex)]
  if (segIndex - 1 >= 0 && segIndex < absCmds.length) {
    newCmds[segIndex - 1] = newCmd
  } else {
    newCmds.splice(segIndex, 0, newCmd)
  }

  return newCmds
}

export function convertSegmentToLine(commands, segIndex) {
  const absCmds = toAbsoluteCommands(commands)
  if (segIndex < 0 || segIndex >= absCmds.length) return commands

  const cmd = absCmds[segIndex]
  if (cmd.type === 'M' || cmd.type === 'Z' || cmd.type === 'L') return commands

  const newCmds = [...absCmds]
  newCmds[segIndex] = { type: 'L', relative: false, params: [cmd.params[cmd.params.length - 2], cmd.params[cmd.params.length - 1]] }

  return newCmds
}

function getSegmentStart(absCmds, segIndex) {
  let x = 0
  let y = 0
  for (let i = 0; i < segIndex; i++) {
    const cmd = absCmds[i]
    if (cmd.type === 'M') {
      x = cmd.params[0]
      y = cmd.params[1]
    } else if (cmd.type === 'L') {
      x = cmd.params[0]
      y = cmd.params[1]
    } else if (cmd.type === 'C') {
      x = cmd.params[4]
      y = cmd.params[5]
    } else if (cmd.type === 'Q') {
      x = cmd.params[2]
      y = cmd.params[3]
    } else if (cmd.type === 'A') {
      x = cmd.params[5]
      y = cmd.params[6]
    } else if (cmd.type === 'Z') {
      for (let j = i - 1; j >= 0; j--) {
        if (absCmds[j].type === 'M') {
          x = absCmds[j].params[0]
          y = absCmds[j].params[1]
          break
        }
      }
    }
  }
  return { x, y }
}

function getSegmentEnd(absCmds, segIndex) {
  if (segIndex >= absCmds.length) return null
  const cmd = absCmds[segIndex]
  if (cmd.type === 'M') return { x: cmd.params[0], y: cmd.params[1] }
  if (cmd.type === 'L') return { x: cmd.params[0], y: cmd.params[1] }
  if (cmd.type === 'C') return { x: cmd.params[4], y: cmd.params[5] }
  if (cmd.type === 'Q') return { x: cmd.params[2], y: cmd.params[3] }
  if (cmd.type === 'A') return { x: cmd.params[5], y: cmd.params[6] }
  if (cmd.type === 'Z') {
    for (let j = segIndex - 1; j >= 0; j--) {
      if (absCmds[j].type === 'M') return { x: absCmds[j].params[0], y: absCmds[j].params[1] }
    }
  }
  return null
}

export function mergeStyles(baseStyle, overrides) {
  if (!baseStyle) return overrides || {}
  if (!overrides) return { ...baseStyle }
  return { ...baseStyle, ...overrides }
}

export function buildSvgString(paths, exportAll = true) {
  const pathsToExport = exportAll
    ? paths
    : paths.filter((p) => p.visible)

  if (pathsToExport.length === 0) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>'

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const allCmds = pathsToExport.map((p) => toAbsoluteCommands(parsePathCommands(p.d)))
  allCmds.forEach((cmds) => {
    let cx = 0
    let cy = 0
    cmds.forEach((cmd) => {
      let x = cx
      let y = cy
      if (cmd.type === 'M') { x = cmd.params[0]; y = cmd.params[1] }
      else if (cmd.type === 'L') { x = cmd.params[0]; y = cmd.params[1] }
      else if (cmd.type === 'C') { x = cmd.params[4]; y = cmd.params[5] }
      else if (cmd.type === 'Q') { x = cmd.params[2]; y = cmd.params[3] }
      else if (cmd.type === 'A') { x = cmd.params[5]; y = cmd.params[6] }
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      cx = x
      cy = y
    })
  })

  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 100; maxY = 100 }
  const pad = 10
  const w = maxX - minX + pad * 2
  const h = maxY - minY + pad * 2

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${roundNumber(minX - pad)} ${roundNumber(minY - pad)} ${roundNumber(w)} ${roundNumber(h)}">\n`

  for (const p of pathsToExport) {
    const style = p.style || {}
    let styleStr = ''
    if (style.fill && style.fill !== 'none') styleStr += `fill="${style.fill}"; `
    else styleStr += `fill="none"; `
    if (style.stroke) styleStr += `stroke="${style.stroke}"; `
    if (style.strokeWidth) styleStr += `stroke-width="${style.strokeWidth}"; `
    if (style.linecap && style.linecap !== 'butt') styleStr += `stroke-linecap="${style.linecap}"; `
    if (style.linejoin && style.linejoin !== 'miter') styleStr += `stroke-linejoin="${style.linejoin}"; `
    if (style.dasharray) styleStr += `stroke-dasharray="${style.dasharray}"; `
    styleStr = styleStr.replace(/; $/, '')

    svg += `  <path d="${p.d}"${styleStr ? ' style="' + styleStr + '"' : ''} />\n`
  }

  svg += '</svg>'
  return svg
}

export function loadFromStorage(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return null
  try {
    const raw = storage.getItem('svg-path-editor-data')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveToStorage(data, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return false
  try {
    storage.setItem('svg-path-editor-data', JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function isValidHexColor(color) {
  if (typeof color !== 'string') return false
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color)
}

export function getControlPoints(absCmds) {
  const points = []

  for (let i = 0; i < absCmds.length; i++) {
    const cmd = absCmds[i]

    if (cmd.type === 'M') {
      points.push({
        type: 'anchor',
        x: cmd.params[0],
        y: cmd.params[1],
        cmdIndex: i,
        handleIn: null,
        handleOut: null,
      })
    } else if (cmd.type === 'L') {
      points.push({
        type: 'anchor',
        x: cmd.params[0],
        y: cmd.params[1],
        cmdIndex: i,
        handleIn: null,
        handleOut: null,
      })
    } else if (cmd.type === 'C') {
      points.push({
        type: 'handle',
        x: cmd.params[0],
        y: cmd.params[1],
        cmdIndex: i,
        handleRole: 'in',
      })
      points.push({
        type: 'handle',
        x: cmd.params[2],
        y: cmd.params[3],
        cmdIndex: i,
        handleRole: 'out',
      })
      points.push({
        type: 'anchor',
        x: cmd.params[4],
        y: cmd.params[5],
        cmdIndex: i,
        handleIn: { x: cmd.params[2], y: cmd.params[3] },
        handleOut: null,
      })
    } else if (cmd.type === 'Q') {
      points.push({
        type: 'handle',
        x: cmd.params[0],
        y: cmd.params[1],
        cmdIndex: i,
        handleRole: 'both',
      })
      points.push({
        type: 'anchor',
        x: cmd.params[2],
        y: cmd.params[3],
        cmdIndex: i,
        handleIn: { x: cmd.params[0], y: cmd.params[1] },
        handleOut: { x: cmd.params[0], y: cmd.params[1] },
      })
    } else if (cmd.type === 'A') {
      points.push({
        type: 'anchor',
        x: cmd.params[5],
        y: cmd.params[6],
        cmdIndex: i,
        handleIn: null,
        handleOut: null,
        arcParams: {
          rx: cmd.params[0],
          ry: cmd.params[1],
          rotation: cmd.params[2],
          largeArc: cmd.params[3],
          sweep: cmd.params[4],
        },
      })
    } else if (cmd.type === 'Z') {
      const firstAnchor = points.find((p) => p.type === 'anchor')
      if (firstAnchor) {
        points.push({
          type: 'anchor',
          x: firstAnchor.x,
          y: firstAnchor.y,
          cmdIndex: i,
          handleIn: null,
          handleOut: null,
          isClose: true,
        })
      }
    }
  }

  for (let i = 1; i < points.length; i++) {
    const cur = points[i]
    const prev = points[i - 1]
    if (cur.type === 'anchor' && prev.type === 'handle' && prev.handleRole === 'out') {
      cur.handleIn = { x: prev.x, y: prev.y }
    }
  }

  for (let i = 0; i < points.length; i++) {
    const cur = points[i]
    if (cur.type === 'anchor' && cur.handleOut === null) {
      for (let j = i + 1; j < points.length; j++) {
        const next = points[j]
        if (next.type === 'handle' && next.handleRole === 'in') {
          cur.handleOut = { x: next.x, y: next.y }
          break
        }
        if (next.type === 'anchor') break
      }
    }
  }

  return points
}

export function updateCommandParam(commands, cmdIndex, paramIndex, value) {
  const newCmds = commands.map((cmd, i) => {
    if (i !== cmdIndex) return cmd
    const newParams = [...cmd.params]
    newParams[paramIndex] = value
    return { ...cmd, params: newParams }
  })
  return newCmds
}

export function getPathBounds(d) {
  const absCmds = toAbsoluteCommands(parsePathCommands(d))
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let cx = 0
  let cy = 0

  for (const cmd of absCmds) {
    if (cmd.type === 'M') { cx = cmd.params[0]; cy = cmd.params[1] }
    else if (cmd.type === 'L') { cx = cmd.params[0]; cy = cmd.params[1] }
    else if (cmd.type === 'C') { cx = cmd.params[4]; cy = cmd.params[5] }
    else if (cmd.type === 'Q') { cx = cmd.params[2]; cy = cmd.params[3] }
    else if (cmd.type === 'A') { cx = cmd.params[5]; cy = cmd.params[6] }
    minX = Math.min(minX, cx)
    minY = Math.min(minY, cy)
    maxX = Math.max(maxX, cx)
    maxY = Math.max(maxY, cy)
  }

  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}
