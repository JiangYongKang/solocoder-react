import { describe, expect, it } from 'vitest'
import {
    buildSvgString,
    clampZoom,
    convertSegmentToLine,
    cubicBezierPoint,
    deleteNode,
    distance,
    extractNodes,
    findNearestPointOnCubic,
    findNearestPointOnLine,
    findNearestPointOnQuadratic,
    getControlPoints,
    getPathBounds,
    insertNodeOnSegment,
    isValidHexColor,
    mergeStyles,
    parsePathCommands,
    quadraticBezierPoint,
    screenToWorld,
    serializePathCommands,
    splitCubicBezier,
    splitQuadraticBezier,
    toAbsoluteCommands,
    updateCommandParam,
    worldToScreen
} from '../../svg-path-editor/svgPathEditorCore.js'

describe('parsePathCommands', () => {
  it('parses M command', () => {
    const cmds = parsePathCommands('M 100 200')
    expect(cmds).toHaveLength(1)
    expect(cmds[0].type).toBe('M')
    expect(cmds[0].params).toEqual([100, 200])
    expect(cmds[0].relative).toBe(false)
  })

  it('parses multiple commands', () => {
    const cmds = parsePathCommands('M 100 200 L 300 400')
    expect(cmds).toHaveLength(2)
    expect(cmds[0].type).toBe('M')
    expect(cmds[1].type).toBe('L')
    expect(cmds[1].params).toEqual([300, 400])
  })

  it('parses cubic bezier C command', () => {
    const cmds = parsePathCommands('M 10 20 C 30 40 50 60 70 80')
    expect(cmds).toHaveLength(2)
    expect(cmds[1].type).toBe('C')
    expect(cmds[1].params).toEqual([30, 40, 50, 60, 70, 80])
  })

  it('parses quadratic bezier Q command', () => {
    const cmds = parsePathCommands('M 0 0 Q 50 100 100 0')
    expect(cmds[1].type).toBe('Q')
    expect(cmds[1].params).toEqual([50, 100, 100, 0])
  })

  it('parses arc A command', () => {
    const cmds = parsePathCommands('M 0 0 A 25 26 -30 0 1 50 50')
    expect(cmds[1].type).toBe('A')
    expect(cmds[1].params).toEqual([25, 26, -30, 0, 1, 50, 50])
  })

  it('parses Z close command', () => {
    const cmds = parsePathCommands('M 0 0 L 100 0 Z')
    expect(cmds[2].type).toBe('Z')
    expect(cmds[2].params).toEqual([])
  })

  it('parses relative commands', () => {
    const cmds = parsePathCommands('m 10 20 l 30 40')
    expect(cmds[0].relative).toBe(true)
    expect(cmds[1].relative).toBe(true)
  })

  it('handles empty string', () => {
    expect(parsePathCommands('')).toEqual([])
  })

  it('handles null/undefined', () => {
    expect(parsePathCommands(null)).toEqual([])
    expect(parsePathCommands(undefined)).toEqual([])
  })

  it('parses implicit repeated params for C', () => {
    const cmds = parsePathCommands('M 0 0 C 10 20 30 40 50 60 70 80 90 100 110 120')
    expect(cmds).toHaveLength(3)
    expect(cmds[1].params).toEqual([10, 20, 30, 40, 50, 60])
    expect(cmds[2].params).toEqual([70, 80, 90, 100, 110, 120])
  })

  it('parses negative numbers', () => {
    const cmds = parsePathCommands('M -10 -20')
    expect(cmds[0].params).toEqual([-10, -20])
  })

  it('parses decimal numbers', () => {
    const cmds = parsePathCommands('M 10.5 20.3')
    expect(cmds[0].params).toEqual([10.5, 20.3])
  })
})

