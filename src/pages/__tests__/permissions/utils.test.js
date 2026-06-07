import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  generateId,
  validateUser,
  validateRole,
  createUser,
  updateUser,
  deleteUser,
  ensureMinimumUsers,
  ensureMinimumRoles,
  createRole,
  updateRole,
  deleteRole,
  paginateList,
  searchUsers,
  searchRoles,
  getUserList,
  getRoleList,
  getAllLeafPermissionIds,
  getLeafIdsUnderNode,
  getChildIdsByParent,
  getParentId,
  getAllAncestorIds,
  isParentNode,
  togglePermission,
  getCheckState,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserRoleNames,
  formatDateTime,
  loadUsers,
  saveUsers,
  loadRoles,
  saveRoles,
  loadCurrentUserId,
  saveCurrentUserId,
} from '../../permissions/utils'
import {
  USERS_STORAGE_KEY,
  ROLES_STORAGE_KEY,
  CURRENT_USER_STORAGE_KEY,
  PERMISSION_TREE,
  MOCK_USERS,
  MOCK_ROLES,
} from '../../permissions/constants'

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

const makeValidUser = (overrides = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  roleIds: [],
  ...overrides,
})

const makeValidRole = (overrides = {}) => ({
  name: '测试角色',
  description: '测试描述',
  permissions: [],
  ...overrides,
})

