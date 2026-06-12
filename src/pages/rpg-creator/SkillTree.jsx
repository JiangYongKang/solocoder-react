import { useMemo } from 'react'
import { SKILL_TREES, ATTRIBUTES } from './constants'
import { canUnlockSkill, unlockSkill } from './utils'

const LAYER_NAMES = {
  1: '基础技能',
  2: '进阶技能',
  3: '高级技能',
  4: '终极技能',
}

function formatAttrReq(attrReq) {
  if (!attrReq) return ''
  const parts = []
  for (const [key, val] of Object.entries(attrReq)) {
    const attr = ATTRIBUTES.find(a => a.key === key)
    parts.push(`${attr ? attr.label : key} ≥ ${val}`)
  }
  return parts.join(', ')
}

export default function SkillTreePanel({ outfit, attributes, unlockedSkills, skillPoints, onUnlock }) {
  const skills = useMemo(() => SKILL_TREES[outfit] || [], [outfit])

  const layers = useMemo(() => {
    const map = {}
    skills.forEach(s => {
      const layer = s.layer || 1
      if (!map[layer]) map[layer] = []
      map[layer].push(s)
    })
    return map
  }, [skills])

  const getSkillStatus = (skill) => {
    if (unlockedSkills.includes(skill.id)) return 'unlocked'
    const check = canUnlockSkill(skill, attributes, unlockedSkills, skillPoints)
    if (check.canUnlock) return 'can-unlock'
    return 'locked'
  }

  const handleSkillClick = (skill) => {
    const status = getSkillStatus(skill)
    if (status === 'locked') return
    if (status === 'unlocked') return
    const result = unlockSkill(skill, attributes, unlockedSkills, skillPoints)
    if (result.success) {
      onUnlock(result.unlockedSkills, result.skillPoints)
    }
  }

  return (
    <div className="rpg-card">
      <h3 className="rpg-card-title">🌲 技能树</h3>
      <div className="rpg-skill-points-display">
        可用技能点: <span>{skillPoints}</span>
      </div>

      <div className="rpg-skill-tree">
        {Object.keys(layers).sort((a, b) => a - b).map((layer) => (
          <div className="rpg-skill-layer" key={layer}>
            {parseInt(layer) > 1 && (
              <div className="rpg-connector-line" />
            )}
            <div className="rpg-skill-layer-title">
              第{layer}层 · {LAYER_NAMES[layer] || `层级 ${layer}`}
            </div>
            <div className="rpg-skill-nodes">
              {layers[layer].map((skill) => {
                const status = getSkillStatus(skill)
                return (
                  <div
                    key={skill.id}
                    className={`rpg-skill-node ${status}`}
                    onClick={() => handleSkillClick(skill)}
                    title={skill.desc}
                  >
                    <span className="rpg-skill-icon">{skill.icon}</span>
                    <div className="rpg-skill-name">{skill.name}</div>
                    <div className="rpg-skill-desc">{skill.desc}</div>
                    {status !== 'unlocked' && skill.attrReq && (
                      <div className={`rpg-skill-req ${status === 'can-unlock' ? 'met' : ''}`}>
                        {formatAttrReq(skill.attrReq)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