describe('serializePathCommands', () => {
  it('serializes M command', () => {
    const cmds = [{ type: 'M', relative: false, params: [100, 200] }]
    expect(serializePathCommands(cmds)).toBe('M 100 200')
  })

  it('serializes C command', () => {
    const cmds = [
      { type: 'M', relative: false, params: [10, 20] },
      { type: 'C', relative: false, params: [30, 40, 50, 60, 70, 80] },
    ]
    const result = serializePathCommands(cmds)
    expect(result).toContain('M')
    expect(result).toContain('C')
    expect(result).toContain('70 80')
  })

  it('serializes Z command', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'L', relative: false, params: [100, 0] },
      { type: 'Z', relative: false, params: [] },
    ]
    const result = serializePathCommands(cmds)
    expect(result).toContain('Z')
  })

  it('handles empty commands', () => {
    expect(serializePathCommands([])).toBe('')
    expect(serializePathCommands(null)).toBe('')
  })
})

describe('toAbsoluteCommands', () => {
  it('converts relative M to absolute', () => {
    const cmds = [{ type: 'M', relative: true, params: [10, 20] }]
    const abs = toAbsoluteCommands(cmds)
    expect(abs[0].params).toEqual([10, 20])
    expect(abs[0].relative).toBe(false)
  })

  it('converts relative L to absolute with offset', () => {
    const cmds = [
      { type: 'M', relative: false, params: [100, 200] },
      { type: 'L', relative: true, params: [10, 20] },
    ]
    const abs = toAbsoluteCommands(cmds)
    expect(abs[1].params).toEqual([110, 220])
  })

  it('converts relative C to absolute', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'C', relative: true, params: [10, 20, 30, 40, 50, 60] },
    ]
    const abs = toAbsoluteCommands(cmds)
    expect(abs[1].params).toEqual([10, 20, 30, 40, 50, 60])
  })

  it('handles Z command', () => {
    const cmds = [
      { type: 'M', relative: false, params: [10, 20] },
      { type: 'L', relative: false, params: [100, 200] },
      { type: 'Z', relative: false, params: [] },
    ]
    const abs = toAbsoluteCommands(cmds)
    expect(abs[2].type).toBe('Z')
  })
})

describe('cubicBezierPoint', () => {
  it('returns p0 at t=0', () => {
    const pt = cubicBezierPoint({ x: 0, y: 0 }, { x: 33, y: 0 }, { x: 66, y: 100 }, { x: 100, y: 100 }, 0)
    expect(pt.x).toBeCloseTo(0, 5)
    expect(pt.y).toBeCloseTo(0, 5)
  })

  it('returns p3 at t=1', () => {
    const pt = cubicBezierPoint({ x: 0, y: 0 }, { x: 33, y: 0 }, { x: 66, y: 100 }, { x: 100, y: 100 }, 1)
    expect(pt.x).toBeCloseTo(100, 5)
    expect(pt.y).toBeCloseTo(100, 5)
  })

  it('returns midpoint at t=0.5 for symmetric curve', () => {
    const pt = cubicBezierPoint({ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 0 }, 0.5)
    expect(pt.x).toBeCloseTo(50, 5)
    expect(pt.y).toBeCloseTo(75, 5)
  })
})

describe('quadraticBezierPoint', () => {
  it('returns p0 at t=0', () => {
    const pt = quadraticBezierPoint({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }, 0)
    expect(pt.x).toBeCloseTo(0, 5)
    expect(pt.y).toBeCloseTo(0, 5)
  })

  it('returns p2 at t=1', () => {
    const pt = quadraticBezierPoint({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }, 1)
    expect(pt.x).toBeCloseTo(100, 5)
    expect(pt.y).toBeCloseTo(0, 5)
  })

  it('returns control point at t=0.5 for specific case', () => {
    const pt = quadraticBezierPoint({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }, 0.5)
    expect(pt.x).toBeCloseTo(50, 5)
    expect(pt.y).toBeCloseTo(50, 5)
  })
})

describe('splitCubicBezier', () => {
  it('splits curve into two halves', () => {
    const p0 = { x: 0, y: 0 }
    const p1 = { x: 0, y: 100 }
    const p2 = { x: 100, y: 100 }
    const p3 = { x: 100, y: 0 }
    const split = splitCubicBezier(p0, p1, p2, p3, 0.5)

    expect(split.left.p0).toEqual(p0)
    expect(split.right.p3).toEqual(p3)

    const midLeft = cubicBezierPoint(p0, p1, p2, p3, 0.5)
    expect(split.left.p3.x).toBeCloseTo(midLeft.x, 5)
    expect(split.left.p3.y).toBeCloseTo(midLeft.y, 5)
    expect(split.right.p0.x).toBeCloseTo(midLeft.x, 5)
    expect(split.right.p0.y).toBeCloseTo(midLeft.y, 5)
  })
})