describe('generateId', () => {
  it('生成的 ID 带自定义前缀', () => {
    expect(generateId('u')).toMatch(/^u_/)
    expect(generateId('r')).toMatch(/^r_/)
    expect(generateId()).toMatch(/^id_/)
  })

  it('生成的 ID 不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('validateUser', () => {
  it('验证通过时返回空对象', () => {
    const errors = validateUser(makeValidUser())
    expect(Object.keys(errors).length).toBe(0)
  })

  it('用户名为空时报错', () => {
    const errors = validateUser(makeValidUser({ username: '' }))
    expect(errors.username).toBeTruthy()
  })

  it('用户名全空格时报错', () => {
    const errors = validateUser(makeValidUser({ username: '   ' }))
    expect(errors.username).toBeTruthy()
  })

  it('用户名长度小于3报错', () => {
    const errors = validateUser(makeValidUser({ username: 'ab' }))
    expect(errors.username).toBeTruthy()
  })

  it('用户名长度超过20报错', () => {
    const errors = validateUser(makeValidUser({ username: 'a'.repeat(21) }))
    expect(errors.username).toBeTruthy()
  })

  it('用户名包含非法字符报错', () => {
    const errors = validateUser(makeValidUser({ username: 'test user' }))
    expect(errors.username).toBeTruthy()
  })

  it('用户名已存在报错', () => {
    const existing = [{ id: '1', username: 'testuser', email: 'other@example.com' }]
    const errors = validateUser(makeValidUser(), existing)
    expect(errors.username).toBeTruthy()
  })

  it('用户名已存在但排除自身ID不报错', () => {
    const existing = [{ id: '1', username: 'testuser', email: 'other@example.com' }]
    const errors = validateUser(makeValidUser(), existing, '1')
    expect(Object.keys(errors).length).toBe(0)
  })

  it('邮箱为空报错', () => {
    const errors = validateUser(makeValidUser({ email: '' }))
    expect(errors.email).toBeTruthy()
  })

  it('邮箱格式错误报错', () => {
    const errors = validateUser(makeValidUser({ email: 'invalid' }))
    expect(errors.email).toBeTruthy()
  })

  it('邮箱已存在报错', () => {
    const existing = [{ id: '1', username: 'other', email: 'test@example.com' }]
    const errors = validateUser(makeValidUser(), existing)
    expect(errors.email).toBeTruthy()
  })
})

describe('validateRole', () => {
  it('验证通过时返回空对象', () => {
    const errors = validateRole(makeValidRole())
    expect(Object.keys(errors).length).toBe(0)
  })

  it('角色名称为空时报错', () => {
    const errors = validateRole({ name: '' })
    expect(errors.name).toBeTruthy()
  })

  it('角色名称超过20字符报错', () => {
    const errors = validateRole({ name: 'a'.repeat(21) })
    expect(errors.name).toBeTruthy()
  })

  it('角色名称已存在报错', () => {
    const existing = [{ id: '1', name: '测试角色' }]
    const errors = validateRole(makeValidRole(), existing)
    expect(errors.name).toBeTruthy()
  })

  it('角色描述超过200字符报错', () => {
    const errors = validateRole({ name: '角色', description: 'a'.repeat(201) })
    expect(errors.description).toBeTruthy()
  })

  it('角色描述可选空允许空字符串', () => {
    const errors = validateRole({ name: '角色', description: '' })
    expect(errors.description).toBeFalsy()
  })
})

describe('createUser', () => {
  it('数据无效时返回失败', () => {
    const result = createUser([], { username: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeTruthy()
  })

  it('成功创建用户并返回新列表', () => {
    const data = makeValidUser()
    const result = createUser([], data)
    expect(result.success).toBe(true)
    expect(result.user.id).toBeTruthy()
    expect(result.user.username).toBe('testuser')
    expect(result.user.email).toBe('test@example.com')
    expect(result.user.createdAt).toBeTruthy()
    expect(result.users.length).toBe(1)
    expect(result.users[0]).toBe(result.user)
  })

  it('新用户放在列表最前面', () => {
    const existing = [{ id: 'old', username: 'olduser', email: 'old@test.com' }]
    const result = createUser(existing, makeValidUser())
    expect(result.users[0].id).toBe(result.user.id)
    expect(result.users[1].id).toBe('old')
  })
})

describe('updateUser', () => {
  it('用户不存在时返回失败', () => {
    const result = updateUser([], 'not-exist', makeValidUser())
    expect(result.success).toBe(false)
  })

  it('数据无效时返回失败', () => {
    const result = updateUser([{ id: '1' }], '1', { username: '' })
    expect(result.success).toBe(false)
  })

  it('成功更新用户信息', () => {
    const existing = [{ id: '1', username: 'old', email: 'old@test.com', roleIds: [] }]
    const result = updateUser(existing, '1', makeValidUser({ username: 'newuser' }))
    expect(result.success).toBe(true)
    expect(result.user.username).toBe('newuser')
    expect(result.users[0].username).toBe('newuser')
  })

  it('未传入 roleIds 时保留原 roleIds', () => {
    const existing = [{ id: '1', username: 'old', email: 'old@test.com', roleIds: ['r1'] }]
    const result = updateUser(existing, '1', { username: 'new', email: 'new@test.com' })
    expect(result.user.roleIds).toEqual(['r1'])
  })
})

describe('deleteUser', () => {
  it('用户不存在时返回失败', () => {
    const result = deleteUser([], 'not-exist')
    expect(result.success).toBe(false)
    expect(result.users.length).toBe(0)
  })

  it('成功删除用户', () => {
    const existing = [
      { id: '1', username: 'u1' },
      { id: '2', username: 'u2' },
    ]
    const result = deleteUser(existing, '1')
    expect(result.success).toBe(true)
    expect(result.users.length).toBe(1)
    expect(result.users[0].id).toBe('2')
  })
})

describe('ensureMinimumUsers', () => {
  it('用户列表非空时不做修改', () => {
    const users = [{ id: 'u1', username: 'test' }]
    const result = ensureMinimumUsers(users)
    expect(result.reset).toBe(false)
    expect(result.users).toBe(users)
  })

  it('用户列表为空时返回默认 mock 数据', () => {
    const result = ensureMinimumUsers([])
    expect(result.reset).toBe(true)
    expect(result.users.length).toBeGreaterThan(0)
    expect(result.users[0].username).toBeTruthy()
  })

  it('用户列表为 undefined 时返回默认 mock 数据', () => {
    const result = ensureMinimumUsers(undefined)
    expect(result.reset).toBe(true)
    expect(result.users.length).toBeGreaterThan(0)
  })
})

describe('ensureMinimumRoles', () => {
  it('角色列表非空时不做修改', () => {
    const roles = [{ id: 'r1', name: 'test' }]
    const result = ensureMinimumRoles(roles)
    expect(result.reset).toBe(false)
    expect(result.roles).toBe(roles)
  })

  it('角色列表为空时返回默认 mock 数据', () => {
    const result = ensureMinimumRoles([])
    expect(result.reset).toBe(true)
    expect(result.roles.length).toBeGreaterThan(0)
  })
})

describe('createRole', () => {
  it('数据无效时返回失败', () => {
    const result = createRole([], { name: '' })
    expect(result.success).toBe(false)
  })

  it('成功创建角色', () => {
    const result = createRole([], makeValidRole())
    expect(result.success).toBe(true)
    expect(result.role.id).toMatch(/^r_/)
    expect(result.role.name).toBe('测试角色')
    expect(result.role.createdAt).toBeTruthy()
  })
})

describe('updateRole', () => {
  it('角色不存在时返回失败', () => {
    const result = updateRole([], 'not-exist', makeValidRole())
    expect(result.success).toBe(false)
  })

  it('成功更新角色', () => {
    const existing = [{ id: '1', name: 'old', description: '', permissions: [] }]
    const result = updateRole(existing, '1', makeValidRole({ name: '新名称' }))
    expect(result.success).toBe(true)
    expect(result.role.name).toBe('新名称')
  })
})

describe('deleteRole', () => {
  it('角色不存在时返回失败', () => {
    const result = deleteRole([], 'not-exist', [])
    expect(result.success).toBe(false)
  })

  it('成功删除角色并从用户中移除', () => {
    const roles = [{ id: 'r1' }, { id: 'r2' }]
    const users = [
      { id: 'u1', roleIds: ['r1', 'r2'] },
      { id: 'u2', roleIds: ['r1'] },
    ]
    const result = deleteRole(roles, 'r1', users)
    expect(result.success).toBe(true)
    expect(result.roles.length).toBe(1)
    expect(result.roles[0].id).toBe('r2')
    expect(result.users[0].roleIds).toEqual(['r2'])
    expect(result.users[1].roleIds).toEqual([])
  })
})

describe('paginateList', () => {
  const list = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }))

  it('第一页正确', () => {
    const result = paginateList(list, 1, 10)
    expect(result.items.length).toBe(10)
    expect(result.items[0].id).toBe('1')
    expect(result.currentPage).toBe(1)
    expect(result.totalPage).toBe(3)
    expect(result.total).toBe(25)
  })

  it('最后一页正确', () => {
    const result = paginateList(list, 3, 10)
    expect(result.items.length).toBe(5)
  })

  it('页码超出范围时修正', () => {
    const result = paginateList(list, 100, 10)
    expect(result.currentPage).toBe(3)
  })

  it('空列表返回第一页', () => {
    const result = paginateList([], 1, 10)
    expect(result.items.length).toBe(0)
    expect(result.totalPage).toBe(1)
  })
})

