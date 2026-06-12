import {
    ATTR_FREE_POINTS,
    ATTR_INITIAL,
    ATTR_MAX,
    ATTRIBUTES,
    HAIR_COLORS,
    INITIAL_SKILL_POINTS,
    LEVEL_PER_SKILL_POINT,
    MAX_SAVED_CHARACTERS,
    OUTFITS,
    SKILL_TREES,
    SKIN_TONES,
    STORAGE_KEY,
} from './constants'

export function generateId() {
  const timestamp36 = Date.now().toString(36)
  const random6 = Math.random().toString(36).slice(2, 8)
  return 'rpg_' + timestamp36 + random6
}

export function createDefaultCharacter() {
  return {
    id: generateId(),
    name: '',
    description: '',
    gender: 'male',
    level: 1,
    appearance: {
      hairStyle: 0,
      hairColor: 0,
      skinTone: 0,
      eyeStyle: 0,
      outfit: 'civilian',
    },
    attributes: {
      strength: 5,
      agility: 5,
      intelligence: 5,
      stamina: 5,
      spirit: 5,
      charisma: 5,
    },
    unlockedSkills: [],
    skillPoints: INITIAL_SKILL_POINTS,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function validateName(name) {
  if (!name || name.trim() === '') {
    return '角色名不能为空'
  }
  const trimmed = name.trim()
  if (trimmed.length < 2 || trimmed.length > 20) {
    return '角色名长度需在2-20字符之间'
  }
  return null
}

export function calculateUsedPoints(attrs) {
  const sum = Object.values(attrs).reduce((acc, val) => acc + val, 0)
  return sum - 6 * ATTR_INITIAL
}

export function calculateFreePoints(attrs) {
  return ATTR_FREE_POINTS - calculateUsedPoints(attrs)
}

export function incrementAttribute(attrs, attrKey) {
  if (calculateFreePoints(attrs) <= 0) {
    return { success: false, attributes: attrs, error: '没有可用的属性点' }
  }
  if (attrs[attrKey] >= ATTR_MAX) {
    return { success: false, attributes: attrs, error: '该属性已达最大值' }
  }
  return {
    success: true,
    attributes: { ...attrs, [attrKey]: attrs[attrKey] + 1 },
    error: null,
  }
}

export function decrementAttribute(attrs, attrKey) {
  if (attrs[attrKey] <= ATTR_INITIAL) {
    return { success: false, attributes: attrs, error: '该属性不能低于初始值' }
  }
  return {
    success: true,
    attributes: { ...attrs, [attrKey]: attrs[attrKey] - 1 },
    error: null,
  }
}

export function calculateDerivedStats(attrs) {
  return {
    hp: attrs.stamina * 20,
    physicalAttack: attrs.strength * 3,
    magicalAttack: attrs.intelligence * 3,
    magicalDefense: attrs.spirit * 2,
    critRate: attrs.agility * 0.5,
    dodgeRate: attrs.agility * 0.3,
    socialBonus: attrs.charisma * 2,
  }
}

export function formatPercent(value) {
  return value + '%'
}

export function getSkillTree(outfitKey) {
  return SKILL_TREES[outfitKey] || []
}

export function canUnlockSkill(skill, attrs, unlockedSkills, skillPoints) {
  if (skillPoints <= 0) {
    return { canUnlock: false, reason: '技能点不足' }
  }
  if (unlockedSkills.includes(skill.id)) {
    return { canUnlock: false, reason: '该技能已解锁' }
  }

  if (skill.prereq && !unlockedSkills.includes(skill.prereq)) {
    return { canUnlock: false, reason: '前置技能未解锁' }
  }

  if (skill.attrReq) {
    for (const [attrKey, requiredValue] of Object.entries(skill.attrReq)) {
      if (attrs[attrKey] === undefined || attrs[attrKey] < requiredValue) {
        const attrName = attrKey
        return { canUnlock: false, reason: `属性 ${attrName} 未达到要求 (需要 ${requiredValue})` }
      }
    }
  }

  return { canUnlock: true, reason: '' }
}

export function unlockSkill(skill, attrs, unlockedSkills, skillPoints) {
  const check = canUnlockSkill(skill, attrs, unlockedSkills, skillPoints)
  if (!check.canUnlock) {
    return {
      success: false,
      unlockedSkills: unlockedSkills,
      skillPoints: skillPoints,
      error: check.reason,
    }
  }
  return {
    success: true,
    unlockedSkills: [...unlockedSkills, skill.id],
    skillPoints: skillPoints - 1,
    error: null,
  }
}

export function calculateTotalSkillPoints(level) {
  return INITIAL_SKILL_POINTS + Math.floor((level - 1) / LEVEL_PER_SKILL_POINT)
}

export function recalcSkillPoints(level, unlockedSkills) {
  return calculateTotalSkillPoints(level) - unlockedSkills.length
}

export function loadCharacters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCharacters(characters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
    return true
  } catch {
    return false
  }
}

export function saveCharacter(characters, character) {
  const now = Date.now()
  const updatedChar = { ...character, updatedAt: now }
  if (!updatedChar.createdAt) {
    updatedChar.createdAt = now
  }

  const existingIndex = characters.findIndex(c => c.id === updatedChar.id)

  if (existingIndex >= 0) {
    const newCharacters = [...characters]
    newCharacters[existingIndex] = updatedChar
    saveCharacters(newCharacters)
    return {
      success: true,
      characters: newCharacters,
      character: updatedChar,
      error: null,
    }
  }

  if (characters.length >= MAX_SAVED_CHARACTERS) {
    return {
      success: false,
      characters: characters,
      character: character,
      error: `已达到最大角色数量限制 (${MAX_SAVED_CHARACTERS})`,
    }
  }

  if (!updatedChar.id) {
    updatedChar.id = generateId()
  }

  const newCharacters = [...characters, updatedChar]
  saveCharacters(newCharacters)
  return {
    success: true,
    characters: newCharacters,
    character: updatedChar,
    error: null,
  }
}

export function deleteCharacter(characters, id) {
  const newCharacters = characters.filter(c => c.id !== id)
  saveCharacters(newCharacters)
  return {
    success: true,
    characters: newCharacters,
  }
}

export function getCharacter(characters, id) {
  return characters.find(c => c.id === id) || null
}

export function formatDateTime(ts) {
  const date = new Date(ts)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function getAttributeSummary(attrs) {
  const names = {
    strength: '力',
    agility: '敏',
    intelligence: '智',
    stamina: '体',
    spirit: '精',
    charisma: '魅',
  }
  const parts = []
  for (const [key, label] of Object.entries(names)) {
    if (attrs[key] !== undefined) {
      parts.push(`${label}${attrs[key]}`)
    }
  }
  return parts.join(' ')
}

export function getOutfitName(key) {
  const outfit = OUTFITS.find(o => o.key === key)
  return outfit ? outfit.name : key
}

function deepEqual(obj1, obj2, ignoreKeys = []) {
  if (obj1 === obj2) return true
  if (obj1 === null || obj2 === null) return false
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false

  const keys1 = Object.keys(obj1).filter(k => !ignoreKeys.includes(k))
  const keys2 = Object.keys(obj2).filter(k => !ignoreKeys.includes(k))

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    if (!deepEqual(obj1[key], obj2[key], ignoreKeys)) return false
  }

  return true
}

export function charactersEqual(c1, c2) {
  const ignoreKeys = ['updatedAt', 'createdAt']
  return deepEqual(c1, c2, ignoreKeys)
}

export const PREVIEW_W = 200
export const PREVIEW_H = 280

export function drawCharacter(ctx, appearance) {
  const { hairStyle, hairColor, skinTone, eyeStyle, outfit } = appearance
  const skinColor = SKIN_TONES[skinTone]?.color || '#fce4c7'
  const hColor = HAIR_COLORS[hairColor]?.color || '#1a1a1a'
  const outfitData = OUTFITS.find(o => o.key === outfit) || OUTFITS[5]
  const W = PREVIEW_W
  const H = PREVIEW_H

  ctx.clearRect(0, 0, W, H)

  const cx = W / 2
  const headY = 70
  const headR = 30
  const bodyTop = headY + headR + 5
  const bodyW = 44
  const bodyH = 60

  ctx.fillStyle = outfitData.primaryColor
  ctx.fillRect(cx - bodyW / 2 - 12, bodyTop + bodyH + 2, 10, 40)
  ctx.fillRect(cx + bodyW / 2 + 2, bodyTop + bodyH + 2, 10, 40)

  ctx.fillStyle = outfitData.primaryColor
  ctx.fillRect(cx - bodyW / 2, bodyTop, bodyW, bodyH)

  ctx.fillStyle = outfitData.secondaryColor
  ctx.fillRect(cx - bodyW / 2, bodyTop, bodyW, 12)

  if (outfit === 'warrior') {
    ctx.fillStyle = outfitData.accent
    ctx.fillRect(cx - bodyW / 2, bodyTop + 14, bodyW, 3)
    ctx.fillStyle = '#888'
    ctx.fillRect(cx + bodyW / 2 + 2, bodyTop + 10, 6, bodyH + 20)
  } else if (outfit === 'mage') {
    ctx.fillStyle = outfitData.accent
    ctx.beginPath()
    ctx.moveTo(cx - 6, bodyTop + 12)
    ctx.lineTo(cx, bodyTop + 24)
    ctx.lineTo(cx + 6, bodyTop + 12)
    ctx.fill()
  } else if (outfit === 'hunter') {
    ctx.fillStyle = outfitData.accent
    ctx.fillRect(cx - bodyW / 2 + 4, bodyTop + 16, bodyW - 8, 3)
  } else if (outfit === 'rogue') {
    ctx.fillStyle = outfitData.accent
    ctx.fillRect(cx - 2, bodyTop, 4, bodyH)
  } else if (outfit === 'monk') {
    ctx.fillStyle = outfitData.accent
    ctx.beginPath()
    ctx.arc(cx, bodyTop + 8, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = outfitData.primaryColor
  ctx.fillRect(cx - bodyW / 2 - 14, bodyTop + 8, 12, 40)
  ctx.fillRect(cx + bodyW / 2 + 2, bodyTop + 8, 12, 40)

  ctx.fillStyle = skinColor
  ctx.fillRect(cx - bodyW / 2 - 16, bodyTop + 4, 16, 12)
  ctx.fillRect(cx + bodyW / 2, bodyTop + 4, 16, 12)

  ctx.fillStyle = skinColor
  ctx.beginPath()
  ctx.arc(cx, headY, headR, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, headY, headR, 0, Math.PI * 2)
  ctx.stroke()

  if (hairStyle !== 4) {
    ctx.fillStyle = hColor
    switch (hairStyle) {
      case 0:
        ctx.beginPath()
        ctx.arc(cx, headY - 8, headR + 2, Math.PI, 0)
        ctx.fill()
        break
      case 1:
        ctx.beginPath()
        ctx.arc(cx, headY - 6, headR + 4, Math.PI * 0.85, Math.PI * 0.15, true)
        ctx.lineTo(cx + headR + 4, headY + headR + 20)
        ctx.lineTo(cx - headR - 4, headY + headR + 20)
        ctx.closePath()
        ctx.fill()
        break
      case 2:
        for (let i = 0; i < 7; i++) {
          const angle = Math.PI + (Math.PI * i / 6)
          const bx = cx + Math.cos(angle) * (headR + 10)
          const by = headY - 6 + Math.sin(angle) * (headR + 10)
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(angle) * headR, headY + Math.sin(angle) * headR)
          ctx.lineTo(bx - 4, by)
          ctx.lineTo(bx + 4, by)
          ctx.closePath()
          ctx.fill()
        }
        break
      case 3:
        ctx.beginPath()
        ctx.arc(cx, headY - 6, headR + 4, Math.PI * 0.9, Math.PI * 0.1, true)
        ctx.fill()
        ctx.fillRect(cx + headR + 2, headY - 4, 8, headR + 40)
        ctx.beginPath()
        ctx.arc(cx + headR + 6, headY + headR + 36, 6, 0, Math.PI * 2)
        ctx.fill()
        break
      default:
        break
    }
  }

  const eyeY = headY - 2
  const eyeSpacing = 10
  ctx.fillStyle = '#fff'
  switch (eyeStyle) {
    case 0:
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing, eyeY, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeSpacing, eyeY, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing, eyeY, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeSpacing, eyeY, 2.5, 0, Math.PI * 2)
      ctx.fill()
      break
    case 1:
      ctx.fillRect(cx - eyeSpacing - 6, eyeY - 2, 12, 3)
      ctx.fillRect(cx + eyeSpacing - 6, eyeY - 2, 12, 3)
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing, eyeY, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeSpacing, eyeY, 2, 0, Math.PI * 2)
      ctx.fill()
      break
    case 2:
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing, eyeY, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeSpacing, eyeY, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing, eyeY, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeSpacing, eyeY, 3.5, 0, Math.PI * 2)
      ctx.fill()
      break
    case 3:
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing, eyeY, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeSpacing, eyeY, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing - 1, eyeY, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeSpacing - 1, eyeY, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - eyeSpacing - 7, eyeY - 6)
      ctx.lineTo(cx - eyeSpacing + 5, eyeY - 3)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + eyeSpacing + 7, eyeY - 6)
      ctx.lineTo(cx + eyeSpacing - 5, eyeY - 3)
      ctx.stroke()
      break
    default:
      break
  }

  ctx.fillStyle = skinColor
  ctx.beginPath()
  ctx.arc(cx, eyeY + 12, 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#a0522d'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, eyeY + 18, 6, 0.1 * Math.PI, 0.9 * Math.PI)
  ctx.stroke()
}

