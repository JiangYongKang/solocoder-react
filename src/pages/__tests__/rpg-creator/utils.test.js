import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  STORAGE_KEY,
  MAX_SAVED_CHARACTERS,
  ATTR_INITIAL,
  ATTR_MAX,
  ATTR_FREE_POINTS,
  INITIAL_SKILL_POINTS,
  LEVEL_PER_SKILL_POINT,
  ATTRIBUTES,
  HAIR_STYLES,
  HAIR_COLORS,
  SKIN_TONES,
  EYE_STYLES,
  OUTFITS,
  GENDERS,
  SKILL_TREES,
} from '../../rpg-creator/constants'
import {
  generateId,
  createDefaultCharacter,
  validateName,
  calculateUsedPoints,
  calculateFreePoints,
  incrementAttribute,
  decrementAttribute,
  calculateDerivedStats,
  formatPercent,
  getSkillTree,
  canUnlockSkill,
  unlockSkill,
  calculateTotalSkillPoints,
  recalcSkillPoints,
  loadCharacters,
  saveCharacters,
  saveCharacter,
  deleteCharacter,
  getCharacter,
  formatDateTime,
  getAttributeSummary,
  getOutfitName,
  charactersEqual,
  getCardData,
  drawCardCanvas,
  PREVIEW_W,
  PREVIEW_H,
} from '../../rpg-creator/utils'

const createMockLocalStorage = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

let originalLocalStorage

beforeAll(() => {
  originalLocalStorage = globalThis.localStorage
  globalThis.localStorage = createMockLocalStorage()
})

afterAll(() => {
  globalThis.localStorage = originalLocalStorage
})