describe('splitQuadraticBezier', () => {
  it('splits quadratic curve at t=0.5', () => {
    const p0 = { x: 0, y: 0 }
    const p1 = { x: 50, y: 100 }
    const p2 = { x: 100, y: 0 }
    const split = splitQuadraticBezier(p0, p1, p2, 0.5)

    expect(split.left.p0).toEqual(p0)
    expect(split.right.p2).toEqual(p2)

    const mid = quadraticBezierPoint(p0, p1, p2, 0.5)
    expect(split.left.p2.x).toBeCloseTo(mid.x, 5)
    expect(split.left.p2.y).toBeCloseTo(mid.y, 5)
  })
})

describe('findNearestPointOnCubic', () => {
  it('finds closest point near start', () => {
    const result = findNearestPointOnCubic(
      { x: 0, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 0 },
      5, 5, 50
    )
    expect(result.t).toBeLessThan(0.2)
  })

  it('finds closest point near end', () => {
    const result = findNearestPointOnCubic(
      { x: 0, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 0 },
      95, 5, 50
    )
    expect(result.t).toBeGreaterThan(0.8)
  })
})

describe('findNearestPointOnQuadratic', () => {
  it('finds closest point near middle', () => {
    const result = findNearestPointOnQuadratic(
      { x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 },
      50, 50, 50
    )
    expect(result.t).toBeCloseTo(0.5, 1)
  })
})

describe('findNearestPointOnLine', () => {
  it('finds midpoint on horizontal line', () => {
    const result = findNearestPointOnLine(0, 0, 100, 0, 50, 0)
    expect(result.t).toBeCloseTo(0.5, 5)
    expect(result.point.x).toBeCloseTo(50, 5)
    expect(result.point.y).toBeCloseTo(0, 5)
  })

  it('finds start point', () => {
    const result = findNearestPointOnLine(0, 0, 100, 0, -10, 0)
    expect(result.t).toBe(0)
  })

  it('finds end point', () => {
    const result = findNearestPointOnLine(0, 0, 100, 0, 110, 0)
    expect(result.t).toBe(1)
  })
})

describe('insertNodeOnSegment', () => {
  it('inserts node on C segment at t=0.5', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'C', relative: false, params: [0, 100, 100, 100, 100, 0] },
    ]
    const result = insertNodeOnSegment(cmds, 1, 0.5)
    expect(result.length).toBe(3)
    expect(result[1].type).toBe('C')
    expect(result[2].type).toBe('C')
  })

  it('inserts node on L segment at t=0.5', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'L', relative: false, params: [100, 0] },
    ]
    const result = insertNodeOnSegment(cmds, 1, 0.5)
    expect(result.length).toBe(3)
    expect(result[1].params).toEqual([50, 0])
    expect(result[2].params).toEqual([100, 0])
  })

  it('inserts node on Q segment', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'Q', relative: false, params: [50, 100, 100, 0] },
    ]
    const result = insertNodeOnSegment(cmds, 1, 0.5)
    expect(result.length).toBe(3)
    expect(result[1].type).toBe('Q')
    expect(result[2].type).toBe('Q')
  })

  it('returns unchanged for invalid index', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
    ]
    expect(insertNodeOnSegment(cmds, -1, 0.5)).toEqual(cmds)
    expect(insertNodeOnSegment(cmds, 5, 0.5)).toEqual(cmds)
  })

  it('returns unchanged for M command', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
    ]
    expect(insertNodeOnSegment(cmds, 0, 0.5)).toEqual(cmds)
  })
})

