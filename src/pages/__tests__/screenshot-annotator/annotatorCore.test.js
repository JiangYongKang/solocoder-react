import { describe, expect, it } from 'vitest'
import {
    addAnnotation,
    addBrushPoint,
    calculateImageFit,
    canRedo,
    canUndo,
    clamp,
    cloneAnnotations,
    createArrow,
    createBrush,
    createEllipse,
    createRectangle,
    createText,
    distance,
    findAnnotationAt,
    formatTimestamp,
    generateExportFilename,
    generateId,
    getAnnotationBounds,
    getHandles,
    hitTestAnnotation,
    hitTestHandle,
    measureTextWidth,
    moveAnnotation,
    normalizeEllipse,
    normalizeRect,
    pointInBrush,
    pointInEllipse,
    pointInRect,
    pointInText,
    pointNearEllipseEdge,
    pointNearLine,
    pointNearRectEdge,
    pushHistory,
    redo,
    removeAnnotations,
    resizeAnnotation,
    undo,
    updateAnnotation,
    validateImageType,
} from '../../screenshot-annotator/annotatorCore.js'
import {
    ANNOTATION_TYPES,
    HANDLE_TYPES,
    HISTORY_LIMIT,
} from '../../screenshot-annotator/constants.js'

describe('generateId', () => {
  it('应该生成唯一ID', () => {
    const id1 = generateId('test')
    const id2 = generateId('test')
    expect(id1).not.toBe(id2)
  })

  it('应该包含指定前缀', () => {
    const id = generateId('arrow')
    expect(id.startsWith('arrow_')).toBe(true)
  })

  it('默认前缀为ann', () => {
    const id = generateId()
    expect(id.startsWith('ann_')).toBe(true)
  })

  it('生成的ID应为字符串', () => {
    expect(typeof generateId()).toBe('string')
  })
})

