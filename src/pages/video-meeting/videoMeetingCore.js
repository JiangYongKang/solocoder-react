import {
    AVATAR_COLORS,
    CHAT_SIMULATE_INTERVAL_MAX,
    CHAT_SIMULATE_INTERVAL_MIN,
    DEFAULT_GAP,
    MIN_CELL_HEIGHT,
    MIN_CELL_WIDTH,
    PARTICIPANT_NAMES,
} from './constants.js'

export function getInitials(name) {
  if (typeof name !== 'string') return '?'
  const trimmed = name.trim()
  if (trimmed.length === 0) return '?'
  if (trimmed.length === 1) return trimmed
  if (/[\u4e00-\u9fa5]/.test(trimmed)) {
    return trimmed.slice(0, Math.min(2, trimmed.length))
  }
  return trimmed[0] + trimmed[trimmed.length - 1]
}

export function generateAvatarColor(name) {
  if (typeof name !== 'string') return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export function calculateGridLayout(count) {
  if (count <= 0) return { cols: 1, rows: 1 }
  if (count === 1) return { cols: 1, rows: 1 }
  if (count === 2) return { cols: 2, rows: 1 }
  if (count <= 4) return { cols: 2, rows: 2 }
  if (count <= 6) return { cols: 3, rows: 2 }
  if (count <= 9) return { cols: 3, rows: 3 }
  const sqrt = Math.ceil(Math.sqrt(count))
  return { cols: sqrt, rows: sqrt }
}

export function createParticipant(id, name, isSelf = false) {
  return {
    id,
    name,
    isSelf,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    isHandRaised: false,
    avatarColor: generateAvatarColor(name),
    initials: getInitials(name),
  }
}

export function generateInitialParticipants() {
  const participants = [createParticipant('self', '我', true)]
  PARTICIPANT_NAMES.forEach((name, index) => {
    participants.push(createParticipant(`p${index + 1}`, name))
  })
  return participants
}

export function toggleParticipantProperty(participants, participantId, property) {
  return participants.map((p) => {
    if (p.id === participantId) {
      return { ...p, [property]: !p[property] }
    }
    return p
  })
}

export function sortParticipantsSelfFirst(participants) {
  return [...participants].sort((a, b) => {
    if (a.isSelf && !b.isSelf) return -1
    if (!a.isSelf && b.isSelf) return 1
    return 0
  })
}

export function filterParticipants(participants, searchTerm) {
  if (searchTerm === null || searchTerm === undefined || searchTerm === '') {
    return participants
  }
  const term = String(searchTerm).toLowerCase()
  return participants.filter((p) =>
    p.name.toLowerCase().includes(term)
  )
}

export function formatTimestamp(timestamp) {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    if (isNaN(date.getTime())) return ''
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return ''
  }
}

export function createChatMessage(senderId, senderName, content) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    senderId,
    senderName,
    content,
    timestamp: new Date(),
  }
}

export function generateRandomChatMessage(participants, excludeSenderId = null, messagePool) {
  const others = participants.filter(
    (p) => !p.isSelf && p.id !== excludeSenderId
  )
  if (others.length === 0) return null
  const randomParticipant = others[Math.floor(Math.random() * others.length)]
  const messages = messagePool && messagePool.length > 0 ? messagePool : ['你好']
  const randomContent = messages[Math.floor(Math.random() * messages.length)]
  return createChatMessage(
    randomParticipant.id,
    randomParticipant.name,
    randomContent
  )
}

export function getRandomChatInterval(min = CHAT_SIMULATE_INTERVAL_MIN, max = CHAT_SIMULATE_INTERVAL_MAX) {
  if (min >= max) return min
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function parseMentions(text, participants) {
  if (typeof text !== 'string') return []
  const result = []
  const regex = /@([^\s@]+)/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const mentionName = match[1]
    const participant = participants.find((p) => p.name === mentionName)
    if (participant) {
      result.push(participant)
    }
  }
  return result
}

export function insertMention(text, cursorPosition, mentionName) {
  if (typeof text !== 'string') return { text, cursorPosition }
  let atIndex = -1
  for (let i = cursorPosition - 1; i >= 0; i--) {
    if (text[i] === '@') {
      atIndex = i
      break
    }
    if (text[i] === ' ') break
  }
  if (atIndex === -1) return { text, cursorPosition }
  let queryEnd = atIndex + 1
  while (queryEnd < text.length && text[queryEnd] !== ' ' && text[queryEnd] !== '@') {
    queryEnd++
  }
  const before = text.slice(0, atIndex)
  let after = text.slice(queryEnd)
  const addSpace = after.length === 0 || after[0] !== ' '
  const newText = before + `@${mentionName}` + (addSpace ? ' ' : '') + after
  const newCursorPosition = before.length + mentionName.length + 1 + (addSpace ? 1 : 0)
  return { text: newText, cursorPosition: newCursorPosition }
}

