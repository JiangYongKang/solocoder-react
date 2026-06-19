export const STORAGE_KEY = 'solocoder-org-chart-data'

export const NODE_TYPES = {
  DEPARTMENT: 'department',
  POSITION: 'position',
  PERSON: 'person',
}

export const NODE_TYPE_LABELS = {
  [NODE_TYPES.DEPARTMENT]: '部门',
  [NODE_TYPES.POSITION]: '职位',
  [NODE_TYPES.PERSON]: '人员',
}

export const NODE_TYPE_ICONS = {
  [NODE_TYPES.DEPARTMENT]: '🏢',
  [NODE_TYPES.POSITION]: '💼',
  [NODE_TYPES.PERSON]: '👤',
}

export const NODE_TYPE_COLORS = {
  [NODE_TYPES.DEPARTMENT]: {
    bg: '#E3F2FD',
    border: '#1976D2',
    text: '#0D47A1',
  },
  [NODE_TYPES.POSITION]: {
    bg: '#FFF3E0',
    border: '#F57C00',
    text: '#E65100',
  },
  [NODE_TYPES.PERSON]: {
    bg: '#E8F5E9',
    border: '#388E3C',
    text: '#1B5E20',
  },
}

export const LAYOUT_DIRECTIONS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
}

export const LAYOUT_LABELS = {
  [LAYOUT_DIRECTIONS.HORIZONTAL]: '横向布局',
  [LAYOUT_DIRECTIONS.VERTICAL]: '纵向布局',
}

export const NODE_WIDTH = 160
export const NODE_HEIGHT = 70
export const HORIZONTAL_GAP = 80
export const VERTICAL_GAP = 50
export const SIBLING_GAP = 30

export const MIN_ZOOM = 0.3
export const MAX_ZOOM = 2.0
export const DEFAULT_ZOOM = 1.0
export const ZOOM_STEP = 0.1

export function getDefaultData() {
  const now = Date.now()
  return {
    root: {
      id: 'org-root',
      type: NODE_TYPES.DEPARTMENT,
      name: 'Goleta科技有限公司',
      email: '',
      phone: '',
      createdAt: now,
      updatedAt: now,
      children: [
        {
          id: 'dept-tech',
          type: NODE_TYPES.DEPARTMENT,
          name: '技术部',
          email: '',
          phone: '',
          createdAt: now,
          updatedAt: now,
          children: [
            {
              id: 'pos-tech-director',
              type: NODE_TYPES.POSITION,
              name: '技术总监',
              email: '',
              phone: '',
              createdAt: now,
              updatedAt: now,
              children: [
                {
                  id: 'person-zhang',
                  type: NODE_TYPES.PERSON,
                  name: '张伟',
                  email: 'zhangwei@goleta.com',
                  phone: '13800000001',
                  createdAt: now,
                  updatedAt: now,
                  children: [],
                },
              ],
            },
            {
              id: 'dept-fe',
              type: NODE_TYPES.DEPARTMENT,
              name: '前端组',
              email: '',
              phone: '',
              createdAt: now,
              updatedAt: now,
              children: [
                {
                  id: 'pos-fe-lead',
                  type: NODE_TYPES.POSITION,
                  name: '前端组长',
                  email: '',
                  phone: '',
                  createdAt: now,
                  updatedAt: now,
                  children: [
                    {
                      id: 'person-li',
                      type: NODE_TYPES.PERSON,
                      name: '李娜',
                      email: 'lina@goleta.com',
                      phone: '13800000002',
                      createdAt: now,
                      updatedAt: now,
                      children: [],
                    },
                  ],
                },
                {
                  id: 'pos-fe-engineer',
                  type: NODE_TYPES.POSITION,
                  name: '前端工程师',
                  email: '',
                  phone: '',
                  createdAt: now,
                  updatedAt: now,
                  children: [
                    {
                      id: 'person-wang',
                      type: NODE_TYPES.PERSON,
                      name: '王磊',
                      email: 'wanglei@goleta.com',
                      phone: '13800000003',
                      createdAt: now,
                      updatedAt: now,
                      children: [],
                    },
                    {
                      id: 'person-chen',
                      type: NODE_TYPES.PERSON,
                      name: '陈芳',
                      email: 'chenfang@goleta.com',
                      phone: '13800000004',
                      createdAt: now,
                      updatedAt: now,
                      children: [],
                    },
                  ],
                },
              ],
            },
            {
              id: 'dept-be',
              type: NODE_TYPES.DEPARTMENT,
              name: '后端组',
              email: '',
              phone: '',
              createdAt: now,
              updatedAt: now,
              children: [
                {
                  id: 'pos-be-engineer',
                  type: NODE_TYPES.POSITION,
                  name: '后端工程师',
                  email: '',
                  phone: '',
                  createdAt: now,
                  updatedAt: now,
                  children: [
                    {
                      id: 'person-liu',
                      type: NODE_TYPES.PERSON,
                      name: '刘强',
                      email: 'liuqiang@goleta.com',
                      phone: '13800000005',
                      createdAt: now,
                      updatedAt: now,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'dept-product',
          type: NODE_TYPES.DEPARTMENT,
          name: '产品部',
          email: '',
          phone: '',
          createdAt: now,
          updatedAt: now,
          children: [
            {
              id: 'pos-pm',
              type: NODE_TYPES.POSITION,
              name: '产品经理',
              email: '',
              phone: '',
              createdAt: now,
              updatedAt: now,
              children: [
                {
                  id: 'person-zhao',
                  type: NODE_TYPES.PERSON,
                  name: '赵敏',
                  email: 'zhaomin@goleta.com',
                  phone: '13800000006',
                  createdAt: now,
                  updatedAt: now,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
    version: 1,
  }
}

export function generateId(prefix = 'node') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