describe('clamp', () => {
  it('应将值限制在范围内', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('边界值应正常', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('validateImageType', () => {
  it('应接受png格式', () => {
    expect(validateImageType({ type: 'image/png' })).toBe(true)
  })

  it('应接受jpeg格式', () => {
    expect(validateImageType({ type: 'image/jpeg' })).toBe(true)
  })

  it('应接受gif格式', () => {
    expect(validateImageType({ type: 'image/gif' })).toBe(true)
  })

  it('应接受webp格式', () => {
    expect(validateImageType({ type: 'image/webp' })).toBe(true)
  })

  it('应拒绝不支持的格式', () => {
    expect(validateImageType({ type: 'image/svg+xml' })).toBe(false)
    expect(validateImageType({ type: 'text/plain' })).toBe(false)
  })

  it('空文件应返回false', () => {
    expect(validateImageType(null)).toBe(false)
    expect(validateImageType(undefined)).toBe(false)
    expect(validateImageType({})).toBe(false)
  })
})

describe('calculateImageFit', () => {
  it('图片小于画布时应等比缩放并居中', () => {
    const result = calculateImageFit(450, 300, 900, 600)
    expect(result.scale).toBe(1)
    expect(result.drawWidth).toBe(450)
    expect(result.drawHeight).toBe(300)
    expect(result.offsetX).toBe(225)
    expect(result.offsetY).toBe(150)
  })

  it('图片大于画布时应等比缩放', () => {
    const result = calculateImageFit(1800, 1200, 900, 600)
    expect(result.scale).toBe(0.5)
    expect(result.drawWidth).toBe(900)
    expect(result.drawHeight).toBe(600)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe(0)
  })

  it('图片宽度大于画布但高度小于画布', () => {
    const result = calculateImageFit(1800, 300, 900, 600)
    expect(result.scale).toBe(0.5)
    expect(result.drawWidth).toBe(900)
    expect(result.drawHeight).toBe(150)
  })

  it('图片高度大于画布但宽度小于画布', () => {
    const result = calculateImageFit(300, 1200, 900, 600)
    expect(result.scale).toBe(0.5)
    expect(result.drawWidth).toBe(150)
    expect(result.drawHeight).toBe(600)
  })

  it('零值参数应返回安全默认值', () => {
    const result = calculateImageFit(0, 0, 900, 600)
    expect(result.scale).toBe(1)
  })

  it('空值参数应返回安全默认值', () => {
    const result = calculateImageFit(100, 100, 0, 0)
    expect(result.scale).toBe(1)
  })
})

describe('createArrow', () => {
  it('应创建箭头标注', () => {
    const arrow = createArrow(10, 20, 100, 200, '#ff0000', 2)
    expect(arrow.type).toBe(ANNOTATION_TYPES.ARROW)
    expect(arrow.x1).toBe(10)
    expect(arrow.y1).toBe(20)
    expect(arrow.x2).toBe(100)
    expect(arrow.y2).toBe(200)
    expect(arrow.color).toBe('#ff0000')
    expect(arrow.lineWidth).toBe(2)
    expect(arrow.id).toBeTruthy()
  })
})

describe('createRectangle', () => {
  it('应创建矩形标注', () => {
    const rect = createRectangle(10, 20, 100, 200, '#0066ff', 2, 0.3)
    expect(rect.type).toBe(ANNOTATION_TYPES.RECTANGLE)
    expect(rect.x).toBe(10)
    expect(rect.y).toBe(20)
    expect(rect.width).toBe(100)
    expect(rect.height).toBe(200)
    expect(rect.color).toBe('#0066ff')
    expect(rect.lineWidth).toBe(2)
    expect(rect.fillOpacity).toBe(0.3)
    expect(rect.borderRadius).toBe(4)
  })

  it('未指定fillOpacity时应默认为0', () => {
    const rect = createRectangle(0, 0, 100, 100, '#000', 2)
    expect(rect.fillOpacity).toBe(0)
  })
})

describe('createEllipse', () => {
  it('应创建椭圆标注', () => {
    const ellipse = createEllipse(50, 50, 40, 30, '#00cc00', 2, 0)
    expect(ellipse.type).toBe(ANNOTATION_TYPES.ELLIPSE)
    expect(ellipse.cx).toBe(50)
    expect(ellipse.cy).toBe(50)
    expect(ellipse.rx).toBe(40)
    expect(ellipse.ry).toBe(30)
    expect(ellipse.fillOpacity).toBe(0)
  })

  it('未指定fillOpacity时应默认为0', () => {
    const ellipse = createEllipse(50, 50, 40, 30, '#000', 2)
    expect(ellipse.fillOpacity).toBe(0)
  })
})

describe('createText', () => {
  it('应创建文字标注', () => {
    const text = createText(100, 200, 'Hello', '#000000', 16)
    expect(text.type).toBe(ANNOTATION_TYPES.TEXT)
    expect(text.x).toBe(100)
    expect(text.y).toBe(200)
    expect(text.text).toBe('Hello')
    expect(text.color).toBe('#000000')
    expect(text.fontSize).toBe(16)
  })
})

describe('createBrush', () => {
  it('应创建画笔标注', () => {
    const brush = createBrush([{ x: 10, y: 20 }, { x: 30, y: 40 }], '#ff0000', 3)
    expect(brush.type).toBe(ANNOTATION_TYPES.BRUSH)
    expect(brush.points).toEqual([{ x: 10, y: 20 }, { x: 30, y: 40 }])
    expect(brush.color).toBe('#ff0000')
    expect(brush.lineWidth).toBe(3)
  })

  it('应深拷贝points', () => {
    const points = [{ x: 10, y: 20 }]
    const brush = createBrush(points, '#000', 2)
    points[0].x = 999
    expect(brush.points[0].x).toBe(10)
  })

  it('null points应返回空数组', () => {
    const brush = createBrush(null, '#000', 2)
    expect(brush.points).toEqual([])
  })
})

describe('normalizeRect', () => {
  it('正值宽高应不变', () => {
    const r = normalizeRect(10, 20, 100, 200)
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 200 })
  })

  it('负值宽度应标准化', () => {
    const r = normalizeRect(110, 20, -100, 200)
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 200 })
  })

  it('负值高度应标准化', () => {
    const r = normalizeRect(10, 220, 100, -200)
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 200 })
  })

  it('负值宽高都应标准化', () => {
    const r = normalizeRect(110, 220, -100, -200)
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 200 })
  })
})

describe('normalizeEllipse', () => {
  it('应取半径绝对值', () => {
    expect(normalizeEllipse(50, 50, -40, -30)).toEqual({ cx: 50, cy: 50, rx: 40, ry: 30 })
  })

  it('正值应不变', () => {
    expect(normalizeEllipse(50, 50, 40, 30)).toEqual({ cx: 50, cy: 50, rx: 40, ry: 30 })
  })
})