describe('searchUsers', () => {
  const users = [
    { username: 'zhangsan', email: 'zhang@test.com' },
    { username: 'lisi', email: 'lisi@example.com' },
    { username: 'wangwu', email: 'wang@test.com' },
  ]

  it('空关键词返回全部', () => {
    expect(searchUsers(users, '').length).toBe(3)
  })

  it('按用户名搜索', () => {
    const result = searchUsers(users, 'zhang')
    expect(result.length).toBe(1)
    expect(result[0].username).toBe('zhangsan')
  })

  it('按邮箱搜索', () => {
    const result = searchUsers(users, 'example')
    expect(result.length).toBe(1)
  })

  it('搜索不区分大小写', () => {
    const result = searchUsers(users, 'ZHANG')
    expect(result.length).toBe(1)
  })
})

describe('searchRoles', () => {
  const roles = [
    { name: '管理员', description: '系统管理员角色' },
    { name: '普通用户', description: '普通用户角色' },
    { name: '访客', description: '临时访客' },
  ]

  it('空关键词返回全部', () => {
    expect(searchRoles(roles, '').length).toBe(3)
  })

  it('按名称搜索', () => {
    const result = searchRoles(roles, '管理员')
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('管理员')
  })

  it('按描述搜索', () => {
    const result = searchRoles(roles, '普通')
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('普通用户')
  })
})