describe('generateId', () => {
  it('生成的ID以 rpg_ 开头', () => {
    expect(generateId()).toMatch(/^rpg_/)
  })

  it('生成的ID不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('createDefaultCharacter', () => {
  it('创建的角色包含所有必要字段', () => {
    const c = createDefaultCharacter()
    expect(c.id).toMatch(/^rpg_/)
    expect(c.name).toBe('')
    expect(c.description).toBe('')
    expect(c.gender).toBe('male')
    expect(c.level).toBe(1)
    expect(c.appearance).toBeDefined()
    expect(c.appearance.hairStyle).toBe(0)
    expect(c.appearance.hairColor).toBe(0)
    expect(c.appearance.skinTone).toBe(0)
    expect(c.appearance.eyeStyle).toBe(0)
    expect(c.appearance.outfit).toBe('civilian')
    expect(c.attributes).toBeDefined()
    expect(c.unlockedSkills).toEqual([])
    expect(c.skillPoints).toBe(INITIAL_SKILL_POINTS)
    expect(c.createdAt).toBeGreaterThan(0)
    expect(c.updatedAt).toBeGreaterThan(0)
  })

  it('所有属性初始值等于 ATTR_INITIAL', () => {
    const c = createDefaultCharacter()
    for (const attr of ATTRIBUTES) {
      expect(c.attributes[attr.key]).toBe(ATTR_INITIAL)
    }
  })
})

describe('validateName', () => {
  it('空名称返回错误', () => {
    expect(validateName('')).toBeTruthy()
    expect(validateName(' ')).toBeTruthy()
    expect(validateName(null)).toBeTruthy()
    expect(validateName(undefined)).toBeTruthy()
  })

  it('少于2字符返回错误', () => {
    expect(validateName('A')).toBeTruthy()
  })

  it('超过20字符返回错误', () => {
    expect(validateName('A'.repeat(21))).toBeTruthy()
  })

  it('2-20字符返回null', () => {
    expect(validateName('AB')).toBeNull()
    expect(validateName('A'.repeat(20))).toBeNull()
    expect(validateName('角色名测试')).toBeNull()
  })

  it('名称前后空格不影响验证', () => {
    expect(validateName('  AB  ')).toBeNull()
    expect(validateName(' A ')).toBeTruthy()
  })
})

describe('calculateUsedPoints', () => {
  it('初始属性下已用点数为0', () => {
    const c = createDefaultCharacter()
    expect(calculateUsedPoints(c.attributes)).toBe(0)
  })

  it('增加属性后计算正确的已用点数', () => {
    const attrs = { strength: 10, agility: 5, intelligence: 5, stamina: 5, spirit: 5, charisma: 5 }
    expect(calculateUsedPoints(attrs)).toBe(5)
  })

  it('多项属性分配后计算正确', () => {
    const attrs = { strength: 10, agility: 8, intelligence: 12, stamina: 5, spirit: 5, charisma: 5 }
    expect(calculateUsedPoints(attrs)).toBe(5 + 3 + 7)
  })
})

describe('calculateFreePoints', () => {
  it('初始属性下剩余点数等于 ATTR_FREE_POINTS', () => {
    const c = createDefaultCharacter()
    expect(calculateFreePoints(c.attributes)).toBe(ATTR_FREE_POINTS)
  })

  it('分配点数后正确计算剩余', () => {
    const attrs = { strength: 10, agility: 5, intelligence: 5, stamina: 5, spirit: 5, charisma: 5 }
    expect(calculateFreePoints(attrs)).toBe(ATTR_FREE_POINTS - 5)
  })

  it('全部分配完毕后剩余0', () => {
    const attrs = { strength: 10, agility: 10, intelligence: 10, stamina: 10, spirit: 10, charisma: 10 }
    expect(calculateFreePoints(attrs)).toBe(0)
  })
})

describe('incrementAttribute', () => {
  it('正常增加属性', () => {
    const attrs = createDefaultCharacter().attributes
    const result = incrementAttribute(attrs, 'strength')
    expect(result.success).toBe(true)
    expect(result.attributes.strength).toBe(ATTR_INITIAL + 1)
  })

  it('剩余点数为0时不能增加', () => {
    const attrs = { strength: 10, agility: 10, intelligence: 10, stamina: 10, spirit: 10, charisma: 10 }
    const result = incrementAttribute(attrs, 'strength')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('属性达到最大值时不能增加', () => {
    const attrs = { strength: ATTR_MAX, agility: 5, intelligence: 5, stamina: 5, spirit: 5, charisma: 5 }
    const result = incrementAttribute(attrs, 'strength')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('不修改其他属性', () => {
    const attrs = createDefaultCharacter().attributes
    const result = incrementAttribute(attrs, 'strength')
    expect(result.attributes.agility).toBe(ATTR_INITIAL)
    expect(result.attributes.intelligence).toBe(ATTR_INITIAL)
  })
})

describe('decrementAttribute', () => {
  it('正常减少属性', () => {
    const attrs = { strength: 10, agility: 5, intelligence: 5, stamina: 5, spirit: 5, charisma: 5 }
    const result = decrementAttribute(attrs, 'strength')
    expect(result.success).toBe(true)
    expect(result.attributes.strength).toBe(9)
  })

  it('属性等于初始值时不能减少', () => {
    const attrs = createDefaultCharacter().attributes
    const result = decrementAttribute(attrs, 'strength')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('不修改其他属性', () => {
    const attrs = { strength: 10, agility: 5, intelligence: 5, stamina: 5, spirit: 5, charisma: 5 }
    const result = decrementAttribute(attrs, 'strength')
    expect(result.attributes.agility).toBe(5)
    expect(result.attributes.intelligence).toBe(5)
  })
})

describe('calculateDerivedStats', () => {
  it('初始属性下计算正确的衍生数值', () => {
    const attrs = createDefaultCharacter().attributes
    const derived = calculateDerivedStats(attrs)
    expect(derived.hp).toBe(5 * 20)
    expect(derived.physicalAttack).toBe(5 * 3)
    expect(derived.magicalAttack).toBe(5 * 3)
    expect(derived.magicalDefense).toBe(5 * 2)
    expect(derived.critRate).toBe(2.5)
    expect(derived.dodgeRate).toBe(1.5)
    expect(derived.socialBonus).toBe(5 * 2)
  })

  it('高属性下计算正确', () => {
    const attrs = { strength: 20, agility: 20, intelligence: 20, stamina: 20, spirit: 20, charisma: 20 }
    const derived = calculateDerivedStats(attrs)
    expect(derived.hp).toBe(400)
    expect(derived.physicalAttack).toBe(60)
    expect(derived.magicalAttack).toBe(60)
    expect(derived.magicalDefense).toBe(40)
    expect(derived.critRate).toBe(10)
    expect(derived.dodgeRate).toBe(6)
    expect(derived.socialBonus).toBe(40)
  })

  it('所有字段返回数字类型', () => {
    const attrs = createDefaultCharacter().attributes
    const derived = calculateDerivedStats(attrs)
    for (const val of Object.values(derived)) {
      expect(typeof val).toBe('number')
    }
  })

  it('衍生数值可用于进一步数学计算而不产生NaN', () => {
    const attrs = createDefaultCharacter().attributes
    const derived = calculateDerivedStats(attrs)
    expect(derived.hp + derived.physicalAttack).toBe(100 + 15)
    expect(derived.critRate * 2).toBe(5)
    expect(derived.dodgeRate + 1).toBe(2.5)
  })
})

describe('formatPercent', () => {
  it('格式化整数百分比值', () => {
    expect(formatPercent(10)).toBe('10%')
  })

  it('格式化小数百分比值', () => {
    expect(formatPercent(2.5)).toBe('2.5%')
    expect(formatPercent(0.5)).toBe('0.5%')
  })

  it('格式化零值', () => {
    expect(formatPercent(0)).toBe('0%')
  })

  it('格式化负值', () => {
    expect(formatPercent(-1)).toBe('-1%')
  })
})

describe('getSkillTree', () => {
  it('战士技能树返回正确的技能列表', () => {
    const tree = getSkillTree('warrior')
    expect(tree.length).toBeGreaterThanOrEqual(15)
  })

  it('无效职业返回空数组', () => {
    expect(getSkillTree('invalid')).toEqual([])
  })

  it('每个职业的技能树至少包含15个技能', () => {
    for (const outfit of OUTFITS) {
      const tree = getSkillTree(outfit.key)
      expect(tree.length).toBeGreaterThanOrEqual(15)
    }
  })
})

describe('canUnlockSkill', () => {
  const warriorSkills = SKILL_TREES.warrior

  it('技能点不足时不能解锁', () => {
    const skill = warriorSkills[0]
    const attrs = createDefaultCharacter().attributes
    const result = canUnlockSkill(skill, attrs, [], 0)
    expect(result.canUnlock).toBe(false)
    expect(result.reason).toContain('技能点不足')
  })

  it('已解锁的技能不能再解锁', () => {
    const skill = warriorSkills[0]
    const attrs = { ...createDefaultCharacter().attributes, strength: 20, stamina: 20 }
    const result = canUnlockSkill(skill, attrs, [skill.id], 5)
    expect(result.canUnlock).toBe(false)
    expect(result.reason).toContain('已解锁')
  })

  it('前置技能未解锁时不能解锁进阶技能', () => {
    const layer2Skill = warriorSkills.find(s => s.layer === 2)
    const attrs = { ...createDefaultCharacter().attributes, strength: 20, stamina: 20 }
    const result = canUnlockSkill(layer2Skill, attrs, [], 5)
    expect(result.canUnlock).toBe(false)
    expect(result.reason).toContain('前置技能')
  })

  it('属性未达到要求时不能解锁', () => {
    const skill = warriorSkills[0]
    const attrs = createDefaultCharacter().attributes
    const result = canUnlockSkill(skill, attrs, [], 3)
    if (skill.attrReq) {
      expect(result.canUnlock).toBe(false)
    }
  })

  it('满足所有条件时可以解锁', () => {
    const skill = warriorSkills[0]
    const attrs = { strength: 20, agility: 5, intelligence: 5, stamina: 20, spirit: 5, charisma: 5 }
    const result = canUnlockSkill(skill, attrs, [], 3)
    expect(result.canUnlock).toBe(true)
  })
})

describe('unlockSkill', () => {
  it('成功解锁技能', () => {
    const skill = SKILL_TREES.warrior[0]
    const attrs = { strength: 20, agility: 5, intelligence: 5, stamina: 20, spirit: 5, charisma: 5 }
    const result = unlockSkill(skill, attrs, [], 3)
    expect(result.success).toBe(true)
    expect(result.unlockedSkills).toContain(skill.id)
    expect(result.skillPoints).toBe(2)
  })

  it('条件不满足时解锁失败', () => {
    const skill = SKILL_TREES.warrior[0]
    const attrs = createDefaultCharacter().attributes
    const result = unlockSkill(skill, attrs, [], 0)
    expect(result.success).toBe(false)
    expect(result.unlockedSkills).toEqual([])
    expect(result.skillPoints).toBe(0)
  })
})

describe('calculateTotalSkillPoints', () => {
  it('1级时只有初始技能点', () => {
    expect(calculateTotalSkillPoints(1)).toBe(INITIAL_SKILL_POINTS)
  })

  it('5级时获得1个额外技能点', () => {
    expect(calculateTotalSkillPoints(5)).toBe(INITIAL_SKILL_POINTS + Math.floor(4 / LEVEL_PER_SKILL_POINT))
  })

  it('10级时获得2个额外技能点', () => {
    expect(calculateTotalSkillPoints(10)).toBe(INITIAL_SKILL_POINTS + Math.floor(9 / LEVEL_PER_SKILL_POINT))
  })

  it('20级时正确计算', () => {
    expect(calculateTotalSkillPoints(20)).toBe(INITIAL_SKILL_POINTS + Math.floor(19 / LEVEL_PER_SKILL_POINT))
  })
})

describe('recalcSkillPoints', () => {
  it('根据等级和已解锁技能计算剩余技能点', () => {
    expect(recalcSkillPoints(1, [])).toBe(INITIAL_SKILL_POINTS)
    expect(recalcSkillPoints(1, ['w1'])).toBe(INITIAL_SKILL_POINTS - 1)
  })
})

describe('localStorage operations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadCharacters', () => {
    it('空localStorage返回空数组', () => {
      expect(loadCharacters()).toEqual([])
    })

    it('数据损坏返回空数组', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')
      expect(loadCharacters()).toEqual([])
    })

    it('非数组数据返回空数组', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'array' }))
      expect(loadCharacters()).toEqual([])
    })

    it('正常加载数据', () => {
      const chars = [{ id: '1', name: 'Test' }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chars))
      expect(loadCharacters()).toEqual(chars)
    })
  })

  describe('saveCharacters', () => {
    it('保存数据到localStorage', () => {
      const chars = [{ id: '1', name: 'Test' }]
      expect(saveCharacters(chars)).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(chars))
    })
  })

  describe('saveCharacter', () => {
    it('新角色保存成功', () => {
      const char = createDefaultCharacter()
      char.name = '测试角色'
      const result = saveCharacter([], char)
      expect(result.success).toBe(true)
      expect(result.characters.length).toBe(1)
      expect(result.character.name).toBe('测试角色')
    })

    it('更新已存在的角色', () => {
      const char = createDefaultCharacter()
      char.name = '原名称'
      const saveResult = saveCharacter([], char)
      const saved = saveResult.characters[0]
      saved.name = '新名称'
      const updateResult = saveCharacter(saveResult.characters, saved)
      expect(updateResult.success).toBe(true)
      expect(updateResult.characters.length).toBe(1)
      expect(updateResult.characters[0].name).toBe('新名称')
    })

    it('达到最大数量限制时保存失败', () => {
      const chars = []
      for (let i = 0; i < MAX_SAVED_CHARACTERS; i++) {
        const c = createDefaultCharacter()
        c.name = `角色${i}`
        c.id = `test_${i}`
        chars.push(c)
      }
      const newChar = createDefaultCharacter()
      newChar.name = '溢出角色'
      const result = saveCharacter(chars, newChar)
      expect(result.success).toBe(false)
      expect(result.error).toContain(String(MAX_SAVED_CHARACTERS))
    })
  })

  describe('deleteCharacter', () => {
    it('成功删除角色', () => {
      const chars = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
      const result = deleteCharacter(chars, '1')
      expect(result.success).toBe(true)
      expect(result.characters.length).toBe(1)
      expect(result.characters[0].id).toBe('2')
    })

    it('删除不存在的角色不影响列表', () => {
      const chars = [{ id: '1', name: 'A' }]
      const result = deleteCharacter(chars, '999')
      expect(result.characters.length).toBe(1)
    })
  })

  describe('getCharacter', () => {
    it('找到角色返回角色数据', () => {
      const chars = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
      expect(getCharacter(chars, '2')).toEqual({ id: '2', name: 'B' })
    })

    it('找不到角色返回null', () => {
      const chars = [{ id: '1', name: 'A' }]
      expect(getCharacter(chars, '999')).toBeNull()
    })
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳为 YYYY-MM-DD HH:mm', () => {
    const date = new Date(2025, 0, 15, 8, 30)
    const result = formatDateTime(date.getTime())
    expect(result).toBe('2025-01-15 08:30')
  })

  it('正确处理月份和日期前导零', () => {
    const date = new Date(2025, 5, 5, 9, 5)
    const result = formatDateTime(date.getTime())
    expect(result).toBe('2025-06-05 09:05')
  })
})