const CARD_W = 440
const CARD_H = 600
const RADAR_CX = 220
const RADAR_CY = 380
const RADAR_R = 80

const RADAR_ATTRS = ATTRIBUTES.map(a => a.key)
const RADAR_LABELS = ATTRIBUTES.map(a => a.label)

function drawRadarChart(ctx, attrs) {
  const sides = 6
  const angleStep = (2 * Math.PI) / sides
  const startAngle = -Math.PI / 2
  const maxVal = 20

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  for (let ring = 1; ring <= 4; ring++) {
    const r = (RADAR_R * ring) / 4
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep
      const x = RADAR_CX + r * Math.cos(angle)
      const y = RADAR_CY + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep
    ctx.beginPath()
    ctx.moveTo(RADAR_CX, RADAR_CY)
    ctx.lineTo(
      RADAR_CX + RADAR_R * Math.cos(angle),
      RADAR_CY + RADAR_R * Math.sin(angle)
    )
    ctx.stroke()
  }

  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep
    const val = attrs[RADAR_ATTRS[i]] || 0
    const r = (val / maxVal) * RADAR_R
    const x = RADAR_CX + r * Math.cos(angle)
    const y = RADAR_CY + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep
    const val = attrs[RADAR_ATTRS[i]] || 0
    const r = (val / maxVal) * RADAR_R
    const x = RADAR_CX + r * Math.cos(angle)
    const y = RADAR_CY + r * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#ffd700'
    ctx.fill()
  }

  ctx.fillStyle = '#e0e0e0'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep
    const lx = RADAR_CX + (RADAR_R + 16) * Math.cos(angle)
    const ly = RADAR_CY + (RADAR_R + 16) * Math.sin(angle)
    ctx.fillText(`${RADAR_LABELS[i]} ${attrs[RADAR_ATTRS[i]]}`, lx, ly)
  }
}

