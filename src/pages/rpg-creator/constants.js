export const STORAGE_KEY = 'rpg-creator-characters'
export const MAX_SAVED_CHARACTERS = 10

export const ATTR_INITIAL = 5
export const ATTR_MAX = 20
export const ATTR_FREE_POINTS = 30

export const ATTRIBUTES = [
  { key: 'strength', label: '力量', desc: '物理攻击', icon: '⚔️' },
  { key: 'agility', label: '敏捷', desc: '暴击率和闪避', icon: '🏃' },
  { key: 'intelligence', label: '智力', desc: '魔法攻击', icon: '📖' },
  { key: 'stamina', label: '体力', desc: '生命值', icon: '❤️' },
  { key: 'spirit', label: '精神', desc: '魔法防御', icon: '✨' },
  { key: 'charisma', label: '魅力', desc: '社交和交易', icon: '💬' },
]

export const HAIR_STYLES = [
  { id: 'short', name: '短发' },
  { id: 'long', name: '长发' },
  { id: 'spiky', name: '刺猬头' },
  { id: 'ponytail', name: '马尾' },
  { id: 'bald', name: '光头' },
]

export const HAIR_COLORS = [
  { id: 'black', name: '黑色', color: '#1a1a1a' },
  { id: 'brown', name: '棕色', color: '#6b3a2a' },
  { id: 'blonde', name: '金色', color: '#d4a843' },
  { id: 'red', name: '红色', color: '#a83232' },
  { id: 'white', name: '白色', color: '#e8e8e8' },
  { id: 'blue', name: '蓝色', color: '#3a6bb5' },
  { id: 'green', name: '绿色', color: '#3a8c4a' },
  { id: 'pink', name: '粉色', color: '#d45e8a' },
]

export const SKIN_TONES = [
  { id: 'fair', name: '白皙', color: '#fce4c7' },
  { id: 'light', name: '浅色', color: '#e8c49a' },
  { id: 'medium', name: '中等', color: '#c49a6c' },
  { id: 'tan', name: '棕色', color: '#8d5524' },
  { id: 'dark', name: '深色', color: '#5c3317' },
]

export const EYE_STYLES = [
  { id: 'round', name: '圆眼' },
  { id: 'narrow', name: '细眼' },
  { id: 'big', name: '大眼' },
  { id: 'angry', name: '怒目' },
]

export const OUTFITS = [
  { key: 'warrior', name: '战士', primaryColor: '#8b4513', secondaryColor: '#d4a843', accent: '#cc3333', icon: '⚔️' },
  { key: 'mage', name: '法师', primaryColor: '#2a1a4e', secondaryColor: '#7b68ee', accent: '#9370db', icon: '🔮' },
  { key: 'hunter', name: '猎人', primaryColor: '#2d5016', secondaryColor: '#6b8e23', accent: '#8fbc8f', icon: '🏹' },
  { key: 'rogue', name: '盗贼', primaryColor: '#1a1a2e', secondaryColor: '#4a4a6a', accent: '#6a6a8a', icon: '🗡️' },
  { key: 'monk', name: '僧侣', primaryColor: '#8b6914', secondaryColor: '#daa520', accent: '#ffd700', icon: '🧘' },
  { key: 'civilian', name: '平民', primaryColor: '#556b2f', secondaryColor: '#8fbc8f', accent: '#bdb76b', icon: '🏠' },
]

export const GENDERS = [
  { key: 'male', label: '男' },
  { key: 'female', label: '女' },
  { key: 'other', label: '其他' },
]

export const INITIAL_SKILL_POINTS = 3
export const LEVEL_PER_SKILL_POINT = 5