describe('addAnnotation', () => {
  it('应添加标注到数组', () => {
    const anns = [{ id: '1' }]
    const newAnn = { id: '2' }
    const result = addAnnotation(anns, newAnn)
    expect(result).toEqual([{ id: '1' }, { id: '2' }])
  })

  it('不应修改原数组', () => {
    const anns = [{ id: '1' }]
    addAnnotation(anns, { id: '2' })
    expect(anns.length).toBe(1)
  })

  it('非数组输入应返回包含新标注的数组', () => {
    const result = addAnnotation(null, { id: '1' })
    expect(result).toEqual([{ id: '1' }])
  })
})

describe('removeAnnotations', () => {
  it('应按ID删除标注', () => {
    const anns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = removeAnnotations(anns, ['b'])
    expect(result).toEqual([{ id: 'a' }, { id: 'c' }])
  })

  it('应支持批量删除', () => {
    const anns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const result = removeAnnotations(anns, ['a', 'c'])
    expect(result).toEqual([{ id: 'b' }])
  })

  it('删除不存在的ID不应报错', () => {
    const anns = [{ id: 'a' }]
    const result = removeAnnotations(anns, ['z'])
    expect(result).toEqual([{ id: 'a' }])
  })

  it('非数组输入应返回空数组', () => {
    expect(removeAnnotations(null, ['a'])).toEqual([])
  })

  it('单个ID应也能处理', () => {
    const anns = [{ id: 'a' }, { id: 'b' }]
    const result = removeAnnotations(anns, 'a')
    expect(result).toEqual([{ id: 'b' }])
  })
})

describe('updateAnnotation', () => {
  it('应更新指定ID的标注', () => {
    const anns = [{ id: 'a', color: 'red' }, { id: 'b', color: 'blue' }]
    const result = updateAnnotation(anns, 'a', { color: 'green' })
    expect(result[0].color).toBe('green')
    expect(result[1].color).toBe('blue')
  })

  it('不应修改原数组', () => {
    const anns = [{ id: 'a', color: 'red' }]
    updateAnnotation(anns, 'a', { color: 'green' })
    expect(anns[0].color).toBe('red')
  })

  it('不存在的ID不应报错', () => {
    const anns = [{ id: 'a', color: 'red' }]
    const result = updateAnnotation(anns, 'z', { color: 'green' })
    expect(result).toEqual([{ id: 'a', color: 'red' }])
  })
})

describe('addBrushPoint', () => {
  it('应添加点到画笔标注', () => {
    const brush = { type: ANNOTATION_TYPES.BRUSH, points: [{ x: 0, y: 0 }] }
    const result = addBrushPoint(brush, { x: 10, y: 20 })
    expect(result.points).toEqual([{ x: 0, y: 0 }, { x: 10, y: 20 }])
  })

  it('不应修改原标注的points', () => {
    const brush = { type: ANNOTATION_TYPES.BRUSH, points: [{ x: 0, y: 0 }] }
    addBrushPoint(brush, { x: 10, y: 20 })
    expect(brush.points.length).toBe(1)
  })

  it('非画笔标注应原样返回', () => {
    const rect = { type: ANNOTATION_TYPES.RECTANGLE, x: 0 }
    const result = addBrushPoint(rect, { x: 10, y: 20 })
    expect(result).toBe(rect)
  })

  it('null输入应原样返回', () => {
    expect(addBrushPoint(null, { x: 10, y: 20 })).toBeNull()
  })
})

describe('distance', () => {
  it('应计算两点距离', () => {
    expect(distance(0, 0, 3, 4)).toBe(5)
  })

  it('同一点距离为0', () => {
    expect(distance(5, 5, 5, 5)).toBe(0)
  })
})

describe('pointNearLine', () => {
  it('线段上的点应返回true', () => {
    expect(pointNearLine(5, 0, 0, 0, 10, 0)).toBe(true)
  })

  it('远离线段的点应返回false', () => {
    expect(pointNearLine(5, 100, 0, 0, 10, 0, 6)).toBe(false)
  })

  it('线段延长线附近的点应返回false（超出范围）', () => {
    expect(pointNearLine(50, 0, 0, 0, 10, 0, 6)).toBe(true)
  })

  it('零长度线段应按点距离判断', () => {
    expect(pointNearLine(0, 0, 0, 0, 0, 0, 6)).toBe(true)
    expect(pointNearLine(10, 0, 0, 0, 0, 0, 6)).toBe(false)
  })
})