describe('getUserList', () => {
  const users = [
    { id: '1', username: 'user1', email: 'u1@test.com' },
    { id: '2', username: 'admin', email: 'admin@test.com' },
    { id: '3', username: 'user2', email: 'u2@test.com' },
  ]

  it('组合搜索和分页', () => {
    const result = getUserList(users, { keyword: 'user', page: 1, pageSize: 10 })
    expect(result.items.length).toBe(2)
  })

  it('无选项时返回全部', () => {
    const result = getUserList(users, {})
    expect(result.items.length).toBe(3)
  })
})

describe('getRoleList', () => {
  const roles = [
    { id: '1', name: '管理员' },
    { id: '2', name: '用户' },
  ]

  it('返回分页', () => {
    const result = getRoleList(roles, { page: 1, pageSize: 1 })
    expect(result.items.length).toBe(1)
    expect(result.total).toBe(2)
  })
})

describe('权限树工具函数', () => {
  describe('getAllLeafPermissionIds', () => {
    it('获取所有叶子节点权限 ID', () => {
      const ids = getAllLeafPermissionIds(PERMISSION_TREE)
      expect(ids.length).toBeGreaterThan(0)
      expect(ids).toContain('user:view')
      expect(ids).toContain('user:edit')
      expect(ids).not.toContain('user-management')
    })
  })

  describe('getLeafIdsUnderNode', () => {
    it('获取父节点下所有叶子节点', () => {
      const ids = getLeafIdsUnderNode('user-management', PERMISSION_TREE)
      expect(ids).toEqual(expect.arrayContaining(['user:view', 'user:edit', 'user:delete']))
      expect(ids).not.toContain('user-management')
      expect(ids.length).toBe(3)
    })

    it('叶子节点返回自身', () => {
      const ids = getLeafIdsUnderNode('user:view', PERMISSION_TREE)
      expect(ids).toEqual(['user:view'])
    })

    it('不存在的节点返回空数组', () => {
      const ids = getLeafIdsUnderNode('not-exist', PERMISSION_TREE)
      expect(ids).toEqual([])
    })
  })

  describe('getChildIdsByParent', () => {
    it('获取父节点的子节点 ID', () => {
      const childIds = getChildIdsByParent('user-management', PERMISSION_TREE)
      expect(childIds).toContain('user:view')
      expect(childIds).toContain('user:edit')
      expect(childIds).toContain('user:delete')
    })

    it('不存在的父节点返回 null', () => {
      expect(getChildIdsByParent('not-exist', PERMISSION_TREE)).toBe(null)
    })
  })

  describe('getParentId', () => {
    it('获取子节点的父节点 ID', () => {
      expect(getParentId('user:view', PERMISSION_TREE)).toBe('user-management')
    })

    it('根节点没有父节点', () => {
      expect(getParentId('user-management', PERMISSION_TREE)).toBe(null)
    })
  })

  describe('getAllAncestorIds', () => {
    it('获取所有祖先节点', () => {
      const ancestors = getAllAncestorIds('user:view', PERMISSION_TREE)
      expect(ancestors).toEqual(['user-management'])
    })
  })

  describe('isParentNode', () => {
    it('判断是否为父节点', () => {
      expect(isParentNode('user-management', PERMISSION_TREE)).toBe(true)
      expect(isParentNode('user:view', PERMISSION_TREE)).toBe(false)
    })
  })
})