describe('convertSegmentToLine', () => {
  it('converts C segment to L', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'C', relative: false, params: [30, 40, 50, 60, 100, 0] },
    ]
    const result = convertSegmentToLine(cmds, 1)
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([100, 0])
  })

  it('converts Q segment to L', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'Q', relative: false, params: [50, 100, 100, 0] },
    ]
    const result = convertSegmentToLine(cmds, 1)
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([100, 0])
  })

  it('does not change L segment', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'L', relative: false, params: [100, 0] },
    ]
    const result = convertSegmentToLine(cmds, 1)
    expect(result[1].type).toBe('L')
  })

  it('does not change M command', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
    ]
    const result = convertSegmentToLine(cmds, 0)
    expect(result[0].type).toBe('M')
  })
})

describe('deleteNode', () => {
  it('deletes middle node from L path', () => {
    const cmds = parsePathCommands('M 0 0 L 50 50 L 100 0')
    const result = deleteNode(cmds, 1)
    expect(result[0].type).toBe('M')
    expect(result[0].params).toEqual([0, 0])
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([100, 0])
    expect(result.length).toBe(2)
  })

  it('first command always remains M after deletion', () => {
    const cmds = parsePathCommands('M 0 0 L 50 50 L 100 0')
    const result = deleteNode(cmds, 1)
    expect(result[0].type).toBe('M')
  })

  it('deletes first node and makes second node the new M', () => {
    const cmds = parsePathCommands('M 0 0 L 50 50 L 100 0')
    const result = deleteNode(cmds, 0)
    expect(result[0].type).toBe('M')
    expect(result[0].params).toEqual([50, 50])
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([100, 0])
    expect(result.length).toBe(2)
  })

  it('does not delete when only 2 anchor nodes remain', () => {
    const cmds = parsePathCommands('M 0 0 L 100 0')
    const result = deleteNode(cmds, 1)
    expect(result).toEqual(toAbsoluteCommands(cmds))
  })

  it('returns unchanged for invalid index', () => {
    const cmds = parsePathCommands('M 0 0 L 50 50 L 100 0')
    expect(deleteNode(cmds, -1)).toEqual(toAbsoluteCommands(cmds))
    expect(deleteNode(cmds, 99)).toEqual(toAbsoluteCommands(cmds))
  })

  it('deletes middle C curve node, replaces with L', () => {
    const cmds = parsePathCommands('M 0 0 C 30 40 50 60 100 100 L 150 50')
    const result = deleteNode(cmds, 1)
    expect(result[0].type).toBe('M')
    expect(result[0].params).toEqual([0, 0])
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([150, 50])
    expect(result.length).toBe(2)
  })

  it('deletes node from path with multiple curves', () => {
    const cmds = parsePathCommands('M 0 0 C 30 40 50 60 100 100 Q 120 80 150 50 L 200 100')
    const result = deleteNode(cmds, 2)
    expect(result[0].type).toBe('M')
    expect(result.length).toBe(3)
    expect(result[1].type).toBe('C')
    expect(result[2].type).toBe('L')
    expect(result[2].params).toEqual([200, 100])
  })

  it('deletes Q curve node from M+Q+L path', () => {
    const cmds = parsePathCommands('M 0 0 Q 50 100 100 0 L 150 50')
    const result = deleteNode(cmds, 1)
    expect(result[0].type).toBe('M')
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([150, 50])
    expect(result.length).toBe(2)
  })

  it('deletes node from closed path with Z', () => {
    const cmds = parsePathCommands('M 0 0 L 100 0 L 100 100 Z')
    const result = deleteNode(cmds, 1)
    expect(result[0].type).toBe('M')
    expect(result[0].params).toEqual([0, 0])
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([100, 100])
    expect(result[2].type).toBe('Z')
  })

  it('preserves relative commands as absolute in result', () => {
    const cmds = parsePathCommands('M 0 0 l 50 50 l 50 -50')
    const result = deleteNode(cmds, 1)
    expect(result[0].type).toBe('M')
    expect(result[0].relative).toBe(false)
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([100, 0])
  })

  it('bridge between two curves becomes L', () => {
    const cmds = parsePathCommands('M 0 0 C 25 100 50 100 100 0 C 150 -100 200 100 250 0')
    const result = deleteNode(cmds, 1)
    expect(result.length).toBe(2)
    expect(result[0].type).toBe('M')
    expect(result[0].params).toEqual([0, 0])
    expect(result[1].type).toBe('L')
    expect(result[1].params).toEqual([250, 0])
  })
})

