import { useEffect, useRef, useCallback } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT, CITY_COORDINATES } from './constants.js'

function LogisticsMap({ points, currentIndex, isSigned, hasException }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const progressRef = useRef(0)
  const pulseRef = useRef(0)

  const drawMapOutline = useCallback((ctx) => {
    ctx.save()
    ctx.strokeStyle = '#d9d9d9'
    ctx.lineWidth = 1
    ctx.fillStyle = '#fafafa'

    ctx.beginPath()
    ctx.moveTo(250, 80)
    ctx.lineTo(350, 60)
    ctx.lineTo(450, 70)
    ctx.lineTo(550, 50)
    ctx.lineTo(650, 80)
    ctx.lineTo(700, 120)
    ctx.lineTo(720, 180)
    ctx.lineTo(700, 250)
    ctx.lineTo(680, 320)
    ctx.lineTo(650, 400)
    ctx.lineTo(600, 450)
    ctx.lineTo(520, 470)
    ctx.lineTo(450, 460)
    ctx.lineTo(380, 440)
    ctx.lineTo(320, 400)
    ctx.lineTo(270, 340)
    ctx.lineTo(220, 280)
    ctx.lineTo(180, 220)
    ctx.lineTo(200, 150)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#e8e8e8'
    ctx.lineWidth = 0.5

    ctx.beginPath()
    ctx.moveTo(350, 100)
    ctx.lineTo(320, 200)
    ctx.lineTo(280, 300)
    ctx.lineTo(300, 400)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(500, 80)
    ctx.lineTo(520, 180)
    ctx.lineTo(550, 280)
    ctx.lineTo(530, 380)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(400, 150)
    ctx.lineTo(500, 180)
    ctx.lineTo(600, 200)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(350, 280)
    ctx.lineTo(450, 300)
    ctx.lineTo(550, 320)
    ctx.stroke()

    ctx.setLineDash([])
    ctx.restore()
  }, [])

  const drawCityLabels = useCallback((ctx) => {
    ctx.save()
    ctx.font = '10px sans-serif'
    ctx.fillStyle = '#999'
    ctx.textAlign = 'center'

    const showCities = ['北京', '上海', '广州', '成都', '武汉', '西安']
    showCities.forEach((city) => {
      const coord = CITY_COORDINATES[city]
      if (coord) {
        ctx.fillText(city, coord.x, coord.y - 10)
      }
    })
    ctx.restore()
  }, [])

  const drawPoint = useCallback((ctx, point, isCurrent, isSignedEnd) => {
    const { x, y, type } = point

    ctx.save()

    if (type === 'origin') {
      ctx.fillStyle = '#1890ff'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('起', x, y)
    } else if (type === 'destination') {
      if (isSignedEnd) {
        ctx.fillStyle = '#52c41a'
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('✓', x, y)
      } else {
        ctx.fillStyle = '#fa8c16'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('终', x, y)
      }
    } else {
      ctx.fillStyle = '#bfbfbf'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    if (isCurrent) {
      const pulseSize = 6 + Math.sin(pulseRef.current) * 3
      ctx.strokeStyle = hasException ? 'rgba(245, 34, 45, 0.6)' : 'rgba(24, 144, 255, 0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, pulseSize + 6, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = hasException ? '#f5222d' : '#1890ff'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('📍', x, y)
    }

    ctx.restore()
  }, [hasException])

  const drawRoute = useCallback((ctx, routePoints, progress) => {
    if (!routePoints || routePoints.length < 2) return

    const totalSegments = routePoints.length - 1
    const progressSegments = progress * totalSegments
    const fullSegments = Math.floor(progressSegments)
    const partialProgress = progressSegments - fullSegments

    ctx.save()
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let i = 0; i < fullSegments && i < totalSegments; i++) {
      const start = routePoints[i]
      const end = routePoints[i + 1]
      ctx.strokeStyle = hasException ? '#f5222d' : '#1890ff'
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    if (fullSegments < totalSegments) {
      const start = routePoints[fullSegments]
      const end = routePoints[fullSegments + 1]
      const endX = start.x + (end.x - start.x) * partialProgress
      const endY = start.y + (end.y - start.y) * partialProgress

      ctx.strokeStyle = hasException ? '#f5222d' : '#1890ff'
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(217, 217, 217, 0.5)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    for (let i = fullSegments; i < totalSegments; i++) {
      const start = routePoints[i]
      const end = routePoints[i + 1]
      let sx = start.x
      let sy = start.y
      if (i === fullSegments) {
        sx = start.x + (end.x - start.x) * partialProgress
        sy = start.y + (end.y - start.y) * partialProgress
      }
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()
  }, [hasException])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    drawMapOutline(ctx)
    drawCityLabels(ctx)

    if (points && points.length > 0) {
      drawRoute(ctx, points, progressRef.current)

      points.forEach((point, index) => {
        const isCurrent = index === currentIndex
        const isSignedEnd = isSigned && point.type === 'destination'
        drawPoint(ctx, point, isCurrent, isSignedEnd)
      })
    }

    pulseRef.current += 0.08
  }, [points, currentIndex, isSigned, drawMapOutline, drawCityLabels, drawRoute, drawPoint])

  useEffect(() => {
    progressRef.current = 0
    let startTime = null
    const duration = 2000

    const animate = (time) => {
      if (!startTime) startTime = time
      const elapsed = time - startTime
      progressRef.current = Math.min(elapsed / duration, 1)
      draw()

      if (progressRef.current < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        const pulseLoop = () => {
          draw()
          animationRef.current = requestAnimationFrame(pulseLoop)
        }
        animationRef.current = requestAnimationFrame(pulseLoop)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [points, draw])

  return (
    <canvas
      ref={canvasRef}
      className="logistics-map-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
    />
  )
}

export default LogisticsMap