describe('togglePermission', () => {
  it('勾选父节点时同步勾选所有子节点（仅叶子节点）', () => {
    const result = togglePermission([], 'user-management', PERMISSION_TREE)
    expect(result).not.toContain('user-management')
    expect(result).toContain('user:view')
    expect(result).toContain('user:edit')
    expect(result).toContain('user:delete')
    expect(result.length).toBe(3)
  })

  it('取消父节点时同步取消所有子节点', () => {
    const checked = ['user:view', 'user:edit', 'user:delete']
    const result = togglePermission(checked, 'user-management', PERMISSION_TREE)
    expect(result).not.toContain('user-management')
    expect(result).not.toContain('user:view')
    expect(result.length).toBe(0)
  })

  it('勾选单个子节点时仅该叶子节点加入', () => {
    const result = togglePermission([], 'user:view', PERMISSION_TREE)
    expect(result).toEqual(['user:view'])
    expect(result).not.toContain('user-management')
  })

  it('取消单个子节点时仅移除该叶子节点', () => {
    const checked = ['user:view', 'user:edit', 'user:delete']
    const result = togglePermission(checked, 'user:view', PERMISSION_TREE)
    expect(result).toEqual(expect.arrayContaining(['user:edit', 'user:delete']))
    expect(result).not.toContain('user:view')
    expect(result).not.toContain('user-management')
  })

  it('输入包含父节点ID时会被过滤掉只保留叶子节点', () => {
    const checkedWithParent = ['user-management', 'user:view', 'role-management']
    const result = togglePermission(checkedWithParent, 'user:edit', PERMISSION_TREE)
    expect(result).not.toContain('user-management')
    expect(result).not.toContain('role-management')
    expect(result).toContain('user:view')
    expect(result).toContain('user:edit')
  })

  it('部分勾选子节点后 getCheckState 返回 indeterminate', () => {
    const checked = togglePermission([], 'user:view', PERMISSION_TREE)
    const state = getCheckState('user-management', checked, PERMISSION_TREE)
    expect(state).toBe('indeterminate')
  })

  it('所有子节点都勾选时 getCheckState 返回 checked', () => {
    let checked = togglePermission([], 'user:view', PERMISSION_TREE)
    checked = togglePermission(checked, 'user:edit', PERMISSION_TREE)
    checked = togglePermission(checked, 'user:delete', PERMISSION_TREE)
    expect(checked.length).toBe(3)
    expect(checked).not.toContain('user-management')
    const state = getCheckState('user-management', checked, PERMISSION_TREE)
    expect(state).toBe('checked')
  })
})

describe('getCheckState', () => {
  it('叶子节点未勾选返回 unchecked', () => {
    expect(getCheckState('user:view', [], PERMISSION_TREE)).toBe('unchecked')
  })

  it('叶子节点勾选返回 checked', () => {
    expect(getCheckState('user:view', ['user:view'], PERMISSION_TREE)).toBe('checked')
  })

  it('父节点部分子节点勾选返回 indeterminate', () => {
    expect(getCheckState('user-management', ['user:view'], PERMISSION_TREE)).toBe('indeterminate')
  })

  it('父节点全部子节点勾选返回 checked', () => {
    const all = ['user:view', 'user:edit', 'user:delete']
    expect(getCheckState('user-management', all, PERMISSION_TREE)).toBe('checked')
  })

  it('父节点无子节点勾选返回 unchecked', () => {
    expect(getCheckState('user-management', [], PERMISSION_TREE)).toBe('unchecked')
  })
})