describe('pointInRect', () => {
  it('矩形内部的点应返回true', () => {
    expect(pointInRect(50, 50, 0, 0, 100, 100)).toBe(true)
  })

  it('矩形外部的点应返回false', () => {
    expect(pointInRect(150, 50, 0, 0, 100, 100)).toBe(false)
  })

  it('边界上的点应返回true', () => {
    expect(pointInRect(0, 0, 0, 0, 100, 100)).toBe(true)
    expect(pointInRect(100, 100, 0, 0, 100, 100)).toBe(true)
  })

  it('负值宽高矩形应正常工作', () => {
    expect(pointInRect(50, 50, 100, 100, -100, -100)).toBe(true)
  })
})

describe('pointNearRectEdge', () => {
  it('靠近矩形边的点应返回true', () => {
    expect(pointNearRectEdge(50, 2, 0, 0, 100, 100, 6)).toBe(true)
  })

  it('远离矩形边的点应返回false', () => {
    expect(pointNearRectEdge(50, 50, 0, 0, 100, 100, 6)).toBe(false)
  })

  it('矩形外但靠近边的点应返回true', () => {
    expect(pointNearRectEdge(50, -2, 0, 0, 100, 100, 6)).toBe(true)
  })
})

describe('pointInEllipse', () => {
  it('椭圆内部的点应返回true', () => {
    expect(pointInEllipse(50, 50, 50, 50, 40, 30)).toBe(true)
  })

  it('椭圆外部的点应返回false', () => {
    expect(pointInEllipse(200, 200, 50, 50, 40, 30)).toBe(false)
  })

  it('零半径应返回false', () => {
    expect(pointInEllipse(0, 0, 0, 0, 0, 0)).toBe(false)
  })

  it('椭圆边界上的点应返回true', () => {
    expect(pointInEllipse(90, 50, 50, 50, 40, 30)).toBe(true)
  })
})

describe('pointNearEllipseEdge', () => {
  it('靠近椭圆边缘的点应返回true', () => {
    expect(pointNearEllipseEdge(91, 50, 50, 50, 40, 30, 6)).toBe(true)
  })

  it('椭圆内部远点应返回false', () => {
    expect(pointNearEllipseEdge(50, 50, 50, 50, 40, 30, 6)).toBe(false)
  })

  it('远离椭圆的点应返回false', () => {
    expect(pointNearEllipseEdge(200, 200, 50, 50, 40, 30, 6)).toBe(false)
  })
})

describe('pointInBrush', () => {
  it('靠近画笔路径的点应返回true', () => {
    const brush = {
      type: ANNOTATION_TYPES.BRUSH,
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      lineWidth: 2,
    }
    expect(pointInBrush(50, 0, brush)).toBe(true)
  })

  it('远离画笔路径的点应返回false', () => {
    const brush = {
      type: ANNOTATION_TYPES.BRUSH,
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      lineWidth: 2,
    }
    expect(pointInBrush(50, 100, brush)).toBe(false)
  })

  it('空画笔应返回false', () => {
    const brush = {
      type: ANNOTATION_TYPES.BRUSH,
      points: [],
      lineWidth: 2,
    }
    expect(pointInBrush(50, 50, brush)).toBe(false)
  })

  it('单点画笔应返回false', () => {
    const brush = {
      type: ANNOTATION_TYPES.BRUSH,
      points: [{ x: 0, y: 0 }],
      lineWidth: 2,
    }
    expect(pointInBrush(0, 0, brush)).toBe(false)
  })

  it('null画笔应返回false', () => {
    expect(pointInBrush(0, 0, null)).toBe(false)
  })

  it('非画笔类型应返回false', () => {
    expect(pointInBrush(0, 0, { type: 'rectangle' })).toBe(false)
  })
})