describe('mergeStyles', () => {
  it('merges override into base', () => {
    const base = { stroke: '#000', fill: 'none', strokeWidth: 2 }
    const overrides = { stroke: '#ff0000' }
    const result = mergeStyles(base, overrides)
    expect(result.stroke).toBe('#ff0000')
    expect(result.fill).toBe('none')
    expect(result.strokeWidth).toBe(2)
  })

  it('returns base if no overrides', () => {
    const base = { stroke: '#000' }
    expect(mergeStyles(base, null)).toEqual(base)
  })

  it('returns overrides if no base', () => {
    const overrides = { stroke: '#000' }
    expect(mergeStyles(null, overrides)).toEqual(overrides)
  })

  it('returns empty object if both null', () => {
    expect(mergeStyles(null, null)).toEqual({})
  })
})

describe('buildSvgString', () => {
  it('generates valid SVG for a single path', () => {
    const paths = [{
      d: 'M 0 0 L 100 0 L 100 100 Z',
      style: { stroke: '#333', fill: 'none', strokeWidth: 2 },
      visible: true,
    }]
    const svg = buildSvgString(paths)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('<path')
    expect(svg).toContain('M 0 0')
  })

  it('uses CSS inline style format without nested quotes', () => {
    const paths = [{
      d: 'M 0 0 L 100 0',
      style: { stroke: '#ff0000', fill: 'none', strokeWidth: 2, linecap: 'round' },
      visible: true,
    }]
    const svg = buildSvgString(paths)
    expect(svg).toContain('style="')
    expect(svg).toContain('fill:none')
    expect(svg).toContain('stroke:#ff0000')
    expect(svg).toContain('stroke-width:2')
    expect(svg).toContain('stroke-linecap:round')
    expect(svg).not.toContain('fill="')
    expect(svg).not.toContain('stroke="#')
    expect(svg).not.toContain('fill="none"')
    expect(svg.match(/style="([^"]*)"/)).toBeTruthy()
  })

  it('style properties separated by semicolon and space', () => {
    const paths = [{
      d: 'M 0 0 L 100 0',
      style: { stroke: '#333', fill: '#fff', strokeWidth: 1 },
      visible: true,
    }]
    const svg = buildSvgString(paths)
    expect(svg).toContain('fill:#fff; stroke:#333; stroke-width:1')
  })

  it('skips hidden paths when not exporting all', () => {
    const paths = [
      { d: 'M 0 0 L 100 0', style: { stroke: '#000', fill: 'none' }, visible: true },
      { d: 'M 0 0 L 50 50', style: { stroke: '#000', fill: 'none' }, visible: false },
    ]
    const svg = buildSvgString(paths, false)
    expect(svg).toContain('M 0 0 L 100 0')
    expect(svg).not.toContain('M 0 0 L 50 50')
  })

  it('handles empty paths array', () => {
    const svg = buildSvgString([])
    expect(svg).toContain('<svg')
  })

  it('includes xmlns attribute', () => {
    const paths = [{ d: 'M 0 0 L 100 0', style: { stroke: '#000', fill: 'none' }, visible: true }]
    const svg = buildSvgString(paths)
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })
})

describe('isValidHexColor', () => {
  it('validates 3-digit hex', () => {
    expect(isValidHexColor('#fff')).toBe(true)
    expect(isValidHexColor('#abc')).toBe(true)
  })

  it('validates 6-digit hex', () => {
    expect(isValidHexColor('#ffffff')).toBe(true)
    expect(isValidHexColor('#123ABC')).toBe(true)
  })

  it('rejects invalid colors', () => {
    expect(isValidHexColor('fff')).toBe(false)
    expect(isValidHexColor('#ggg')).toBe(false)
    expect(isValidHexColor('#12')).toBe(false)
    expect(isValidHexColor(123)).toBe(false)
  })
})

