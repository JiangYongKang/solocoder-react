import { describe, it, expect } from 'vitest'
import {
  parseVersion,
  compareVersions,
  versionToString,
  parseRange,
  isVersionInRange,
  detectVersionConflict,
  bumpVersion,
  generateLatestVersion,
  calculateLatestVersion,
  isVersionOutdated,
  hasNewerVersion,
  getCompatibleVersion,
  flattenDependencyTree,
  filterDependenciesByName,
  collectAllDescendantIds,
  findDependencyById,
  getAllDirectDependencies,
  collectAllDependencies,
  buildGraphNodes,
  getRelatedNodes,
  buildLockEntries,
  diffLockEntries,
  applyUpgrades,
  collectUpgradable,
  formatSize,
  formatDate,
  generateOperationSummary,
} from '../../package-manager/packageUtils.js'

describe('版本解析与比较', () => {
  describe('parseVersion', () => {
    it('应该正确解析标准语义化版本', () => {
      expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
      expect(parseVersion('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 })
      expect(parseVersion('10.20.30')).toEqual({ major: 10, minor: 20, patch: 30 })
    })

    it('应该处理带前缀的版本号', () => {
      expect(parseVersion('^1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
      expect(parseVersion('~1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
      expect(parseVersion('>=1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
      expect(parseVersion('<=1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 })
    })

    it('非字符串输入应该返回 null', () => {
      expect(parseVersion(null)).toBeNull()
      expect(parseVersion(undefined)).toBeNull()
      expect(parseVersion(123)).toBeNull()
      expect(parseVersion({})).toBeNull()
    })

    it('不完整的版本号应该补零', () => {
      expect(parseVersion('1')).toEqual({ major: 1, minor: 0, patch: 0 })
      expect(parseVersion('1.2')).toEqual({ major: 1, minor: 2, patch: 0 })
    })
  })

  describe('versionToString', () => {
    it('应该正确转换为字符串', () => {
      expect(versionToString({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3')
      expect(versionToString({ major: 0, minor: 0, patch: 0 })).toBe('0.0.0')
    })

    it('null 输入应该返回默认版本', () => {
      expect(versionToString(null)).toBe('0.0.0')
      expect(versionToString(undefined)).toBe('0.0.0')
    })
  })

  describe('compareVersions', () => {
    it('应该正确比较主版本号', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0)
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0)
    })

    it('应该正确比较次版本号', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBeGreaterThan(0)
      expect(compareVersions('1.1.0', '1.2.0')).toBeLessThan(0)
    })

    it('应该正确比较修订号', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0)
      expect(compareVersions('1.0.1', '1.0.2')).toBeLessThan(0)
    })

    it('相同版本应该返回 0', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0)
    })

    it('无效版本应该返回 0', () => {
      expect(compareVersions(null, '1.0.0')).toBe(0)
      expect(compareVersions('1.0.0', undefined)).toBe(0)
    })
  })

  describe('bumpVersion', () => {
    it('应该正确升级主版本号', () => {
      expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0')
      expect(bumpVersion('0.9.9', 'major')).toBe('1.0.0')
    })

    it('应该正确升级次版本号', () => {
      expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0')
      expect(bumpVersion('1.0.9', 'minor')).toBe('1.1.0')
    })

    it('应该正确升级修订号', () => {
      expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4')
      expect(bumpVersion('1.2.0', 'patch')).toBe('1.2.1')
    })

    it('默认应该升级修订号', () => {
      expect(bumpVersion('1.2.3')).toBe('1.2.4')
    })

    it('无效版本应该原样返回', () => {
      expect(bumpVersion(null)).toBeNull()
    })
  })

  describe('hasNewerVersion', () => {
    it('应该正确判断是否存在更新版本', () => {
      expect(hasNewerVersion('1.0.0', '1.0.1')).toBe(true)
      expect(hasNewerVersion('1.0.0', '1.1.0')).toBe(true)
      expect(hasNewerVersion('1.0.0', '2.0.0')).toBe(true)
    })

    it('相同或更低版本应该返回 false', () => {
      expect(hasNewerVersion('1.0.0', '1.0.0')).toBe(false)
      expect(hasNewerVersion('2.0.0', '1.0.0')).toBe(false)
    })
  })

  describe('isVersionOutdated', () => {
    it('应该判断版本是否过旧（落后2个大版本以上）', () => {
      expect(isVersionOutdated('1.0.0', '3.0.0')).toBe(true)
      expect(isVersionOutdated('1.0.0', '4.0.0')).toBe(true)
      expect(isVersionOutdated('1.0.0', '2.0.0')).toBe(false)
      expect(isVersionOutdated('1.0.0', '1.9.9')).toBe(false)
    })

    it('应该支持自定义阈值', () => {
      expect(isVersionOutdated('1.0.0', '2.0.0', 1)).toBe(true)
      expect(isVersionOutdated('1.0.0', '3.0.0', 3)).toBe(false)
    })
  })
})

describe('版本范围校验', () => {
  describe('parseRange', () => {
    it('应该正确解析 caret 范围', () => {
      expect(parseRange('^1.2.3')).toEqual({ type: 'caret', version: '1.2.3' })
    })

    it('应该正确解析 tilde 范围', () => {
      expect(parseRange('~1.2.3')).toEqual({ type: 'tilde', version: '1.2.3' })
    })

    it('应该正确解析大于等于范围', () => {
      expect(parseRange('>=1.2.3')).toEqual({ type: 'gte', version: '1.2.3' })
    })

    it('应该正确解析小于等于范围', () => {
      expect(parseRange('<=1.2.3')).toEqual({ type: 'lte', version: '1.2.3' })
    })

    it('应该正确解析精确版本', () => {
      expect(parseRange('1.2.3')).toEqual({ type: 'exact', version: '1.2.3' })
    })

    it('非字符串应该返回 exact 类型', () => {
      expect(parseRange(null)).toEqual({ type: 'exact', version: '0.0.0' })
    })
  })

  describe('isVersionInRange', () => {
    it('应该正确判断 caret 范围（相同主版本）', () => {
      expect(isVersionInRange('1.2.3', '^1.2.0')).toBe(true)
      expect(isVersionInRange('1.3.0', '^1.2.0')).toBe(true)
      expect(isVersionInRange('2.0.0', '^1.2.0')).toBe(false)
      expect(isVersionInRange('1.1.0', '^1.2.0')).toBe(false)
    })

    it('应该正确判断 tilde 范围（相同主次版本）', () => {
      expect(isVersionInRange('1.2.3', '~1.2.0')).toBe(true)
      expect(isVersionInRange('1.2.9', '~1.2.0')).toBe(true)
      expect(isVersionInRange('1.3.0', '~1.2.0')).toBe(false)
    })

    it('应该正确判断精确版本', () => {
      expect(isVersionInRange('1.2.3', '1.2.3')).toBe(true)
      expect(isVersionInRange('1.2.4', '1.2.3')).toBe(false)
    })

    it('应该正确判断 gte 范围', () => {
      expect(isVersionInRange('2.0.0', '>=1.0.0')).toBe(true)
      expect(isVersionInRange('1.0.0', '>=1.0.0')).toBe(true)
      expect(isVersionInRange('0.9.0', '>=1.0.0')).toBe(false)
    })

    it('应该正确判断 lte 范围', () => {
      expect(isVersionInRange('1.0.0', '<=2.0.0')).toBe(true)
      expect(isVersionInRange('2.0.0', '<=2.0.0')).toBe(true)
      expect(isVersionInRange('2.1.0', '<=2.0.0')).toBe(false)
    })

    it('无效版本应该返回 false', () => {
      expect(isVersionInRange(null, '^1.0.0')).toBe(false)
      expect(isVersionInRange('1.0.0', null)).toBe(false)
    })
  })

  describe('detectVersionConflict', () => {
    it('应该检测到版本冲突', () => {
      expect(detectVersionConflict('2.0.0', '^1.0.0')).toBe(true)
      expect(detectVersionConflict('0.9.0', '^1.0.0')).toBe(true)
    })

    it('不冲突时应该返回 false', () => {
      expect(detectVersionConflict('1.2.3', '^1.0.0')).toBe(false)
      expect(detectVersionConflict('1.0.0', '^1.0.0')).toBe(false)
    })

    it('缺少参数应该返回 false', () => {
      expect(detectVersionConflict(null, '^1.0.0')).toBe(false)
      expect(detectVersionConflict('1.0.0', null)).toBe(false)
    })
  })

  describe('getCompatibleVersion', () => {
    it('caret 范围应该返回同主版本的最新版', () => {
      const result = getCompatibleVersion('^1.0.0', '1.5.3')
      expect(parseVersion(result).major).toBe(1)
    })

    it('tilde 范围应该返回同主次版本的最新版', () => {
      const result = getCompatibleVersion('~1.2.0', '1.5.3')
      const parsed = parseVersion(result)
      expect(parsed.major).toBe(1)
      expect(parsed.minor).toBe(2)
    })
  })
})

describe('依赖树操作', () => {
  const mockDeps = [
    {
      name: 'react',
      version: '19.0.0',
      installedVersion: '19.2.6',
      latestVersion: '19.4.0',
      versionRange: '^19.2.6',
      license: 'MIT',
      size: 3200000,
      dependencies: [
        {
          name: 'loose-envify',
          version: '1.4.0',
          installedVersion: '1.4.0',
          latestVersion: '1.4.0',
          versionRange: '^1.1.0',
          license: 'MIT',
          size: 5600,
          dependencies: [
            {
              name: 'js-tokens',
              version: '4.0.0',
              installedVersion: '4.0.0',
              latestVersion: '4.0.1',
              versionRange: '^4.0.0',
              license: 'MIT',
              size: 12000,
              dependencies: [],
            },
          ],
        },
      ],
    },
    {
      name: 'react-dom',
      version: '19.0.0',
      installedVersion: '19.2.6',
      latestVersion: '19.2.6',
      versionRange: '^19.2.6',
      license: 'MIT',
      size: 4500000,
      dependencies: [],
    },
  ]

  describe('flattenDependencyTree', () => {
    it('应该正确扁平化依赖树', () => {
      const flat = flattenDependencyTree(mockDeps)
      expect(flat.length).toBe(4)
      expect(flat[0].name).toBe('react')
      expect(flat[0].depth).toBe(0)
      expect(flat[1].name).toBe('loose-envify')
      expect(flat[1].depth).toBe(1)
      expect(flat[2].name).toBe('js-tokens')
      expect(flat[2].depth).toBe(2)
    })

    it('空数组应该返回空结果', () => {
      expect(flattenDependencyTree([])).toEqual([])
      expect(flattenDependencyTree(null)).toEqual([])
    })
  })

  describe('filterDependenciesByName', () => {
    it('应该根据包名过滤依赖', () => {
      const filtered = filterDependenciesByName(mockDeps, 'react')
      expect(filtered.length).toBe(2)
      expect(filtered[0].name).toBe('react')
      expect(filtered[1].name).toBe('react-dom')
    })

    it('应该匹配子依赖并保留父节点', () => {
      const filtered = filterDependenciesByName(mockDeps, 'tokens')
      expect(filtered.length).toBe(1)
      expect(filtered[0].name).toBe('react')
      expect(filtered[0].dependencies.length).toBe(1)
      expect(filtered[0].dependencies[0].dependencies.length).toBe(1)
      expect(filtered[0].dependencies[0].dependencies[0].name).toBe('js-tokens')
    })

    it('空关键词应该返回全部', () => {
      const filtered = filterDependenciesByName(mockDeps, '')
      expect(filtered.length).toBe(mockDeps.length)
    })

    it('搜索应该不区分大小写', () => {
      const r1 = filterDependenciesByName(mockDeps, 'React')
      const r2 = filterDependenciesByName(mockDeps, 'REACT')
      expect(r1.length).toBe(r2.length)
    })
  })

  describe('findDependencyById', () => {
    it('应该根据名称正确查找依赖', () => {
      const dep = findDependencyById(mockDeps, 'react')
      expect(dep).not.toBeNull()
      expect(dep.name).toBe('react')
    })

    it('应该能查找嵌套子依赖', () => {
      const dep = findDependencyById(mockDeps, 'js-tokens')
      expect(dep).not.toBeNull()
      expect(dep.name).toBe('js-tokens')
    })

    it('找不到应该返回 null', () => {
      expect(findDependencyById(mockDeps, 'not-exist')).toBeNull()
    })
  })

  describe('getAllDirectDependencies', () => {
    it('应该返回所有直接依赖', () => {
      const direct = getAllDirectDependencies(mockDeps)
      expect(direct.length).toBe(2)
    })
  })

  describe('collectAllDependencies', () => {
    it('应该收集所有不重复的依赖', () => {
      const all = collectAllDependencies(mockDeps)
      expect(all.length).toBe(4)
    })
  })

  describe('collectAllDescendantIds', () => {
    it('应该收集所有后代ID', () => {
      const ids = collectAllDescendantIds(mockDeps[0])
      expect(ids.length).toBe(3)
    })
  })

  describe('collectUpgradable', () => {
    it('应该收集所有可升级的依赖', () => {
      const upgradable = collectUpgradable(mockDeps)
      expect(upgradable.length).toBeGreaterThan(0)
      upgradable.forEach((item) => {
        expect(compareVersions(item.targetVersion, item.currentVersion)).toBeGreaterThan(0)
      })
    })
  })

  describe('applyUpgrades', () => {
    it('应该正确应用升级', () => {
      const upgradeMap = new Map([
        ['react', { name: 'react', targetVersion: '19.4.0' }],
      ])
      const upgraded = applyUpgrades(mockDeps, upgradeMap)
      expect(upgraded[0].installedVersion).toBe('19.4.0')
    })
  })
})

describe('图结构与可视化', () => {
  const mockDeps = [
    {
      name: 'react',
      installedVersion: '19.2.6',
      latestVersion: '19.4.0',
      versionRange: '^19.2.6',
      license: 'MIT',
      size: 3200000,
      dependencies: [
        {
          name: 'loose-envify',
          installedVersion: '1.4.0',
          latestVersion: '1.4.0',
          versionRange: '^1.1.0',
          license: 'MIT',
          size: 5600,
          dependencies: [],
        },
      ],
    },
    {
      name: 'react-dom',
      installedVersion: '19.2.6',
      latestVersion: '19.2.6',
      versionRange: '^19.2.6',
      license: 'MIT',
      size: 4500000,
      dependencies: [],
    },
  ]

  describe('buildGraphNodes', () => {
    it('应该正确构建图节点和边', () => {
      const { nodes, edges } = buildGraphNodes(mockDeps)
      expect(nodes.length).toBe(3)
      expect(edges.length).toBe(1)
      expect(edges[0].source).toBe('react')
      expect(edges[0].target).toBe('loose-envify')
    })

    it('应该标记直接依赖', () => {
      const { nodes } = buildGraphNodes(mockDeps)
      const react = nodes.find((n) => n.id === 'react')
      const loose = nodes.find((n) => n.id === 'loose-envify')
      expect(react.isDirect).toBe(true)
      expect(loose.isDirect).toBe(false)
    })
  })

  describe('getRelatedNodes', () => {
    it('应该找到所有直接关联的节点', () => {
      const { edges } = buildGraphNodes(mockDeps)
      const related = getRelatedNodes('react', edges)
      expect(related.has('react')).toBe(true)
      expect(related.has('loose-envify')).toBe(true)
    })
  })
})

describe('Lock 文件 Diff', () => {
  const mockDeps = [
    {
      name: 'react',
      installedVersion: '19.2.6',
      versionRange: '^19.2.6',
      license: 'MIT',
      size: 3200000,
      dependencies: [],
    },
    {
      name: 'lodash',
      installedVersion: '4.17.20',
      versionRange: '^4.17.0',
      license: 'MIT',
      size: 1400000,
      dependencies: [],
    },
  ]

  const upgradedDeps = [
    {
      name: 'react',
      installedVersion: '19.4.0',
      versionRange: '^19.2.6',
      license: 'MIT',
      size: 3300000,
      dependencies: [],
    },
    {
      name: 'lodash',
      installedVersion: '4.17.15',
      versionRange: '^4.17.0',
      license: 'MIT',
      size: 1400000,
      dependencies: [],
    },
    {
      name: 'new-pkg',
      installedVersion: '1.0.0',
      versionRange: '^1.0.0',
      license: 'MIT',
      size: 50000,
      dependencies: [],
    },
  ]

  describe('buildLockEntries', () => {
    it('应该正确构建 lock 条目', () => {
      const entries = buildLockEntries(mockDeps)
      expect(entries.length).toBe(2)
      expect(entries[0].name).toBe('lodash')
      expect(entries[1].name).toBe('react')
      entries.forEach((e) => {
        expect(e).toHaveProperty('version')
        expect(e).toHaveProperty('license')
        expect(e).toHaveProperty('size')
      })
    })
  })

  describe('diffLockEntries', () => {
    it('应该正确检测升级、降级、新增和移除', () => {
      const oldEntries = buildLockEntries(mockDeps)
      const newEntries = buildLockEntries(upgradedDeps)
      const { changes, stats } = diffLockEntries(oldEntries, newEntries)

      expect(stats.upgraded).toBe(1)
      expect(stats.downgraded).toBe(1)
      expect(stats.added).toBe(1)
      expect(stats.removed).toBe(0)

      const reactChange = changes.find((c) => c.name === 'react')
      expect(reactChange.type).toBe('upgraded')

      const lodashChange = changes.find((c) => c.name === 'lodash')
      expect(lodashChange.type).toBe('downgraded')

      const newChange = changes.find((c) => c.name === 'new-pkg')
      expect(newChange.type).toBe('added')
    })
  })
})

describe('格式化工具函数', () => {
  describe('formatSize', () => {
    it('应该正确格式化字节数', () => {
      expect(formatSize(500)).toBe('500 B')
      expect(formatSize(2048)).toBe('2.0 KB')
      expect(formatSize(1048576 * 2)).toBe('2.00 MB')
    })

    it('null/undefined 应该返回 0 B', () => {
      expect(formatSize(null)).toBe('0 B')
      expect(formatSize(undefined)).toBe('0 B')
    })
  })

  describe('formatDate', () => {
    it('应该正确格式化时间戳', () => {
      const result = formatDate(Date.now())
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })

    it('falsy 值应该返回 "-"', () => {
      expect(formatDate(null)).toBe('-')
      expect(formatDate(0)).toBe('-')
      expect(formatDate(undefined)).toBe('-')
    })
  })

  describe('generateOperationSummary', () => {
    it('空列表应该返回 "无变更"', () => {
      expect(generateOperationSummary([])).toBe('无变更')
      expect(generateOperationSummary(null)).toBe('无变更')
    })

    it('少于等于3个包应该显示全部名称', () => {
      const upgrades = [
        { name: 'react' },
        { name: 'vue' },
        { name: 'angular' },
      ]
      expect(generateOperationSummary(upgrades)).toBe('react, vue, angular')
    })

    it('超过3个包应该显示省略信息', () => {
      const upgrades = [
        { name: 'a' },
        { name: 'b' },
        { name: 'c' },
        { name: 'd' },
        { name: 'e' },
      ]
      expect(generateOperationSummary(upgrades)).toContain('等 5 个包')
    })
  })
})

describe('版本生成', () => {
  describe('generateLatestVersion', () => {
    it('应该生成比当前更高的版本号', () => {
      const current = '1.0.0'
      for (let i = 0; i < 20; i++) {
        const latest = generateLatestVersion(current)
        expect(compareVersions(latest, current)).toBeGreaterThan(0)
      }
    })
  })

  describe('calculateLatestVersion', () => {
    it('应该计算出更高的次版本号', () => {
      const current = '1.2.3'
      const latest = calculateLatestVersion(current)
      const parsedCurrent = parseVersion(current)
      const parsedLatest = parseVersion(latest)
      expect(parsedLatest.major).toBe(parsedCurrent.major)
      expect(parsedLatest.minor).toBeGreaterThanOrEqual(parsedCurrent.minor + 1)
    })
  })
})