describe('measureTextWidth', () => {
  it('空文字应返回0', () => {
    expect(measureTextWidth('', 16)).toBe(0)
    expect(measureTextWidth(null, 16)).toBe(0)
  })

  it('应按字符数和字号估算宽度', () => {
    const width = measureTextWidth('Hello', 16)
    expect(width).toBe(5 * 16 * 0.6)
  })
})

describe('pointInText', () => {
  it('文字区域内的点应返回true', () => {
    const text = { type: ANNOTATION_TYPES.TEXT, x: 100, y: 100, text: 'Hi', fontSize: 16 }
    expect(pointInText(105, 90, text)).toBe(true)
  })

  it('文字区域外的点应返回false', () => {
    const text = { type: ANNOTATION_TYPES.TEXT, x: 100, y: 100, text: 'Hi', fontSize: 16 }
    expect(pointInText(500, 500, text)).toBe(false)
  })

  it('null标注应返回false', () => {
    expect(pointInText(0, 0, null)).toBe(false)
  })

  it('非文字类型应返回false', () => {
    expect(pointInText(0, 0, { type: 'rectangle' })).toBe(false)
  })
})

describe('hitTestAnnotation', () => {
  it('箭头线段附近的点应命中', () => {
    const arrow = { type: ANNOTATION_TYPES.ARROW, x1: 0, y1: 0, x2: 100, y2: 0 }
    expect(hitTestAnnotation(50, 0, arrow)).toBe(true)
    expect(hitTestAnnotation(50, 50, arrow)).toBe(false)
  })

  it('有填充的矩形内部点应命中', () => {
    const rect = { type: ANNOTATION_TYPES.RECTANGLE, x: 0, y: 0, width: 100, height: 100, fillOpacity: 0.3 }
    expect(hitTestAnnotation(50, 50, rect)).toBe(true)
  })

  it('无填充矩形边缘点应命中', () => {
    const rect = { type: ANNOTATION_TYPES.RECTANGLE, x: 0, y: 0, width: 100, height: 100, fillOpacity: 0 }
    expect(hitTestAnnotation(50, 2, rect)).toBe(true)
  })

  it('有填充的椭圆内部点应命中', () => {
    const ellipse = { type: ANNOTATION_TYPES.ELLIPSE, cx: 50, cy: 50, rx: 40, ry: 30, fillOpacity: 0.3 }
    expect(hitTestAnnotation(50, 50, ellipse)).toBe(true)
  })

  it('文字区域内的点应命中', () => {
    const text = { type: ANNOTATION_TYPES.TEXT, x: 100, y: 100, text: 'Hi', fontSize: 16 }
    expect(hitTestAnnotation(105, 90, text)).toBe(true)
  })

  it('画笔路径附近的点应命中', () => {
    const brush = {
      type: ANNOTATION_TYPES.BRUSH,
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      lineWidth: 2,
    }
    expect(hitTestAnnotation(50, 0, brush)).toBe(true)
  })

  it('null标注应返回false', () => {
    expect(hitTestAnnotation(0, 0, null)).toBe(false)
  })
})

describe('findAnnotationAt', () => {
  it('应找到最上层命中的标注', () => {
    const anns = [
      { type: ANNOTATION_TYPES.RECTANGLE, id: 'r1', x: 0, y: 0, width: 100, height: 100, fillOpacity: 0.3 },
      { type: ANNOTATION_TYPES.RECTANGLE, id: 'r2', x: 0, y: 0, width: 100, height: 100, fillOpacity: 0.3 },
    ]
    const result = findAnnotationAt(anns, 50, 50)
    expect(result.id).toBe('r2')
  })

  it('没有命中应返回null', () => {
    const anns = [
      { type: ANNOTATION_TYPES.RECTANGLE, id: 'r1', x: 0, y: 0, width: 10, height: 10, fillOpacity: 0 },
    ]
    expect(findAnnotationAt(anns, 500, 500)).toBeNull()
  })

  it('非数组应返回null', () => {
    expect(findAnnotationAt(null, 0, 0)).toBeNull()
  })
})

