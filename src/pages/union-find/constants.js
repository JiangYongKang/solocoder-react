export const NODE_RADIUS = 32
export const NODE_DIAMETER = NODE_RADIUS * 2
export const HORIZONTAL_GAP = 80
export const VERTICAL_GAP = 100
export const TREE_HORIZONTAL_GAP = 160
export const MIN_ZOOM = 0.3
export const MAX_ZOOM = 3
export const DEFAULT_ZOOM = 1

export const COLORS = {
  node: '#6366f1',
  nodeStroke: '#4f46e5',
  root: '#10b981',
  rootStroke: '#059669',
  highlight: '#fbbf24',
  highlightStroke: '#f59e0b',
  findPath: '#3b82f6',
  pathCompress: '#22c55e',
  edge: '#94a3b8',
  text: '#ffffff',
  grid: '#e2e8f0',
}

export const ANIMATION_DURATION = {
  highlight: 400,
  union: 600,
  findStep: 300,
  pathCompress: 500,
}

export const OPERATION_TYPE = {
  ADD_NODE: 'ADD_NODE',
  UNION: 'UNION',
  FIND: 'FIND',
}

export const OPERATION_TYPE_LABEL = {
  [OPERATION_TYPE.ADD_NODE]: '添加节点',
  [OPERATION_TYPE.UNION]: '合并',
  [OPERATION_TYPE.FIND]: '查找',
}