describe('getAttributeSummary', () => {
  it('生成属性摘要字符串', () => {
    const attrs = { strength: 10, agility: 8, intelligence: 12, stamina: 5, spirit: 7, charisma: 3 }
    const summary = getAttributeSummary(attrs)
    expect(summary).toContain('力10')
    expect(summary).toContain('敏8')
    expect(summary).toContain('智12')
    expect(summary).toContain('体5')
    expect(summary).toContain('精7')
    expect(summary).toContain('魅3')
  })
})

describe('getOutfitName', () => {
  it('根据key获取职业名称', () => {
    expect(getOutfitName('warrior')).toBe('战士')
    expect(getOutfitName('mage')).toBe('法师')
    expect(getOutfitName('hunter')).toBe('猎人')
    expect(getOutfitName('rogue')).toBe('盗贼')
    expect(getOutfitName('monk')).toBe('僧侣')
    expect(getOutfitName('civilian')).toBe('平民')
  })

  it('未知职业返回key本身', () => {
    expect(getOutfitName('unknown')).toBe('unknown')
  })
})

describe('charactersEqual', () => {
  it('相同角色返回true', () => {
    const c = createDefaultCharacter()
    c.name = '测试'
    expect(charactersEqual(c, { ...c })).toBe(true)
  })

  it('不同角色返回false', () => {
    const c1 = createDefaultCharacter()
    c1.name = '角色1'
    const c2 = createDefaultCharacter()
    c2.name = '角色2'
    expect(charactersEqual(c1, c2)).toBe(false)
  })

  it('忽略 updatedAt 和 createdAt 字段', () => {
    const c1 = createDefaultCharacter()
    const c2 = { ...c1, updatedAt: c1.updatedAt + 1000, createdAt: c1.createdAt + 1000 }
    expect(charactersEqual(c1, c2)).toBe(true)
  })

  it('属性不同返回false', () => {
    const c1 = createDefaultCharacter()
    const c2 = { ...c1, attributes: { ...c1.attributes, strength: 10 } }
    expect(charactersEqual(c1, c2)).toBe(false)
  })

  it('外观不同返回false', () => {
    const c1 = createDefaultCharacter()
    const c2 = { ...c1, appearance: { ...c1.appearance, outfit: 'warrior' } }
    expect(charactersEqual(c1, c2)).toBe(false)
  })
})