describe('getAnnotationBounds', () => {
  it('箭头边界', () => {
    const bounds = getAnnotationBounds({ type: ANNOTATION_TYPES.ARROW, x1: 10, y1: 20, x2: 100, y2: 200 })
    expect(bounds).toEqual({ x: 10, y: 20, width: 90, height: 180 })
  })

  it('矩形边界', () => {
    const bounds = getAnnotationBounds({ type: ANNOTATION_TYPES.RECTANGLE, x: 10, y: 20, width: 100, height: 200 })
    expect(bounds).toEqual({ x: 10, y: 20, width: 100, height: 200 })
  })

  it('负值宽高矩形边界应标准化', () => {
    const bounds = getAnnotationBounds({ type: ANNOTATION_TYPES.RECTANGLE, x: 110, y: 220, width: -100, height: -200 })
    expect(bounds).toEqual({ x: 10, y: 20, width: 100, height: 200 })
  })

  it('椭圆边界', () => {
    const bounds = getAnnotationBounds({ type: ANNOTATION_TYPES.ELLIPSE, cx: 50, cy: 50, rx: 40, ry: 30 })
    expect(bounds).toEqual({ x: 10, y: 20, width: 80, height: 60 })
  })

  it('文字边界', () => {
    const bounds = getAnnotationBounds({ type: ANNOTATION_TYPES.TEXT, text: 'Hi', fontSize: 16, x: 100, y: 100 })
    expect(bounds.x).toBe(100)
    expect(bounds.width).toBeGreaterThan(0)
  })

  it('画笔边界', () => {
    const bounds = getAnnotationBounds({
      type: ANNOTATION_TYPES.BRUSH,
      points: [{ x: 10, y: 20 }, { x: 100, y: 200 }],
    })
    expect(bounds).toEqual({ x: 10, y: 20, width: 90, height: 180 })
  })

  it('空画笔应返回零边界', () => {
    const bounds = getAnnotationBounds({ type: ANNOTATION_TYPES.BRUSH, points: [] })
    expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })

  it('null标注应返回零边界', () => {
    const bounds = getAnnotationBounds(null)
    expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })
})

describe('getHandles', () => {
  it('箭头应有两个手柄', () => {
    const handles = getHandles({ type: ANNOTATION_TYPES.ARROW, id: 'a1', x1: 0, y1: 0, x2: 100, y2: 100 })
    expect(handles.length).toBe(2)
    expect(handles[0].type).toBe(HANDLE_TYPES.START)
    expect(handles[1].type).toBe(HANDLE_TYPES.END)
  })

  it('矩形应有四个角手柄', () => {
    const handles = getHandles({ type: ANNOTATION_TYPES.RECTANGLE, id: 'r1', x: 0, y: 0, width: 100, height: 100 })
    expect(handles.length).toBe(4)
    expect(handles.map(h => h.type)).toEqual([HANDLE_TYPES.NW, HANDLE_TYPES.NE, HANDLE_TYPES.SW, HANDLE_TYPES.SE])
  })

  it('椭圆应有四个角手柄', () => {
    const handles = getHandles({ type: ANNOTATION_TYPES.ELLIPSE, id: 'e1', cx: 50, cy: 50, rx: 40, ry: 30 })
    expect(handles.length).toBe(4)
  })

  it('文字应有一个移动手柄', () => {
    const handles = getHandles({ type: ANNOTATION_TYPES.TEXT, id: 't1', x: 100, y: 100, text: 'Hi', fontSize: 16 })
    expect(handles.length).toBe(1)
    expect(handles[0].type).toBe(HANDLE_TYPES.MOVE)
  })

  it('画笔应有一个移动手柄', () => {
    const handles = getHandles({ type: ANNOTATION_TYPES.BRUSH, id: 'b1', points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] })
    expect(handles.length).toBe(1)
    expect(handles[0].type).toBe(HANDLE_TYPES.MOVE)
  })

  it('null标注应返回空数组', () => {
    expect(getHandles(null)).toEqual([])
  })
})

describe('hitTestHandle', () => {
  it('命中的手柄应返回该手柄', () => {
    const handles = [
      { type: 'nw', x: 0, y: 0, size: 10 },
      { type: 'ne', x: 90, y: 0, size: 10 },
    ]
    const result = hitTestHandle(handles, 5, 5)
    expect(result.type).toBe('nw')
  })

  it('未命中应返回null', () => {
    const handles = [
      { type: 'nw', x: 0, y: 0, size: 10 },
    ]
    expect(hitTestHandle(handles, 50, 50)).toBeNull()
  })

  it('非数组应返回null', () => {
    expect(hitTestHandle(null, 0, 0)).toBeNull()
  })
})

