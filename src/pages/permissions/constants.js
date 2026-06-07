export const USERS_STORAGE_KEY = 'permissions_users'
export const ROLES_STORAGE_KEY = 'permissions_roles'
export const CURRENT_USER_STORAGE_KEY = 'permissions_current_user'

export const PAGE_SIZE = 5

export const PERMISSION_TREE = [
  {
    id: 'user-management',
    label: '用户管理',
    children: [
      { id: 'user:view', label: '查看' },
      { id: 'user:edit', label: '编辑' },
      { id: 'user:delete', label: '删除' },
    ],
  },
  {
    id: 'role-management',
    label: '角色管理',
    children: [
      { id: 'role:view', label: '查看' },
      { id: 'role:edit', label: '编辑' },
      { id: 'role:delete', label: '删除' },
    ],
  },
  {
    id: 'permission-management',
    label: '权限管理',
    children: [
      { id: 'permission:view', label: '查看' },
      { id: 'permission:assign', label: '分配' },
    ],
  },
  {
    id: 'system-settings',
    label: '系统设置',
    children: [
      { id: 'settings:view', label: '查看' },
      { id: 'settings:edit', label: '编辑' },
    ],
  },
]

export const MOCK_ROLES = [
  {
    id: 'r_admin',
    name: '超级管理员',
    description: '拥有系统所有权限',
    permissions: [
      'user:view', 'user:edit', 'user:delete',
      'role:view', 'role:edit', 'role:delete',
      'permission:view', 'permission:assign',
      'settings:view', 'settings:edit',
    ],
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'r_manager',
    name: '部门经理',
    description: '可管理用户和查看角色',
    permissions: [
      'user:view', 'user:edit',
      'role:view',
      'permission:view',
    ],
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'r_user',
    name: '普通用户',
    description: '仅可查看基础信息',
    permissions: [
      'user:view',
      'role:view',
    ],
    createdAt: Date.now() - 86400000 * 10,
  },
]

export const MOCK_USERS = [
  {
    id: 'u_admin',
    username: 'admin',
    email: 'admin@example.com',
    roleIds: ['r_admin'],
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'u_manager1',
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    roleIds: ['r_manager'],
    createdAt: Date.now() - 86400000 * 25,
  },
  {
    id: 'u_user1',
    username: 'lisi',
    email: 'lisi@example.com',
    roleIds: ['r_user'],
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'u_user2',
    username: 'wangwu',
    email: 'wangwu@example.com',
    roleIds: ['r_user'],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'u_mixed',
    username: 'zhaoliu',
    email: 'zhaoliu@example.com',
    roleIds: ['r_manager', 'r_user'],
    createdAt: Date.now() - 86400000 * 2,
  },
]

export const MOCK_CURRENT_USER = 'u_admin'