describe('getCardData', () => {
  it('返回正确的卡片数据结构', () => {
    const c = createDefaultCharacter()
    c.name = '英雄'
    const data = getCardData(c)
    expect(data).toHaveProperty('bgColor')
    expect(data).toHaveProperty('borderColor')
    expect(data).toHaveProperty('secondaryColor')
    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('subtitle')
    expect(data).toHaveProperty('unlockedSkills')
    expect(data).toHaveProperty('createdAt')
  })

  it('名称使用角色名', () => {
    const c = createDefaultCharacter()
    c.name = '勇者'
    expect(getCardData(c).name).toBe('勇者')
  })

  it('空名称显示未命名角色', () => {
    const c = createDefaultCharacter()
    expect(getCardData(c).name).toBe('未命名角色')
  })

  it('副标题包含职业、性别和等级', () => {
    const c = createDefaultCharacter()
    const data = getCardData(c)
    expect(data.subtitle).toContain('平民')
    expect(data.subtitle).toContain('男')
    expect(data.subtitle).toContain('Lv.1')
  })

  it('女性角色副标题包含女', () => {
    const c = createDefaultCharacter()
    c.gender = 'female'
    expect(getCardData(c).subtitle).toContain('女')
  })

  it('其他性别角色副标题包含其他', () => {
    const c = createDefaultCharacter()
    c.gender = 'other'
    expect(getCardData(c).subtitle).toContain('其他')
  })

  it('战士职业的背景色使用战士配色', () => {
    const c = createDefaultCharacter()
    c.appearance.outfit = 'warrior'
    const data = getCardData(c)
    const warriorOutfit = OUTFITS.find(o => o.key === 'warrior')
    expect(data.bgColor).toBe(warriorOutfit.primaryColor)
    expect(data.borderColor).toBe(warriorOutfit.accent)
  })

  it('已解锁技能列表包含技能名', () => {
    const c = createDefaultCharacter()
    c.appearance.outfit = 'warrior'
    c.unlockedSkills = ['w1']
    const data = getCardData(c)
    expect(data.unlockedSkills.length).toBe(1)
    const w1 = SKILL_TREES.warrior.find(s => s.id === 'w1')
    expect(data.unlockedSkills[0]).toContain(w1.name)
  })

  it('无已解锁技能时列表为空', () => {
    const c = createDefaultCharacter()
    const data = getCardData(c)
    expect(data.unlockedSkills).toEqual([])
  })

  it('createdAt 是格式化的时间字符串', () => {
    const c = createDefaultCharacter()
    const data = getCardData(c)
    expect(data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })
})

describe('drawCardCanvas', () => {
  function createMockCtx() {
    const calls = []
    const handler = {
      get(target, prop) {
        if (prop in target) return target[prop]
        return (...args) => { calls.push({ method: prop, args }) }
      }
    }
    return { ctx: new Proxy({}, handler), calls }
  }

  function createMockCanvasFactory() {
    const { ctx: miniCtx, calls: miniCalls } = createMockCtx()
    return {
      factory: () => ({
        width: 200,
        height: 280,
        getContext: () => miniCtx,
      }),
      miniCalls,
    }
  }

  it('在 Node.js 环境中通过注入 createCanvas 可正常运行', () => {
    const { ctx, calls } = createMockCtx()
    const { factory } = createMockCanvasFactory()
    const c = createDefaultCharacter()
    c.name = '测试'
    expect(() => drawCardCanvas(ctx, c, factory)).not.toThrow()
  })

  it('调用了 fillRect 绘制背景', () => {
    const { ctx, calls } = createMockCtx()
    const { factory } = createMockCanvasFactory()
    const c = createDefaultCharacter()
    drawCardCanvas(ctx, c, factory)
    const fillRectCalls = calls.filter(c => c.method === 'fillRect')
    expect(fillRectCalls.length).toBeGreaterThan(0)
  })

  it('调用了 fillText 绘制角色名', () => {
    const { ctx, calls } = createMockCtx()
    const { factory } = createMockCanvasFactory()
    const c = createDefaultCharacter()
    c.name = '勇者'
    drawCardCanvas(ctx, c, factory)
    const fillTextCalls = calls.filter(c => c.method === 'fillText')
    const nameCall = fillTextCalls.find(c => c.args[0] === '勇者')
    expect(nameCall).toBeDefined()
  })

  it('有已解锁技能时绘制技能文本', () => {
    const { ctx, calls } = createMockCtx()
    const { factory } = createMockCanvasFactory()
    const c = createDefaultCharacter()
    c.appearance.outfit = 'warrior'
    c.unlockedSkills = ['w1']
    drawCardCanvas(ctx, c, factory)
    const fillTextCalls = calls.filter(c => c.method === 'fillText')
    const skillTitleCall = fillTextCalls.find(c => c.args[0].includes('已解锁技能'))
    expect(skillTitleCall).toBeDefined()
  })

  it('无已解锁技能时不绘制技能标题', () => {
    const { ctx, calls } = createMockCtx()
    const { factory } = createMockCanvasFactory()
    const c = createDefaultCharacter()
    drawCardCanvas(ctx, c, factory)
    const fillTextCalls = calls.filter(c => c.method === 'fillText')
    const skillTitleCall = fillTextCalls.find(c => c.args[0].includes('已解锁技能'))
    expect(skillTitleCall).toBeUndefined()
  })
})

describe('PREVIEW_W and PREVIEW_H', () => {
  it('PREVIEW_W 等于 200', () => {
    expect(PREVIEW_W).toBe(200)
  })

  it('PREVIEW_H 等于 280', () => {
    expect(PREVIEW_H).toBe(280)
  })
})

describe('constants validation', () => {
  it('ATTRIBUTES 包含6个属性', () => {
    expect(ATTRIBUTES.length).toBe(6)
  })

  it('HAIR_STYLES 包含5种发型', () => {
    expect(HAIR_STYLES.length).toBe(5)
  })

  it('HAIR_COLORS 包含8种发色', () => {
    expect(HAIR_COLORS.length).toBe(8)
  })

  it('SKIN_TONES 包含5种肤色', () => {
    expect(SKIN_TONES.length).toBe(5)
  })

  it('EYE_STYLES 包含4种眼睛样式', () => {
    expect(EYE_STYLES.length).toBe(4)
  })

  it('OUTFITS 包含6种服装', () => {
    expect(OUTFITS.length).toBe(6)
  })

  it('GENDERS 包含3种性别', () => {
    expect(GENDERS.length).toBe(3)
  })

  it('SKILL_TREES 包含6个职业', () => {
    expect(Object.keys(SKILL_TREES).length).toBe(6)
  })

  it('ATTR_FREE_POINTS 等于30', () => {
    expect(ATTR_FREE_POINTS).toBe(30)
  })

  it('ATTR_MAX 等于20', () => {
    expect(ATTR_MAX).toBe(20)
  })

  it('ATTR_INITIAL 等于5', () => {
    expect(ATTR_INITIAL).toBe(5)
  })

  it('MAX_SAVED_CHARACTERS 等于10', () => {
    expect(MAX_SAVED_CHARACTERS).toBe(10)
  })

  it('INITIAL_SKILL_POINTS 等于3', () => {
    expect(INITIAL_SKILL_POINTS).toBe(3)
  })

  it('LEVEL_PER_SKILL_POINT 等于5', () => {
    expect(LEVEL_PER_SKILL_POINT).toBe(5)
  })
})