export function getMentionSuggestions(text, cursorPosition, participants) {
  if (typeof text !== 'string') return []
  let atIndex = -1
  for (let i = cursorPosition - 1; i >= 0; i--) {
    if (text[i] === '@') {
      atIndex = i
      break
    }
    if (text[i] === ' ') return []
  }
  if (atIndex === -1) return []
  const query = text.slice(atIndex + 1, cursorPosition).toLowerCase()
  return participants.filter((p) =>
    p.name.toLowerCase().includes(query)
  )
}

export function calculateCanvasCellSize(containerWidth, containerHeight, cols, rows, gap = DEFAULT_GAP) {
  const availableWidth = Math.max(1, containerWidth - gap * (cols + 1))
  const availableHeight = Math.max(1, containerHeight - gap * (rows + 1))
  let cellWidth = Math.floor(availableWidth / cols)
  let cellHeight = Math.floor(availableHeight / rows)
  if (cellWidth < MIN_CELL_WIDTH) cellWidth = MIN_CELL_WIDTH
  if (cellHeight < MIN_CELL_HEIGHT) cellHeight = MIN_CELL_HEIGHT
  return { cellWidth, cellHeight, gap }
}

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '')
  if (h.length === 3) {
    const full = h.split('').map((c) => c + c).join('')
    return {
      r: parseInt(full.slice(0, 2), 16) || 99,
      g: parseInt(full.slice(2, 4), 16) || 102,
      b: parseInt(full.slice(4, 6), 16) || 241,
    }
  }
  return {
    r: parseInt(h.slice(0, 2), 16) || 99,
    g: parseInt(h.slice(2, 4), 16) || 102,
    b: parseInt(h.slice(4, 6), 16) || 241,
  }
}

function lightenColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  const nr = Math.round(r + (255 - r) * amount)
  const ng = Math.round(g + (255 - g) * amount)
  const nb = Math.round(b + (255 - b) * amount)
  return `rgb(${nr}, ${ng}, ${nb})`
}

function adjustColorAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawAnimatedBackground(ctx, w, h, frame, seed, baseColor) {
  const time = frame / 60
  ctx.fillStyle = lightenColor(baseColor, 0.6)
  ctx.fillRect(0, 0, w, h)

  const blobs = 4
  for (let i = 0; i < blobs; i++) {
    const phase = time * 0.4 + seed + i * 1.7
    const cx = w * (0.3 + 0.4 * Math.sin(phase * 0.6 + i))
    const cy = h * (0.3 + 0.4 * Math.cos(phase * 0.5 + i * 0.8))
    const radius = Math.min(w, h) * (0.18 + 0.08 * Math.sin(phase * 0.9 + i))
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    grad.addColorStop(0, adjustColorAlpha(baseColor, 0.35 + 0.1 * Math.sin(phase + i)))
    grad.addColorStop(1, adjustColorAlpha(baseColor, 0))
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = adjustColorAlpha(baseColor, 0.1)
  ctx.lineWidth = 1
  const lineOffset = (time * 20) % 40
  for (let y = -lineOffset; y < h; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
}

function drawAvatarCircle(ctx, w, h, color, initials) {
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.22

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 4

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.floor(r * 1.1)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials, cx, cy + 2)
}

function drawVideoOffState(ctx, w, h, color, initials) {
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.18

  ctx.fillStyle = '#374151'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#6b7280'
  ctx.lineWidth = Math.max(2, r * 0.08)
  const camCx = cx
  const camCy = cy - r * 0.1
  const camW = r * 1.1
  const camH = r * 0.85
  ctx.strokeRect(camCx - camW / 2, camCy - camH / 2, camW, camH)

  ctx.beginPath()
  ctx.moveTo(camCx + camW / 2, camCy - r * 0.2)
  ctx.lineTo(camCx + camW / 2 + r * 0.45, camCy - r * 0.4)
  ctx.lineTo(camCx + camW / 2 + r * 0.45, camCy + r * 0.15)
  ctx.lineTo(camCx + camW / 2, camCy + camH / 2)
  ctx.closePath()
  ctx.stroke()

  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = Math.max(3, r * 0.12)
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.6, cy + r * 0.5)
  ctx.lineTo(cx + r * 0.6, cy - r * 0.5)
  ctx.stroke()

  ctx.fillStyle = '#9ca3af'
  ctx.font = `bold ${Math.floor(r * 0.55)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${initials} 摄像头已关闭`, cx, cy + r * 1.0)
}