describe('updateCommandParam', () => {
  it('updates a single parameter', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'L', relative: false, params: [100, 200] },
    ]
    const result = updateCommandParam(cmds, 1, 0, 150)
    expect(result[1].params[0]).toBe(150)
    expect(result[1].params[1]).toBe(200)
  })

  it('does not modify other commands', () => {
    const cmds = [
      { type: 'M', relative: false, params: [0, 0] },
      { type: 'L', relative: false, params: [100, 200] },
    ]
    const result = updateCommandParam(cmds, 1, 0, 150)
    expect(result[0].params).toEqual([0, 0])
  })
})

describe('getPathBounds', () => {
  it('calculates bounds for simple path', () => {
    const bounds = getPathBounds('M 0 0 L 100 200')
    expect(bounds.minX).toBe(0)
    expect(bounds.minY).toBe(0)
    expect(bounds.maxX).toBe(100)
    expect(bounds.maxY).toBe(200)
    expect(bounds.width).toBe(100)
    expect(bounds.height).toBe(200)
  })

  it('handles empty path', () => {
    const bounds = getPathBounds('')
    expect(bounds.width).toBe(100)
    expect(bounds.height).toBe(100)
  })
})

describe('extractNodes and nodesToCommands roundtrip', () => {
  it('extracts nodes from M L path', () => {
    const cmds = parsePathCommands('M 0 0 L 100 0 L 100 100')
    const nodes = extractNodes(cmds)
    expect(nodes.length).toBe(3)
    expect(nodes[0].type).toBe('M')
    expect(nodes[0].x).toBe(0)
    expect(nodes[0].y).toBe(0)
  })

  it('extracts nodes from C path with handles', () => {
    const cmds = parsePathCommands('M 0 0 C 30 40 50 60 100 100')
    const nodes = extractNodes(cmds)
    expect(nodes.length).toBe(2)
    expect(nodes[1].handleIn).toEqual({ x: 30, y: 40 })
    expect(nodes[1].handleOut).toEqual({ x: 50, y: 60 })
  })
})

describe('distance', () => {
  it('calculates horizontal distance', () => {
    expect(distance(0, 0, 3, 0)).toBeCloseTo(3, 5)
  })

  it('calculates 3-4-5 distance', () => {
    expect(distance(0, 0, 3, 4)).toBeCloseTo(5, 5)
  })

  it('zero distance for same point', () => {
    expect(distance(5, 5, 5, 5)).toBe(0)
  })
})

describe('screenToWorld and worldToScreen', () => {
  it('are inverse operations', () => {
    const panX = 100
    const panY = 50
    const zoom = 2
    const world = screenToWorld(200, 150, panX, panY, zoom)
    const screen = worldToScreen(world.x, world.y, panX, panY, zoom)
    expect(screen.x).toBeCloseTo(200, 5)
    expect(screen.y).toBeCloseTo(150, 5)
  })
})

describe('clampZoom', () => {
  it('clamps to min', () => {
    expect(clampZoom(0)).toBe(0.1)
  })

  it('clamps to max', () => {
    expect(clampZoom(20)).toBe(10)
  })

  it('allows valid values', () => {
    expect(clampZoom(1)).toBe(1)
    expect(clampZoom(5)).toBe(5)
  })
})

describe('getControlPoints', () => {
  it('extracts control points from C path', () => {
    const absCmds = toAbsoluteCommands(parsePathCommands('M 0 0 C 30 40 50 60 100 100'))
    const pts = getControlPoints(absCmds)
    const anchors = pts.filter((p) => p.type === 'anchor')
    const handles = pts.filter((p) => p.type === 'handle')
    expect(anchors.length).toBe(2)
    expect(handles.length).toBe(2)
  })

  it('extracts points from L path', () => {
    const absCmds = toAbsoluteCommands(parsePathCommands('M 0 0 L 100 0 L 100 100'))
    const pts = getControlPoints(absCmds)
    const anchors = pts.filter((p) => p.type === 'anchor')
    expect(anchors.length).toBe(3)
  })
})