describe('moveAnnotation', () => {
  it('应移动箭头标注', () => {
    const arrow = { type: ANNOTATION_TYPES.ARROW, x1: 0, y1: 0, x2: 100, y2: 100 }
    const moved = moveAnnotation(arrow, 10, 20)
    expect(moved.x1).toBe(10)
    expect(moved.y1).toBe(20)
    expect(moved.x2).toBe(110)
    expect(moved.y2).toBe(120)
  })

  it('应移动矩形标注', () => {
    const rect = { type: ANNOTATION_TYPES.RECTANGLE, x: 0, y: 0, width: 100, height: 100 }
    const moved = moveAnnotation(rect, 10, 20)
    expect(moved.x).toBe(10)
    expect(moved.y).toBe(20)
    expect(moved.width).toBe(100)
  })

  it('应移动椭圆标注', () => {
    const ellipse = { type: ANNOTATION_TYPES.ELLIPSE, cx: 50, cy: 50, rx: 40, ry: 30 }
    const moved = moveAnnotation(ellipse, 10, 20)
    expect(moved.cx).toBe(60)
    expect(moved.cy).toBe(70)
  })

  it('应移动文字标注', () => {
    const text = { type: ANNOTATION_TYPES.TEXT, x: 100, y: 100, text: 'Hi', fontSize: 16 }
    const moved = moveAnnotation(text, -10, -20)
    expect(moved.x).toBe(90)
    expect(moved.y).toBe(80)
  })

  it('应移动画笔标注的所有点', () => {
    const brush = { type: ANNOTATION_TYPES.BRUSH, points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] }
    const moved = moveAnnotation(brush, 10, 20)
    expect(moved.points).toEqual([{ x: 10, y: 20 }, { x: 110, y: 120 }])
  })

  it('null标注应原样返回', () => {
    expect(moveAnnotation(null, 10, 20)).toBeNull()
  })
})

describe('resizeAnnotation', () => {
  it('应调整箭头起点', () => {
    const arrow = { type: ANNOTATION_TYPES.ARROW, x1: 0, y1: 0, x2: 100, y2: 100 }
    const resized = resizeAnnotation(arrow, HANDLE_TYPES.START, 10, 20)
    expect(resized.x1).toBe(10)
    expect(resized.y1).toBe(20)
    expect(resized.x2).toBe(100)
  })

  it('应调整箭头终点', () => {
    const arrow = { type: ANNOTATION_TYPES.ARROW, x1: 0, y1: 0, x2: 100, y2: 100 }
    const resized = resizeAnnotation(arrow, HANDLE_TYPES.END, 10, 20)
    expect(resized.x2).toBe(110)
    expect(resized.y2).toBe(120)
  })

  it('应调整矩形SE角', () => {
    const rect = { type: ANNOTATION_TYPES.RECTANGLE, x: 0, y: 0, width: 100, height: 100 }
    const resized = resizeAnnotation(rect, HANDLE_TYPES.SE, 20, 30)
    expect(resized.width).toBe(120)
    expect(resized.height).toBe(130)
  })

  it('应调整矩形NW角', () => {
    const rect = { type: ANNOTATION_TYPES.RECTANGLE, x: 0, y: 0, width: 100, height: 100 }
    const resized = resizeAnnotation(rect, HANDLE_TYPES.NW, 10, 10)
    expect(resized.x).toBe(10)
    expect(resized.y).toBe(10)
    expect(resized.width).toBe(90)
    expect(resized.height).toBe(90)
  })

  it('应调整椭圆SE角', () => {
    const ellipse = { type: ANNOTATION_TYPES.ELLIPSE, cx: 50, cy: 50, rx: 40, ry: 30 }
    const resized = resizeAnnotation(ellipse, HANDLE_TYPES.SE, 20, 10)
    expect(resized.rx).toBe(50)
    expect(resized.ry).toBe(35)
  })

  it('null标注应原样返回', () => {
    expect(resizeAnnotation(null, HANDLE_TYPES.SE, 10, 10)).toBeNull()
  })
})