function drawScreenShareState(ctx, w, h, frame, seed) {
  const time = frame / 60
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, w, h)

  const titleBarH = Math.max(28, h * 0.07)
  ctx.fillStyle = '#2563eb'
  ctx.fillRect(0, 0, w, titleBarH)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.floor(titleBarH * 0.5)}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('项目进度报告 - Q3 Sprint Planning.pptx', titleBarH * 0.4, titleBarH / 2)

  const winBtns = [
    { x: w - titleBarH * 1.1, c: '#22c55e' },
    { x: w - titleBarH * 0.75, c: '#f59e0b' },
    { x: w - titleBarH * 0.4, c: '#ef4444' },
  ]
  winBtns.forEach((b) => {
    ctx.fillStyle = b.c
    ctx.beginPath()
    ctx.arc(b.x, titleBarH / 2, titleBarH * 0.18, 0, Math.PI * 2)
    ctx.fill()
  })

  const contentY = titleBarH + h * 0.05
  const contentH = h - contentY - h * 0.05
  const sideW = w * 0.22
  const mainX = sideW + w * 0.03
  const mainW = w - mainX - w * 0.03

  if (contentH > 40 && mainW > 40) {
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(w * 0.03, contentY, sideW, contentH)

    ctx.fillStyle = '#9ca3af'
    const fontSize = Math.max(9, Math.floor(Math.min(w, h) * 0.032))
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = 'left'
    const slideTitles = ['— 目标', '— 里程碑', '— 进度', '— 风险', '— 资源', '— 总结']
    for (let i = 0; i < 6; i++) {
      const y = contentY + (i + 1) * (contentH / 7)
      const active = i === Math.floor((time / 3 + seed) % 6)
      if (active) {
        ctx.fillStyle = '#bfdbfe'
        ctx.fillRect(w * 0.03 + 4, y - contentH / 18, sideW - 8, contentH / 9)
        ctx.fillStyle = '#1e40af'
      } else {
        ctx.fillStyle = '#6b7280'
      }
      const title = slideTitles[i] || `— 第${i + 1}页`
      ctx.fillText(`第 ${i + 1} 页 ${title}`, w * 0.05, y)
    }

    ctx.fillStyle = '#1f2937'
    ctx.font = `bold ${Math.max(12, Math.floor(Math.min(w, h) * 0.055))}px sans-serif`
    ctx.fillText('Q3 季度项目进度报告', mainX, contentY + contentH * 0.12)

    ctx.fillStyle = '#4b5563'
    ctx.font = `${Math.max(10, Math.floor(Math.min(w, h) * 0.035))}px sans-serif`
    ctx.fillText('Sprint 14-17 总结与下一阶段规划', mainX, contentY + contentH * 0.22)

    const barX = mainX
    const barY = contentY + contentH * 0.38
    const barW = mainW
    const barH = contentH * 0.1
    const labels = ['研发', '测试', '设计', '文档', '运维']
    const values = [0.85, 0.68, 0.92, 0.55, 0.78]
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6']
    const gapX = barW / labels.length

    if (barH > 5 && gapX > 10) {
      labels.forEach((label, i) => {
        const bx = barX + i * gapX + gapX * 0.12
        const bw = gapX * 0.76
        ctx.fillStyle = '#e5e7eb'
        ctx.fillRect(bx, barY, bw, barH)
        const wobble = 0.96 + 0.04 * Math.sin(time * 2 + i + seed)
        ctx.fillStyle = colors[i]
        ctx.fillRect(bx, barY, bw * values[i] * wobble, barH)
        ctx.fillStyle = '#374151'
        ctx.font = `${Math.max(8, Math.floor(Math.min(w, h) * 0.028))}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(label, bx + bw / 2, barY + barH + contentH * 0.05)
        ctx.fillText(`${Math.round(values[i] * 100 * wobble)}%`, bx + bw / 2, barY + barH + contentH * 0.11)
      })
    }

    const cardY = contentY + contentH * 0.72
    const cardW = mainW * 0.3
    const cardH = contentH * 0.22
    const cards = [
      { t: '已完成任务', v: '128', c: '#10b981' },
      { t: '进行中', v: '34', c: '#6366f1' },
      { t: '阻塞项', v: '5', c: '#ef4444' },
    ]
    if (cardW > 30 && cardH > 20) {
      cards.forEach((card, i) => {
        const cx = mainX + i * (cardW + mainW * 0.03)
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        roundRectPath(ctx, cx, cardY, cardW, cardH, 8)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = card.c
        ctx.font = `bold ${Math.max(12, Math.floor(cardH * 0.4))}px sans-serif`
        ctx.textAlign = 'left'
        ctx.fillText(card.v, cx + cardW * 0.08, cardY + cardH * 0.45)
        ctx.fillStyle = '#6b7280'
        ctx.font = `${Math.max(9, Math.floor(cardH * 0.22))}px sans-serif`
        ctx.fillText(card.t, cx + cardW * 0.08, cardY + cardH * 0.78)
      })
    }
  }

  ctx.fillStyle = 'rgba(37, 99, 235, 0.08)'
  ctx.fillRect(0, 0, w, titleBarH)
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
  ctx.lineTo(x + radius, y + h)
  ctx.arcTo(x, y + h, x, y + h - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

function drawMuteIndicator(ctx, w, h) {
  const size = Math.max(20, Math.min(w, h) * 0.08)
  const x = 10
  const y = 10
  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)'
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `${size * 0.6}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🔇', x + size / 2, y + size / 2)
}

function drawHandRaiseIndicator(ctx, w, h) {
  const size = Math.max(20, Math.min(w, h) * 0.08)
  const x = w - size - 14
  const y = 10
  ctx.fillStyle = 'rgba(245, 158, 11, 0.95)'
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.font = `${size * 0.65}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✋', x + size / 2, y + size / 2)
}

function drawNameLabel(ctx, w, h, name, isSelf) {
  const fontSize = Math.max(11, Math.floor(Math.min(w, h) * 0.045))
  const label = isSelf ? `${name} (你)` : name
  const paddingX = fontSize * 0.7
  const paddingY = fontSize * 0.35
  ctx.font = `${fontSize}px sans-serif`
  const textWidth = ctx.measureText(label).width
  const boxW = textWidth + paddingX * 2
  const boxH = fontSize + paddingY * 2
  const x = 10
  const y = h - boxH - 10

  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
  roundRectPath(ctx, x, y, boxW, boxH, 6)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + paddingX, y + boxH / 2)
}

function drawScreenShareLabel(ctx, w, h) {
  const fontSize = Math.max(10, Math.floor(Math.min(w, h) * 0.035))
  const label = '🖥️ 正在共享屏幕'
  const paddingX = fontSize * 0.7
  const paddingY = fontSize * 0.35
  ctx.font = `bold ${fontSize}px sans-serif`
  const textWidth = ctx.measureText(label).width
  const boxW = textWidth + paddingX * 2
  const boxH = fontSize + paddingY * 2
  const x = w - boxW - 10
  const y = 10

  ctx.fillStyle = 'rgba(5, 150, 105, 0.95)'
  roundRectPath(ctx, x, y, boxW, boxH, 6)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + paddingX, y + boxH / 2)
}

export function drawParticipantCanvas(ctx, width, height, participant, animFrame) {
  if (!ctx || width <= 0 || height <= 0) return

  const seed = participant?.id ? participant.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : Math.random() * 1000
  const avatarColor = participant?.avatarColor || '#6366f1'
  const initials = participant?.initials || getInitials(participant?.name) || '?'
  const isVideoOff = !!participant?.isVideoOff
  const isScreenSharing = !!participant?.isScreenSharing
  const isMuted = !!participant?.isMuted
  const isHandRaised = !!participant?.isHandRaised
  const isSelf = !!participant?.isSelf

  ctx.clearRect(0, 0, width, height)

  if (isScreenSharing) {
    drawScreenShareState(ctx, width, height, animFrame || 0, seed)
    drawScreenShareLabel(ctx, width, height)
  } else if (isVideoOff) {
    drawVideoOffState(ctx, width, height, avatarColor, initials)
  } else {
    drawAnimatedBackground(ctx, width, height, animFrame || 0, seed, avatarColor)
    drawAvatarCircle(ctx, width, height, avatarColor, initials)
  }

  if (isMuted && !isScreenSharing) {
    drawMuteIndicator(ctx, width, height)
  }
  if (isHandRaised) {
    drawHandRaiseIndicator(ctx, width, height)
  }
  drawNameLabel(ctx, width, height, participant?.name || '?', isSelf)
}
