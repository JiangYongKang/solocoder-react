export const TAB_TYPE = {
  DEPENDENCIES: 'dependencies',
  DEV_DEPENDENCIES: 'devDependencies',
}

export const VIEW_MODE = {
  TREE: 'tree',
  GRAPH: 'graph',
  LOCK_DIFF: 'lockDiff',
  HISTORY: 'history',
}

export const CHANGE_TYPE = {
  UPGRADED: 'upgraded',
  DOWNGRADED: 'downgraded',
  ADDED: 'added',
  REMOVED: 'removed',
  UNCHANGED: 'unchanged',
}

export const LICENSES = [
  'MIT',
  'Apache-2.0',
  'ISC',
  'BSD-3-Clause',
  'BSD-2-Clause',
  'GPL-3.0',
  'LGPL-3.0',
  'MPL-2.0',
  'Unlicense',
]

export const RANGE_PREFIXES = ['^', '~', '>=', '<=', '', '>', '<']
