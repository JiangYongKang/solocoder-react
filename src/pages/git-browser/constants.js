export const FILE_CHANGE_STATUS = {
  UNCHANGED: 'unchanged',
  ADDED: 'added',
  MODIFIED: 'modified',
  DELETED: 'deleted',
}

export const FILE_TYPE = {
  FILE: 'file',
  FOLDER: 'folder',
}

export const VIEW_MODE = {
  CONTENT: 'content',
  DIFF: 'diff',
}

export const DIFF_VIEW_MODE = {
  SIDE_BY_SIDE: 'side-by-side',
  UNIFIED: 'unified',
}

export const BRANCHES = [
  { name: 'main', isDefault: true },
  { name: 'develop', isDefault: false },
  { name: 'feature/login', isDefault: false },
  { name: 'bugfix/header', isDefault: false },
]

export const AUTHORS = [
  { name: 'Alice Chen', email: 'alice@example.com', avatar: '👩‍💻' },
  { name: 'Bob Wang', email: 'bob@example.com', avatar: '👨‍💻' },
  { name: 'Charlie Liu', email: 'charlie@example.com', avatar: '🧑‍💻' },
  { name: 'Diana Zhang', email: 'diana@example.com', avatar: '👩‍🎨' },
]