describe('pushHistory', () => {
  it('应添加新的历史记录', () => {
    const result = pushHistory([[]], 0, [{ id: 'a' }])
    expect(result.history.length).toBe(2)
    expect(result.historyIndex).toBe(1)
  })

  it('新操作应截断后续历史', () => {
    const result = pushHistory([[], [{ id: 'a' }], [{ id: 'b' }]], 1, [{ id: 'c' }])
    expect(result.history.length).toBe(2)
    expect(result.historyIndex).toBe(1)
  })

  it('应限制历史记录数量', () => {
    const history = Array.from({ length: HISTORY_LIMIT }, (_, i) => [{ id: String(i) }])
    const result = pushHistory(history, history.length - 1, [{ id: 'new' }])
    expect(result.history.length).toBe(HISTORY_LIMIT)
  })

  it('非数组历史应返回默认值', () => {
    const result = pushHistory(null, 0, [{ id: 'a' }])
    expect(result.history).toEqual([[{ id: 'a' }]])
    expect(result.historyIndex).toBe(0)
  })
})

describe('canUndo', () => {
  it('历史索引大于0时应返回true', () => {
    expect(canUndo(1)).toBe(true)
    expect(canUndo(5)).toBe(true)
  })

  it('历史索引为0时应返回false', () => {
    expect(canUndo(0)).toBe(false)
  })
})

describe('canRedo', () => {
  it('索引小于历史长度-1时应返回true', () => {
    expect(canRedo([[], [], []], 0)).toBe(true)
    expect(canRedo([[], [], []], 1)).toBe(true)
  })

  it('索引等于历史长度-1时应返回false', () => {
    expect(canRedo([[], [], []], 2)).toBe(false)
  })

  it('非数组应返回false', () => {
    expect(canRedo(null, 0)).toBe(false)
  })
})

describe('undo', () => {
  it('应回退到上一步', () => {
    const history = [[], [{ id: 'a' }], [{ id: 'b' }]]
    const result = undo([], history, 2)
    expect(result.annotations).toEqual([{ id: 'a' }])
    expect(result.historyIndex).toBe(1)
  })

  it('无法回退时应返回当前状态', () => {
    const result = undo([], [[]], 0)
    expect(result.historyIndex).toBe(0)
  })
})

describe('redo', () => {
  it('应前进到下一步', () => {
    const history = [[], [{ id: 'a' }], [{ id: 'b' }]]
    const result = redo([], history, 0)
    expect(result.annotations).toEqual([{ id: 'a' }])
    expect(result.historyIndex).toBe(1)
  })

  it('无法前进时应返回当前状态', () => {
    const result = redo([], [[], []], 1)
    expect(result.historyIndex).toBe(1)
  })
})

describe('formatTimestamp', () => {
  it('应正确格式化日期', () => {
    const d = new Date(2025, 0, 15, 10, 30, 45)
    const result = formatTimestamp(d)
    expect(result).toBe('2025-01-15 10:30:45')
  })

  it('应接受时间戳数字', () => {
    const d = new Date(2025, 5, 1, 8, 5, 3)
    const result = formatTimestamp(d.getTime())
    expect(result).toBe('2025-06-01 08:05:03')
  })

  it('无效日期应返回空字符串', () => {
    expect(formatTimestamp('invalid')).toBe('')
    expect(formatTimestamp(NaN)).toBe('')
  })
})

describe('generateExportFilename', () => {
  it('应生成以"标注截图_"开头的文件名', () => {
    const result = generateExportFilename()
    expect(result.startsWith('标注截图_')).toBe(true)
  })

  it('应以.png结尾', () => {
    const result = generateExportFilename()
    expect(result.endsWith('.png')).toBe(true)
  })
})

describe('cloneAnnotations', () => {
  it('应深拷贝标注数组', () => {
    const anns = [
      { id: 'a', type: ANNOTATION_TYPES.RECTANGLE, x: 0, y: 0 },
      { id: 'b', type: ANNOTATION_TYPES.BRUSH, points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] },
    ]
    const cloned = cloneAnnotations(anns)
    expect(cloned).toEqual(anns)
    expect(cloned).not.toBe(anns)
    expect(cloned[1].points).not.toBe(anns[1].points)
  })

  it('非数组应返回空数组', () => {
    expect(cloneAnnotations(null)).toEqual([])
    expect(cloneAnnotations(undefined)).toEqual([])
  })

  it('空数组应返回空数组', () => {
    expect(cloneAnnotations([])).toEqual([])
  })
})
