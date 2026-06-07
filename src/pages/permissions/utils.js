import {
  USERS_STORAGE_KEY,
  ROLES_STORAGE_KEY,
  CURRENT_USER_STORAGE_KEY,
  MOCK_USERS,
  MOCK_ROLES,
  MOCK_CURRENT_USER,
  PAGE_SIZE,
  PERMISSION_TREE,
} from './constants'

export function generateId(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return [...MOCK_USERS]
}

export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    return true
  } catch {
    return false
  }
}

export function loadRoles() {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return [...MOCK_ROLES]
}

export function saveRoles(roles) {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles))
    return true
  } catch {
    return false
  }
}

export function loadCurrentUserId() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY)
    if (raw) {
      return raw
    }
  } catch {
    // ignore
  }
  return MOCK_CURRENT_USER
}

export function saveCurrentUserId(userId) {
  try {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId)
    return true
  } catch {
    return false
  }
}

export function validateUser(data, existingUsers = [], excludeId = null) {
  const errors = {}
  if (!data.username || data.username.trim().length === 0) {
    errors.username = '用户名不能为空'
  } else if (data.username.trim().length < 3 || data.username.trim().length > 20) {
    errors.username = '用户名长度应为 3-20 个字符'
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim())) {
    errors.username = '用户名只能包含字母、数字和下划线'
  } else {
    const duplicate = existingUsers.some(
      (u) => u.username === data.username.trim() && u.id !== excludeId
    )
    if (duplicate) {
      errors.username = '用户名已存在'
    }
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.email = '邮箱不能为空'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = '邮箱格式不正确'
  } else {
    const duplicate = existingUsers.some(
      (u) => u.email === data.email.trim() && u.id !== excludeId
    )
    if (duplicate) {
      errors.email = '邮箱已被使用'
    }
  }

  return errors
}

export function validateRole(data, existingRoles = [], excludeId = null) {
  const errors = {}
  if (!data.name || data.name.trim().length === 0) {
    errors.name = '角色名称不能为空'
  } else if (data.name.trim().length > 20) {
    errors.name = '角色名称不能超过 20 个字符'
  } else {
    const duplicate = existingRoles.some(
      (r) => r.name === data.name.trim() && r.id !== excludeId
    )
    if (duplicate) {
      errors.name = '角色名称已存在'
    }
  }
  if (data.description && data.description.length > 200) {
    errors.description = '角色描述不能超过 200 个字符'
  }
  return errors
}

export function createUser(users, data) {
  const errors = validateUser(data, users)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const newUser = {
    id: generateId('u'),
    username: data.username.trim(),
    email: data.email.trim(),
    roleIds: data.roleIds || [],
    createdAt: Date.now(),
  }
  return { success: true, user: newUser, users: [newUser, ...users] }
}

export function updateUser(users, id, data) {
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '用户不存在' } }
  }
  const errors = validateUser(data, users, id)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const updated = [...users]
  updated[index] = {
    ...updated[index],
    username: data.username.trim(),
    email: data.email.trim(),
    roleIds: data.roleIds !== undefined ? data.roleIds : updated[index].roleIds,
  }
  return { success: true, user: updated[index], users: updated }
}

export function deleteUser(users, id) {
  const exists = users.some((u) => u.id === id)
  if (!exists) {
    return { success: false, users }
  }
  return { success: true, users: users.filter((u) => u.id !== id) }
}

export function assignUserRoles(users, userId, roleIds) {
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) {
    return { success: false, users }
  }
  const updated = [...users]
  updated[index] = { ...updated[index], roleIds }
  return { success: true, user: updated[index], users: updated }
}

export function createRole(roles, data) {
  const errors = validateRole(data, roles)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const newRole = {
    id: generateId('r'),
    name: data.name.trim(),
    description: (data.description || '').trim(),
    permissions: data.permissions || [],
    createdAt: Date.now(),
  }
  return { success: true, role: newRole, roles: [newRole, ...roles] }
}

export function updateRole(roles, id, data) {
  const index = roles.findIndex((r) => r.id === id)
  if (index === -1) {
    return { success: false, errors: { id: '角色不存在' } }
  }
  const errors = validateRole(data, roles, id)
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }
  const updated = [...roles]
  updated[index] = {
    ...updated[index],
    name: data.name.trim(),
    description: (data.description || '').trim(),
    permissions: data.permissions !== undefined ? data.permissions : updated[index].permissions,
  }
  return { success: true, role: updated[index], roles: updated }
}

export function deleteRole(roles, id, users) {
  const exists = roles.some((r) => r.id === id)
  if (!exists) {
    return { success: false, roles, users }
  }
  const updatedRoles = roles.filter((r) => r.id !== id)
  const updatedUsers = users.map((u) => ({
    ...u,
    roleIds: u.roleIds.filter((rid) => rid !== id),
  }))
  return { success: true, roles: updatedRoles, users: updatedUsers }
}