export const SKILL_TREES = {
  warrior: [
    { id: 'w1', name: '猛力斩击', icon: '🗡️', desc: '强力物理攻击，造成120%伤害', layer: 1, prereq: null, attrReq: { strength: 8 }, children: ['w4', 'w5'] },
    { id: 'w2', name: '盾墙', icon: '🛡️', desc: '提升30%物理防御，持续3回合', layer: 1, prereq: null, attrReq: { stamina: 8 }, children: ['w6', 'w7'] },
    { id: 'w3', name: '战吼', icon: '📯', desc: '提升全队攻击力15%，持续2回合', layer: 1, prereq: null, attrReq: { charisma: 6 }, children: ['w8'] },
    { id: 'w4', name: '旋风斩', icon: '🌀', desc: '范围物理攻击，命中周围所有敌人', layer: 2, prereq: 'w1', attrReq: { strength: 12 }, children: ['w9', 'w10'] },
    { id: 'w5', name: '破甲击', icon: '💥', desc: '无视50%防御的穿透攻击', layer: 2, prereq: 'w1', attrReq: { strength: 14 }, children: ['w11'] },
    { id: 'w6', name: '铁壁', icon: '🏔️', desc: '永久提升20%物理防御', layer: 2, prereq: 'w2', attrReq: { stamina: 12 }, children: ['w12'] },
    { id: 'w7', name: '反击', icon: '⚡', desc: '受击时50%概率反弹30%伤害', layer: 2, prereq: 'w2', attrReq: { stamina: 14, strength: 10 }, children: ['w13'] },
    { id: 'w8', name: '鼓舞士气', icon: '🔥', desc: '全队攻击力提升至25%，持续3回合', layer: 2, prereq: 'w3', attrReq: { charisma: 10 }, children: ['w14'] },
    { id: 'w9', name: '狂暴', icon: '😤', desc: '攻击+50%，防御-20%，持续3回合', layer: 3, prereq: 'w4', attrReq: { strength: 16 }, children: ['w15'] },
    { id: 'w10', name: '横扫千军', icon: '🌪️', desc: '对所有敌人造成150%伤害', layer: 3, prereq: 'w4', attrReq: { strength: 15, agility: 8 }, children: [] },
    { id: 'w11', name: '致命一击', icon: '💢', desc: '无视80%防御，造成200%伤害', layer: 3, prereq: 'w5', attrReq: { strength: 18 }, children: [] },
    { id: 'w12', name: '金刚不坏', icon: '🗿', desc: '永久提升40%物理防御和20%魔法防御', layer: 3, prereq: 'w6', attrReq: { stamina: 16, spirit: 8 }, children: [] },
    { id: 'w13', name: '荆棘护甲', icon: '🌹', desc: '受击时100%反弹50%伤害', layer: 3, prereq: 'w7', attrReq: { stamina: 17, strength: 12 }, children: [] },
    { id: 'w14', name: '王者之威', icon: '👑', desc: '全队攻击+35%，自身暴击率+20%', layer: 3, prereq: 'w8', attrReq: { charisma: 15, strength: 10 }, children: [] },
    { id: 'w15', name: '狂战之怒', icon: '💀', desc: '攻击+80%，防御-30%，击杀后效果重置', layer: 4, prereq: 'w9', attrReq: { strength: 20, stamina: 12 }, children: [] },
  ],
  mage: [
    { id: 'm1', name: '火球术', icon: '🔥', desc: '发射火球造成魔法伤害', layer: 1, prereq: null, attrReq: { intelligence: 8 }, children: ['m4', 'm5'] },
    { id: 'm2', name: '冰霜新星', icon: '❄️', desc: '冻结敌人并造成冰霜伤害', layer: 1, prereq: null, attrReq: { intelligence: 8 }, children: ['m6', 'm7'] },
    { id: 'm3', name: '奥术护盾', icon: '🔮', desc: '吸收魔法伤害的防护盾', layer: 1, prereq: null, attrReq: { spirit: 7 }, children: ['m8'] },
    { id: 'm4', name: '陨石术', icon: '☄️', desc: '召唤陨石范围轰炸', layer: 2, prereq: 'm1', attrReq: { intelligence: 14 }, children: ['m9', 'm10'] },
    { id: 'm5', name: '烈焰护甲', icon: '🔥', desc: '火焰护盾，反弹魔法伤害', layer: 2, prereq: 'm1', attrReq: { intelligence: 12 }, children: ['m11'] },
    { id: 'm6', name: '暴风雪', icon: '🌨️', desc: '大范围冰霜攻击，减速全体', layer: 2, prereq: 'm2', attrReq: { intelligence: 13 }, children: ['m12'] },
    { id: 'm7', name: '寒冰屏障', icon: '🧊', desc: '免疫所有伤害1回合', layer: 2, prereq: 'm2', attrReq: { spirit: 12 }, children: ['m13'] },
    { id: 'm8', name: '魔力涌动', icon: '💫', desc: '魔法攻击力提升25%，持续3回合', layer: 2, prereq: 'm3', attrReq: { spirit: 10, intelligence: 10 }, children: ['m14'] },
    { id: 'm9', name: '地狱烈焰', icon: '👹', desc: '对所有敌人造成200%火焰伤害', layer: 3, prereq: 'm4', attrReq: { intelligence: 17 }, children: ['m15'] },
    { id: 'm10', name: '元素精通', icon: '🌈', desc: '所有元素伤害提升30%', layer: 3, prereq: 'm4', attrReq: { intelligence: 16, spirit: 10 }, children: [] },
    { id: 'm11', name: '凤凰之翼', icon: '🦅', desc: '死亡时复活，恢复50%生命', layer: 3, prereq: 'm5', attrReq: { intelligence: 15, spirit: 12 }, children: [] },
    { id: 'm12', name: '绝对零度', icon: '🥶', desc: '冻结敌人2回合，造成180%冰霜伤害', layer: 3, prereq: 'm6', attrReq: { intelligence: 18 }, children: [] },
    { id: 'm13', name: '时间静止', icon: '⏸️', desc: '暂停时间2回合，自身可行动', layer: 3, prereq: 'm7', attrReq: { spirit: 16, intelligence: 14 }, children: [] },
    { id: 'm14', name: '魔力源泉', icon: '⚗️', desc: '魔法攻击力永久+40%，魔力回复+50%', layer: 3, prereq: 'm8', attrReq: { spirit: 14, intelligence: 12 }, children: [] },
    { id: 'm15', name: '末日审判', icon: '☠️', desc: '召唤陨石雨，对所有敌人造成300%伤害', layer: 4, prereq: 'm9', attrReq: { intelligence: 20, spirit: 15 }, children: [] },
  ],
  hunter: [
    { id: 'h1', name: '精准射击', icon: '🎯', desc: '高精度射击，暴击率+30%', layer: 1, prereq: null, attrReq: { agility: 8 }, children: ['h4', 'h5'] },
    { id: 'h2', name: '陷阱设置', icon: '🪤', desc: '放置陷阱困住敌人', layer: 1, prereq: null, attrReq: { agility: 7 }, children: ['h6', 'h7'] },
    { id: 'h3', name: '驯兽', icon: '🐺', desc: '召唤野兽伙伴协助战斗', layer: 1, prereq: null, attrReq: { charisma: 7 }, children: ['h8'] },
    { id: 'h4', name: '多重射击', icon: '🏹', desc: '一次射出多支箭矢攻击多个目标', layer: 2, prereq: 'h1', attrReq: { agility: 13 }, children: ['h9', 'h10'] },
    { id: 'h5', name: '致命一击', icon: '💫', desc: '暴击伤害提升至250%', layer: 2, prereq: 'h1', attrReq: { agility: 15 }, children: ['h11'] },
    { id: 'h6', name: '毒箭', icon: '☠️', desc: '射击附带持续毒伤害', layer: 2, prereq: 'h2', attrReq: { agility: 11 }, children: ['h12'] },
    { id: 'h7', name: '伪装', icon: '🌿', desc: '隐身1回合，下次攻击伤害翻倍', layer: 2, prereq: 'h2', attrReq: { agility: 14 }, children: ['h13'] },
    { id: 'h8', name: '野兽之力', icon: '🦁', desc: '召唤的野兽攻击和防御+30%', layer: 2, prereq: 'h3', attrReq: { charisma: 11, agility: 8 }, children: ['h14'] },
    { id: 'h9', name: '箭雨', icon: '🌧️', desc: '对所有敌人造成120%伤害，减速2回合', layer: 3, prereq: 'h4', attrReq: { agility: 16 }, children: ['h15'] },
    { id: 'h10', name: '穿透箭', icon: '➡️', desc: '箭矢穿透敌人，攻击直线上所有目标', layer: 3, prereq: 'h4', attrReq: { agility: 17, strength: 8 }, children: [] },
    { id: 'h11', name: '猎人本能', icon: '👁️', desc: '暴击率永久+25%，暴击伤害提升至300%', layer: 3, prereq: 'h5', attrReq: { agility: 18 }, children: [] },
    { id: 'h12', name: '剧毒涂敷', icon: '🧪', desc: '毒伤害+100%，持续时间+2回合', layer: 3, prereq: 'h6', attrReq: { agility: 14, intelligence: 8 }, children: [] },
    { id: 'h13', name: '暗影刺杀', icon: '🌙', desc: '隐身攻击伤害变为3倍，不解除隐身', layer: 3, prereq: 'h7', attrReq: { agility: 17, spirit: 8 }, children: [] },
    { id: 'h14', name: '兽王', icon: '🐉', desc: '可同时召唤2只野兽，全属性+40%', layer: 3, prereq: 'h8', attrReq: { charisma: 16, agility: 12 }, children: [] },
    { id: 'h15', name: '狩猎大师', icon: '🏆', desc: '箭雨伤害提升至200%，暴击率+50%', layer: 4, prereq: 'h9', attrReq: { agility: 20, charisma: 10 }, children: [] },
  ],
  rogue: [
    { id: 'r1', name: '背刺', icon: '🔪', desc: '从背后攻击造成200%伤害', layer: 1, prereq: null, attrReq: { agility: 9 }, children: ['r4', 'r5'] },
    { id: 'r2', name: '潜行', icon: '👤', desc: '进入隐身状态，脱离战斗', layer: 1, prereq: null, attrReq: { agility: 8 }, children: ['r6', 'r7'] },
    { id: 'r3', name: '开锁', icon: '🔑', desc: '打开上锁的宝箱和门', layer: 1, prereq: null, attrReq: { agility: 6 }, children: ['r8'] },
    { id: 'r4', name: '暗杀', icon: '💀', desc: '对低血量目标造成致命一击', layer: 2, prereq: 'r1', attrReq: { agility: 15 }, children: ['r9', 'r10'] },
    { id: 'r5', name: '淬毒之刃', icon: '🧪', desc: '武器附毒，攻击附带持续伤害', layer: 2, prereq: 'r1', attrReq: { agility: 12 }, children: ['r11'] },
    { id: 'r6', name: '影步', icon: '🌑', desc: '瞬间移动到目标身后', layer: 2, prereq: 'r2', attrReq: { agility: 13 }, children: ['r12'] },
    { id: 'r7', name: '闪避大师', icon: '💨', desc: '闪避率提升至60%', layer: 2, prereq: 'r2', attrReq: { agility: 16 }, children: ['r13'] },
    { id: 'r8', name: '妙手空空', icon: '👋', desc: '从敌人身上偷取物品或金币', layer: 2, prereq: 'r3', attrReq: { agility: 10, charisma: 6 }, children: ['r14'] },
    { id: 'r9', name: '死神降临', icon: '☠️', desc: '对生命值低于30%的目标一击必杀', layer: 3, prereq: 'r4', attrReq: { agility: 18, spirit: 8 }, children: ['r15'] },
    { id: 'r10', name: '连刺', icon: '🗡️', desc: '快速攻击5次，每次造成60%伤害', layer: 3, prereq: 'r4', attrReq: { agility: 17 }, children: [] },
    { id: 'r11', name: '剧毒攻心', icon: '💔', desc: '毒伤害+150%，有概率直接中毒致死', layer: 3, prereq: 'r5', attrReq: { agility: 15, intelligence: 10 }, children: [] },
    { id: 'r12', name: '瞬杀', icon: '⚡', desc: '影步后接背刺，造成350%伤害', layer: 3, prereq: 'r6', attrReq: { agility: 18 }, children: [] },
    { id: 'r13', name: '虚无之体', icon: '👻', desc: '闪避率+80%，受到攻击时有30%完全免疫', layer: 3, prereq: 'r7', attrReq: { agility: 20, spirit: 10 }, children: [] },
    { id: 'r14', name: '江洋大盗', icon: '💰', desc: '偷窃成功率+50%，获得金币+100%', layer: 3, prereq: 'r8', attrReq: { agility: 14, charisma: 12 }, children: [] },
    { id: 'r15', name: '暗影主宰', icon: '🌙', desc: '潜行永久不解除，攻击伤害+60%', layer: 4, prereq: 'r9', attrReq: { agility: 20, spirit: 14 }, children: [] },
  ],
  monk: [
    { id: 'k1', name: '铁拳', icon: '👊', desc: '强力拳击，造成150%物理伤害', layer: 1, prereq: null, attrReq: { strength: 7 }, children: ['k4', 'k5'] },
    { id: 'k2', name: '冥想', icon: '🧘', desc: '回复30%生命和魔法', layer: 1, prereq: null, attrReq: { spirit: 8 }, children: ['k6', 'k7'] },
    { id: 'k3', name: '铁布衫', icon: '🛡️', desc: '减少受到的物理伤害25%', layer: 1, prereq: null, attrReq: { stamina: 8 }, children: ['k8'] },
    { id: 'k4', name: '连击', icon: '🥊', desc: '连续攻击三次', layer: 2, prereq: 'k1', attrReq: { strength: 12 }, children: ['k9', 'k10'] },
    { id: 'k5', name: '旋风腿', icon: '🦵', desc: '范围踢击，击退周围敌人', layer: 2, prereq: 'k1', attrReq: { agility: 11 }, children: ['k11'] },
    { id: 'k6', name: '心如止水', icon: '☯️', desc: '免疫精神控制效果', layer: 2, prereq: 'k2', attrReq: { spirit: 13 }, children: ['k12'] },
    { id: 'k7', name: '治疗之手', icon: '🤲', desc: '恢复队友生命值', layer: 2, prereq: 'k2', attrReq: { spirit: 12 }, children: ['k13'] },
    { id: 'k8', name: '金钟罩', icon: '🔔', desc: '物理伤害减免提升至40%', layer: 2, prereq: 'k3', attrReq: { stamina: 12, spirit: 6 }, children: ['k14'] },
    { id: 'k9', name: '百裂拳', icon: '💥', desc: '疯狂攻击10次，每次造成50%伤害', layer: 3, prereq: 'k4', attrReq: { strength: 16, agility: 10 }, children: ['k15'] },
    { id: 'k10', name: '气劲爆发', icon: '💨', desc: '释放真气冲击波，对所有敌人造成180%伤害', layer: 3, prereq: 'k4', attrReq: { strength: 15, spirit: 10 }, children: [] },
    { id: 'k11', name: '降龙十八掌', icon: '🐉', desc: '强力掌击，造成250%伤害并击退敌人', layer: 3, prereq: 'k5', attrReq: { strength: 17, agility: 12 }, children: [] },
    { id: 'k12', name: '涅槃重生', icon: '🔥', desc: '死亡时满血复活，每场战斗限一次', layer: 3, prereq: 'k6', attrReq: { spirit: 18, stamina: 10 }, children: [] },
    { id: 'k13', name: '圣手回春', icon: '💚', desc: '全队恢复60%生命值，并解除所有负面状态', layer: 3, prereq: 'k7', attrReq: { spirit: 16, charisma: 10 }, children: [] },
    { id: 'k14', name: '金刚不坏体', icon: '🗿', desc: '物理伤害减免60%，魔法伤害减免30%', layer: 3, prereq: 'k8', attrReq: { stamina: 17, spirit: 12 }, children: [] },
    { id: 'k15', name: '如来神掌', icon: '🙏', desc: '召唤如来法相，对所有敌人造成400%神圣伤害', layer: 4, prereq: 'k9', attrReq: { strength: 20, spirit: 16, stamina: 12 }, children: [] },
  ],
  civilian: [
    { id: 'c1', name: '讨价还价', icon: '💰', desc: '购买物品时享受8折优惠', layer: 1, prereq: null, attrReq: { charisma: 7 }, children: ['c4', 'c5'] },
    { id: 'c2', name: '烹饪', icon: '🍳', desc: '制作恢复生命值的食物', layer: 1, prereq: null, attrReq: { spirit: 6 }, children: ['c6', 'c7'] },
    { id: 'c3', name: '幸运之星', icon: '🍀', desc: '提升物品掉落率15%', layer: 1, prereq: null, attrReq: { charisma: 5 }, children: ['c8'] },
    { id: 'c4', name: '商业头脑', icon: '📊', desc: '出售物品时获得120%价格', layer: 2, prereq: 'c1', attrReq: { charisma: 12 }, children: ['c9', 'c10'] },
    { id: 'c5', name: '人脉网络', icon: '🤝', desc: '解锁隐藏商店和任务', layer: 2, prereq: 'c1', attrReq: { charisma: 14 }, children: ['c11'] },
    { id: 'c6', name: '大餐', icon: '🍖', desc: '团队全员恢复50%生命', layer: 2, prereq: 'c2', attrReq: { spirit: 10 }, children: ['c12'] },
    { id: 'c7', name: '草药学', icon: '🌿', desc: '制作强力药水和解毒剂', layer: 2, prereq: 'c2', attrReq: { intelligence: 10 }, children: ['c13'] },
    { id: 'c8', name: '财富眷顾', icon: '💎', desc: '稀有物品掉落率+25%', layer: 2, prereq: 'c3', attrReq: { charisma: 9, luck: 5 }, children: ['c14'] },
    { id: 'c9', name: '市场垄断', icon: '🏪', desc: '可自定义物品价格，商店利润+80%', layer: 3, prereq: 'c4', attrReq: { charisma: 16, intelligence: 10 }, children: ['c15'] },
    { id: 'c10', name: '商业帝国', icon: '🏛️', desc: '每日自动获得金币，数量随等级增长', layer: 3, prereq: 'c4', attrReq: { charisma: 17 }, children: [] },
    { id: 'c11', name: '皇家认证', icon: '👑', desc: '进入贵族区域，获得史诗级任务', layer: 3, prereq: 'c5', attrReq: { charisma: 18, intelligence: 8 }, children: [] },
    { id: 'c12', name: '满汉全席', icon: '🥘', desc: '全队恢复100%生命和魔法，全属性+15%持续10回合', layer: 3, prereq: 'c6', attrReq: { spirit: 15, charisma: 10 }, children: [] },
    { id: 'c13', name: '炼金术', icon: '⚗️', desc: '制作传说级药水，点石成金', layer: 3, prereq: 'c7', attrReq: { intelligence: 16, spirit: 12 }, children: [] },
    { id: 'c14', name: '天选之人', icon: '⭐', desc: '所有掉落率+50%，暴击率+20%，经验+30%', layer: 3, prereq: 'c8', attrReq: { charisma: 16, luck: 10 }, children: [] },
    { id: 'c15', name: '世界首富', icon: '🏆', desc: '金钱可购买属性点和技能点，每日刷新神秘商店', layer: 4, prereq: 'c9', attrReq: { charisma: 20, intelligence: 14 }, children: [] },
  ],
}