describe('权限校验函数', () => {
  const users = [
    { id: 'u1', roleIds: ['r1', 'r2'] },
    { id: 'u2', roleIds: ['r2'] },
    { id: 'u3', roleIds: [] },
  ]
  const roles = [
    { id: 'r1', permissions: ['user:view', 'user:edit'] },
    { id: 'r2', permissions: ['role:view'] },
  ]

  describe('getUserPermissions', () => {
    it('获取用户所有权限（合并多角色去重）', () => {
      const perms = getUserPermissions('u1', users, roles)
      expect(perms).toContain('user:view')
      expect(perms).toContain('user:edit')
      expect(perms).toContain('role:view')
      expect(perms.length).toBe(3)
    })

    it('用户不存在返回空数组', () => {
      expect(getUserPermissions('not-exist', users, roles)).toEqual([])
    })

    it('用户无角色返回空数组', () => {
      expect(getUserPermissions('u3', users, roles)).toEqual([])
    })
  })

  describe('hasPermission', () => {
    it('用户有权限返回 true', () => {
      expect(hasPermission('u1', 'user:view', users, roles)).toBe(true)
    })

    it('用户无权限返回 false', () => {
      expect(hasPermission('u2', 'user:edit', users, roles)).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('有任一权限返回 true', () => {
      expect(hasAnyPermission('u1', ['user:edit', 'role:delete'], users, roles)).toBe(true)
    })

    it('所有权限都没有返回 false', () => {
      expect(hasAnyPermission('u2', ['user:edit', 'role:delete'], users, roles)).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('拥有所有权限返回 true', () => {
      expect(hasAllPermissions('u1', ['user:view', 'role:view'], users, roles)).toBe(true)
    })

    it('缺少任一权限返回 false', () => {
      expect(hasAllPermissions('u1', ['user:view', 'role:delete'], users, roles)).toBe(false)
    })
  })
})

describe('getUserRoleNames', () => {
  const user = { roleIds: ['r1', 'r2'] }
  const roles = [
    { id: 'r1', name: '管理员' },
    { id: 'r2', name: '用户' },
  ]

  it('获取用户角色名称列表', () => {
    const names = getUserRoleNames(user, roles)
    expect(names).toEqual(['管理员', '用户'])
  })

  it('过滤不存在的角色', () => {
    const u = { roleIds: ['r1', 'r3'] }
    const names = getUserRoleNames(u, roles)
    expect(names).toEqual(['管理员'])
  })

  it('空角色列表', () => {
    const u = { roleIds: [] }
    expect(getUserRoleNames(u, roles)).toEqual([])
  })
})

describe('formatDateTime', () => {
  it('格式化时间戳', () => {
    const ts = new Date('2024-01-15T10:30:00').getTime()
    const result = formatDateTime(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('10:30')
  })
})

describe('localStorage 操作', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saveUsers 保存到 localStorage', () => {
    const users = [{ id: '1', username: 'test' }]
    const result = saveUsers(users)
    expect(result).toBe(true)
    expect(localStorage.getItem(USERS_STORAGE_KEY)).toBe(JSON.stringify(users))
  })

  it('loadUsers 从 localStorage 读取', () => {
    const users = [{ id: '1', username: 'test' }]
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    const result = loadUsers()
    expect(result).toEqual(users)
  })

  it('loadUsers localStorage 为空时返回 mock 数据', () => {
    const result = loadUsers()
    expect(result.length).toBe(MOCK_USERS.length)
  })

  it('saveRoles 保存到 localStorage', () => {
    const roles = [{ id: '1', name: 'test' }]
    const result = saveRoles(roles)
    expect(result).toBe(true)
    expect(localStorage.getItem(ROLES_STORAGE_KEY)).toBe(JSON.stringify(roles))
  })

  it('loadRoles 从 localStorage 读取', () => {
    const roles = [{ id: '1', name: 'test' }]
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles))
    const result = loadRoles()
    expect(result).toEqual(roles)
  })

  it('loadRoles localStorage 为空时返回 mock 数据', () => {
    const result = loadRoles()
    expect(result.length).toBe(MOCK_ROLES.length)
  })

  it('saveCurrentUserId 保存当前用户', () => {
    const result = saveCurrentUserId('u1')
    expect(result).toBe(true)
    expect(localStorage.getItem(CURRENT_USER_STORAGE_KEY)).toBe('u1')
  })

  it('loadCurrentUserId 读取当前用户', () => {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, 'u_test')
    expect(loadCurrentUserId()).toBe('u_test')
  })
})