export function paginateList(list, page, pageSize = PAGE_SIZE) {
  const totalPage = Math.max(1, Math.ceil(list.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPage)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return {
    items: list.slice(start, end),
    total: list.length,
    totalPage,
    currentPage,
    pageSize,
  }
}

export function searchUsers(users, keyword) {
  if (!keyword || keyword.trim().length === 0) {
    return users
  }
  const kw = keyword.trim().toLowerCase()
  return users.filter(
    (u) =>
      u.username.toLowerCase().includes(kw) ||
      u.email.toLowerCase().includes(kw)
  )
}

export function searchRoles(roles, keyword) {
  if (!keyword || keyword.trim().length === 0) {
    return roles
  }
  const kw = keyword.trim().toLowerCase()
  return roles.filter(
    (r) =>
      r.name.toLowerCase().includes(kw) ||
      (r.description && r.description.toLowerCase().includes(kw))
  )
}

export function getUserList(users, options = {}) {
  let result = [...users]
  result = searchUsers(result, options.keyword)
  return paginateList(result, options.page || 1, options.pageSize)
}

export function getRoleList(roles, options = {}) {
  let result = [...roles]
  result = searchRoles(result, options.keyword)
  return paginateList(result, options.page || 1, options.pageSize)
}

export function getAllLeafPermissionIds(tree = PERMISSION_TREE) {
  const ids = []
  function walk(nodes) {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        walk(node.children)
      } else {
        ids.push(node.id)
      }
    }
  }
  walk(tree)
  return ids
}

export function getChildIdsByParent(parentId, tree = PERMISSION_TREE) {
  for (const node of tree) {
    if (node.id === parentId) {
      return (node.children || []).map((c) => c.id)
    }
    if (node.children) {
      const found = getChildIdsByParent(parentId, node.children)
      if (found) return found
    }
  }
  return null
}

export function getParentId(childId, tree = PERMISSION_TREE, parent = null) {
  for (const node of tree) {
    if (node.id === childId) {
      return parent ? parent.id : null
    }
    if (node.children) {
      const found = getParentId(childId, node.children, node)
      if (found !== undefined) return found
    }
  }
  return undefined
}

export function getAllAncestorIds(nodeId, tree = PERMISSION_TREE) {
  const ancestors = []
  function walk(nodes, path = []) {
    for (const node of nodes) {
      if (node.id === nodeId) {
        ancestors.push(...path.map((p) => p.id))
        return true
      }
      if (node.children) {
        if (walk(node.children, [...path, node])) {
          return true
        }
      }
    }
    return false
  }
  walk(tree)
  return ancestors
}

export function isParentNode(nodeId, tree = PERMISSION_TREE) {
  for (const node of tree) {
    if (node.id === nodeId) {
      return !!(node.children && node.children.length > 0)
    }
    if (node.children) {
      if (isParentNode(nodeId, node.children)) return true
    }
  }
  return false
}

export function togglePermission(checkedIds, targetId, tree = PERMISSION_TREE) {
  const checkedSet = new Set(checkedIds)
  const isParent = isParentNode(targetId, tree)

  if (isParent) {
    const childIds = getChildIdsByParent(targetId, tree) || []
    if (checkedSet.has(targetId)) {
      checkedSet.delete(targetId)
      childIds.forEach((cid) => checkedSet.delete(cid))
    } else {
      checkedSet.add(targetId)
      childIds.forEach((cid) => checkedSet.add(cid))
    }
  } else {
    if (checkedSet.has(targetId)) {
      checkedSet.delete(targetId)
    } else {
      checkedSet.add(targetId)
    }
  }

  const parentGroups = {}
  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      parentGroups[node.id] = node.children.map((c) => c.id)
    }
  }

  let changed = true
  while (changed) {
    changed = false
    for (const [parentId, childIds] of Object.entries(parentGroups)) {
      const allChecked = childIds.every((cid) => checkedSet.has(cid))
      const someChecked = childIds.some((cid) => checkedSet.has(cid))
      const wasChecked = checkedSet.has(parentId)

      if (allChecked && !wasChecked) {
        checkedSet.add(parentId)
        changed = true
      } else if (!someChecked && wasChecked) {
        checkedSet.delete(parentId)
        changed = true
      } else if (someChecked && !allChecked && !wasChecked) {
        checkedSet.add(parentId)
        changed = true
      }
    }
  }

  return Array.from(checkedSet)
}

export function getCheckState(nodeId, checkedIds, tree = PERMISSION_TREE) {
  const checkedSet = new Set(checkedIds)
  const isParent = isParentNode(nodeId, tree)

  if (!isParent) {
    return checkedSet.has(nodeId) ? 'checked' : 'unchecked'
  }

  const childIds = getChildIdsByParent(nodeId, tree) || []
  const allChecked = childIds.every((cid) => checkedSet.has(cid))
  const someChecked = childIds.some((cid) => checkedSet.has(cid))

  if (allChecked) return 'checked'
  if (someChecked) return 'indeterminate'
  return 'unchecked'
}

export function getUserPermissions(userId, users, roles) {
  const user = users.find((u) => u.id === userId)
  if (!user) return []
  const permissionSet = new Set()
  for (const roleId of user.roleIds) {
    const role = roles.find((r) => r.id === roleId)
    if (role) {
      for (const perm of role.permissions) {
        permissionSet.add(perm)
      }
    }
  }
  return Array.from(permissionSet)
}

export function hasPermission(userId, permissionId, users, roles) {
  const perms = getUserPermissions(userId, users, roles)
  return perms.includes(permissionId)
}

export function hasAnyPermission(userId, permissionIds, users, roles) {
  const perms = getUserPermissions(userId, users, roles)
  return permissionIds.some((p) => perms.includes(p))
}

export function hasAllPermissions(userId, permissionIds, users, roles) {
  const perms = getUserPermissions(userId, users, roles)
  return permissionIds.every((p) => perms.includes(p))
}

export function getUserRoleNames(user, roles) {
  return (user.roleIds || [])
    .map((rid) => {
      const r = roles.find((role) => role.id === rid)
      return r ? r.name : null
    })
    .filter(Boolean)
}

export function formatDateTime(timestamp) {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}