export function drawCardCanvas(ctx, character, createCanvas) {
  const outfitData = OUTFITS.find(o => o.key === character.appearance.outfit) || OUTFITS[5]
  const bgColor = outfitData.primaryColor
  const borderColor = outfitData.accent
  const secondaryColor = outfitData.secondaryColor

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  ctx.strokeStyle = borderColor
  ctx.lineWidth = 4
  ctx.strokeRect(6, 6, CARD_W - 12, CARD_H - 12)

  ctx.strokeStyle = secondaryColor
  ctx.lineWidth = 1
  ctx.strokeRect(12, 12, CARD_W - 24, CARD_H - 24)

  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(character.name || '未命名角色', CARD_W / 2, 44)

  ctx.fillStyle = '#ccc'
  ctx.font = '12px sans-serif'
  const genderLabel = character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '其他'
  ctx.fillText(
    `${getOutfitName(character.appearance.outfit)} · ${genderLabel} · Lv.${character.level}`,
    CARD_W / 2, 64
  )

  const makeCanvas = createCanvas || (() => document.createElement('canvas'))
  const miniCanvas = makeCanvas(200, 280)
  const miniCtx = miniCanvas.getContext('2d')
  drawCharacter(miniCtx, character.appearance)

  const scale = 0.55
  const drawW = 200 * scale
  const drawH = 280 * scale
  ctx.drawImage(miniCanvas, (CARD_W - drawW) / 2, 76, drawW, drawH)

  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('— 六维属性 —', CARD_W / 2, 280)

  drawRadarChart(ctx, character.attributes)

  const skills = SKILL_TREES[character.appearance.outfit] || []
  const unlockedNames = skills
    .filter(s => character.unlockedSkills.includes(s.id))
    .map(s => `${s.icon}${s.name}`)

  if (unlockedNames.length > 0) {
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('— 已解锁技能 —', CARD_W / 2, 480)

    ctx.fillStyle = '#ccc'
    ctx.font = '11px sans-serif'
    const skillText = unlockedNames.join('  ')
    ctx.fillText(skillText, CARD_W / 2, 498)
  }

  ctx.fillStyle = '#666'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`创建于 ${formatDateTime(character.createdAt)}`, CARD_W / 2, CARD_H - 24)
}

export function getCardData(character) {
  const outfitData = OUTFITS.find(o => o.key === character.appearance.outfit) || OUTFITS[5]
  const genderLabel = character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '其他'
  const skills = SKILL_TREES[character.appearance.outfit] || []
  const unlockedNames = skills
    .filter(s => character.unlockedSkills.includes(s.id))
    .map(s => `${s.icon}${s.name}`)
  return {
    bgColor: outfitData.primaryColor,
    borderColor: outfitData.accent,
    secondaryColor: outfitData.secondaryColor,
    name: character.name || '未命名角色',
    subtitle: `${getOutfitName(character.appearance.outfit)} · ${genderLabel} · Lv.${character.level}`,
    unlockedSkills: unlockedNames,
    createdAt: formatDateTime(character.createdAt),
  }
}
