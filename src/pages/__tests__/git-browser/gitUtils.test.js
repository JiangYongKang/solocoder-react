import { describe, it, expect } from 'vitest'
import {
  getChangeStatusIcon,
  getChangeStatusColor,
  getChangeStatusLabel,
  getAllFilesFromTree,
  getChangedFilesFromTree,
  findFileInTree,
  folderContainsFile,
  expandFoldersToFile,
  formatTimestamp,
  formatShortTimestamp,
  shortHash,
  stageFile,
  unstageFile,
  isFileStaged,
  computeFileStats,
  getFileExtension,
  sortTreeChildren,
  filterFileTree,
  generateOriginalContent,
} from '../../git-browser/gitUtils'
import { FILE_CHANGE_STATUS, FILE_TYPE } from '../../git-browser/constants'

describe('getChangeStatusIcon', () => {
  it('ADDED 状态应返回 +', () => {
    expect(getChangeStatusIcon(FILE_CHANGE_STATUS.ADDED)).toBe('+')
  })

  it('DELETED 状态应返回 -', () => {
    expect(getChangeStatusIcon(FILE_CHANGE_STATUS.DELETED)).toBe('-')
  })

  it('MODIFIED 状态应返回 ~', () => {
    expect(getChangeStatusIcon(FILE_CHANGE_STATUS.MODIFIED)).toBe('~')
  })

  it('UNCHANGED 状态应返回空字符串', () => {
    expect(getChangeStatusIcon(FILE_CHANGE_STATUS.UNCHANGED)).toBe('')
  })

  it('未知状态应返回空字符串', () => {
    expect(getChangeStatusIcon('unknown')).toBe('')
    expect(getChangeStatusIcon(null)).toBe('')
    expect(getChangeStatusIcon(undefined)).toBe('')
  })
})

describe('getChangeStatusColor', () => {
  it('应返回正确的颜色代码', () => {
    expect(getChangeStatusColor(FILE_CHANGE_STATUS.ADDED)).toBe('#22c55e')
    expect(getChangeStatusColor(FILE_CHANGE_STATUS.DELETED)).toBe('#ef4444')
    expect(getChangeStatusColor(FILE_CHANGE_STATUS.MODIFIED)).toBe('#f59e0b')
    expect(getChangeStatusColor(FILE_CHANGE_STATUS.UNCHANGED)).toBe('#9ca3af')
  })

  it('未知状态应返回灰色', () => {
    expect(getChangeStatusColor('unknown')).toBe('#9ca3af')
  })
})

describe('getChangeStatusLabel', () => {
  it('应返回正确的中文标签', () => {
    expect(getChangeStatusLabel(FILE_CHANGE_STATUS.ADDED)).toBe('新增')
    expect(getChangeStatusLabel(FILE_CHANGE_STATUS.DELETED)).toBe('删除')
    expect(getChangeStatusLabel(FILE_CHANGE_STATUS.MODIFIED)).toBe('修改')
    expect(getChangeStatusLabel(FILE_CHANGE_STATUS.UNCHANGED)).toBe('未变更')
  })

  it('未知状态应返回未变更', () => {
    expect(getChangeStatusLabel('unknown')).toBe('未变更')
  })
})

const mockTree = {
  id: 'root',
  name: 'root',
  type: FILE_TYPE.FOLDER,
  children: [
    {
      id: 'f1',
      name: 'src',
      type: FILE_TYPE.FOLDER,
      children: [
        { id: 'file1', name: 'index.js', type: FILE_TYPE.FILE, path: 'src/index.js', status: FILE_CHANGE_STATUS.MODIFIED },
        { id: 'file2', name: 'App.js', type: FILE_TYPE.FILE, path: 'src/App.js', status: FILE_CHANGE_STATUS.UNCHANGED },
      ],
    },
    {
      id: 'f2',
      name: 'tests',
      type: FILE_TYPE.FOLDER,
      children: [
        { id: 'file3', name: 'test.js', type: FILE_TYPE.FILE, path: 'tests/test.js', status: FILE_CHANGE_STATUS.ADDED },
      ],
    },
    { id: 'file4', name: 'package.json', type: FILE_TYPE.FILE, path: 'package.json', status: FILE_CHANGE_STATUS.UNCHANGED },
    { id: 'file5', name: 'old.log', type: FILE_TYPE.FILE, path: 'old.log', status: FILE_CHANGE_STATUS.DELETED },
  ],
}

describe('getAllFilesFromTree', () => {
  it('应返回所有文件', () => {
    const files = getAllFilesFromTree(mockTree)
    expect(files.length).toBe(5)
    expect(files.map((f) => f.name).sort()).toEqual(
      ['App.js', 'index.js', 'old.log', 'package.json', 'test.js'].sort()
    )
  })

  it('传入 null 应返回空数组', () => {
    expect(getAllFilesFromTree(null)).toEqual([])
    expect(getAllFilesFromTree(undefined)).toEqual([])
  })

  it('单个文件节点应返回自身', () => {
    const singleFile = { id: 'x', name: 'a.js', type: FILE_TYPE.FILE, status: FILE_CHANGE_STATUS.UNCHANGED }
    const result = getAllFilesFromTree(singleFile)
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('a.js')
  })
})

describe('getChangedFilesFromTree', () => {
  it('应过滤出指定状态的文件', () => {
    const modified = getChangedFilesFromTree(mockTree, FILE_CHANGE_STATUS.MODIFIED)
    expect(modified.length).toBe(1)
    expect(modified[0].name).toBe('index.js')

    const added = getChangedFilesFromTree(mockTree, FILE_CHANGE_STATUS.ADDED)
    expect(added.length).toBe(1)
    expect(added[0].name).toBe('test.js')
  })

  it('支持传入状态数组', () => {
    const changed = getChangedFilesFromTree(mockTree, [
      FILE_CHANGE_STATUS.ADDED,
      FILE_CHANGE_STATUS.MODIFIED,
      FILE_CHANGE_STATUS.DELETED,
    ])
    expect(changed.length).toBe(3)
  })

  it('传入 null 应返回空数组', () => {
    expect(getChangedFilesFromTree(null, FILE_CHANGE_STATUS.ADDED)).toEqual([])
  })
})

describe('findFileInTree', () => {
  it('应根据路径找到文件', () => {
    const file = findFileInTree(mockTree, 'src/index.js')
    expect(file).not.toBeNull()
    expect(file.name).toBe('index.js')
  })

  it('找不到文件应返回 null', () => {
    expect(findFileInTree(mockTree, 'nonexistent.js')).toBeNull()
    expect(findFileInTree(null, 'a.js')).toBeNull()
  })
})

describe('folderContainsFile', () => {
  it('应正确检测文件夹是否包含指定文件', () => {
    expect(folderContainsFile(mockTree, 'src/index.js')).toBe(true)
    expect(folderContainsFile(mockTree, 'tests/test.js')).toBe(true)
    expect(folderContainsFile(mockTree, 'nonexistent')).toBe(false)
  })

  it('null 或无 children 的节点应返回 false', () => {
    expect(folderContainsFile(null, 'a.js')).toBe(false)
    expect(folderContainsFile({ id: 'x' }, 'a.js')).toBe(false)
  })
})

describe('expandFoldersToFile', () => {
  it('应展开包含目标文件的所有父文件夹', () => {
    const expanded = new Set()
    expandFoldersToFile(mockTree, 'src/index.js', expanded)
    expect(expanded.has('f1')).toBe(true)
    expect(expanded.has('f2')).toBe(false)
  })
})

describe('formatTimestamp', () => {
  it('应正确格式化时间戳', () => {
    const now = Date.now()
    expect(formatTimestamp(now)).toBe('刚刚')
    expect(formatTimestamp(now - 5 * 60 * 1000)).toBe('5 分钟前')
    expect(formatTimestamp(now - 2 * 60 * 60 * 1000)).toBe('2 小时前')
    expect(formatTimestamp(now - 3 * 24 * 60 * 60 * 1000)).toBe('3 天前')
  })

  it('无效时间戳应返回空字符串', () => {
    expect(formatTimestamp(null)).toBe('')
    expect(formatTimestamp(undefined)).toBe('')
    expect(formatTimestamp('not-a-number')).toBe('')
  })
})

describe('formatShortTimestamp', () => {
  it('应返回短日期格式', () => {
    const result = formatShortTimestamp(Date.now())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('无效输入应返回空字符串', () => {
    expect(formatShortTimestamp(null)).toBe('')
  })
})

describe('shortHash', () => {
  it('应截取前 7 位', () => {
    expect(shortHash('abcdefghijk')).toBe('abcdefg')
    expect(shortHash('1234567')).toBe('1234567')
  })

  it('无效输入应返回空字符串', () => {
    expect(shortHash(null)).toBe('')
    expect(shortHash(undefined)).toBe('')
    expect(shortHash(12345)).toBe('')
  })
})

describe('stageFile', () => {
  it('应添加文件到暂存区', () => {
    const staged = []
    const file = { path: 'a.js', name: 'a.js' }
    const result = stageFile(staged, file)
    expect(result.length).toBe(1)
    expect(result[0].path).toBe('a.js')
  })

  it('不应重复暂存同一文件', () => {
    const staged = [{ path: 'a.js', name: 'a.js' }]
    const file = { path: 'a.js', name: 'a.js' }
    const result = stageFile(staged, file)
    expect(result.length).toBe(1)
  })

  it('无效文件应返回原数组', () => {
    const staged = []
    expect(stageFile(staged, null)).toBe(staged)
    expect(stageFile(staged, {})).toBe(staged)
  })
})

describe('unstageFile', () => {
  it('应从暂存区移除文件', () => {
    const staged = [
      { path: 'a.js', name: 'a.js' },
      { path: 'b.js', name: 'b.js' },
    ]
    const result = unstageFile(staged, 'a.js')
    expect(result.length).toBe(1)
    expect(result[0].path).toBe('b.js')
  })

  it('无效路径应返回原数组', () => {
    const staged = [{ path: 'a.js' }]
    expect(unstageFile(staged, null)).toEqual(staged)
    expect(unstageFile(staged, '')).toEqual(staged)
  })
})

describe('isFileStaged', () => {
  it('应正确判断文件是否已暂存', () => {
    const staged = [{ path: 'a.js' }]
    expect(isFileStaged(staged, 'a.js')).toBe(true)
    expect(isFileStaged(staged, 'b.js')).toBe(false)
  })

  it('无效输入应返回 false', () => {
    expect(isFileStaged(null, 'a.js')).toBe(false)
    expect(isFileStaged([], null)).toBe(false)
  })
})

describe('computeFileStats', () => {
  it('应正确统计各状态文件数量', () => {
    const files = [
      { status: FILE_CHANGE_STATUS.ADDED },
      { status: FILE_CHANGE_STATUS.ADDED },
      { status: FILE_CHANGE_STATUS.MODIFIED },
      { status: FILE_CHANGE_STATUS.DELETED },
      { status: FILE_CHANGE_STATUS.UNCHANGED },
      { status: FILE_CHANGE_STATUS.UNCHANGED },
      { status: FILE_CHANGE_STATUS.UNCHANGED },
    ]
    const stats = computeFileStats(files)
    expect(stats.added).toBe(2)
    expect(stats.modified).toBe(1)
    expect(stats.deleted).toBe(1)
    expect(stats.unchanged).toBe(3)
  })

  it('非数组输入应返回全零', () => {
    expect(computeFileStats(null)).toEqual({ added: 0, modified: 0, deleted: 0, unchanged: 0 })
    expect(computeFileStats(undefined)).toEqual({ added: 0, modified: 0, deleted: 0, unchanged: 0 })
  })
})

describe('getFileExtension', () => {
  it('应正确获取文件扩展名', () => {
    expect(getFileExtension('test.js')).toBe('js')
    expect(getFileExtension('README.MD')).toBe('md')
    expect(getFileExtension('path/to/file.test.jsx')).toBe('jsx')
  })

  it('无扩展名的文件应返回空字符串', () => {
    expect(getFileExtension('Makefile')).toBe('')
    expect(getFileExtension('.gitignore')).toBe('')
  })

  it('无效输入应返回空字符串', () => {
    expect(getFileExtension(null)).toBe('')
    expect(getFileExtension(undefined)).toBe('')
    expect(getFileExtension(123)).toBe('')
  })
})

describe('sortTreeChildren', () => {
  it('文件夹应排在文件前面', () => {
    const children = [
      { name: 'b.js', type: FILE_TYPE.FILE },
      { name: 'a', type: FILE_TYPE.FOLDER },
      { name: 'c.js', type: FILE_TYPE.FILE },
      { name: 'z', type: FILE_TYPE.FOLDER },
    ]
    const sorted = sortTreeChildren(children)
    expect(sorted[0].name).toBe('a')
    expect(sorted[1].name).toBe('z')
    expect(sorted[2].name).toBe('b.js')
    expect(sorted[3].name).toBe('c.js')
  })

  it('非数组输入应返回空数组', () => {
    expect(sortTreeChildren(null)).toEqual([])
    expect(sortTreeChildren(undefined)).toEqual([])
  })
})

describe('filterFileTree', () => {
  it('应按文件名过滤', () => {
    const filtered = filterFileTree(mockTree, 'index')
    expect(filtered).not.toBeNull()
    const files = getAllFilesFromTree(filtered)
    expect(files.length).toBe(1)
    expect(files[0].name).toBe('index.js')
  })

  it('无搜索词应返回原节点', () => {
    expect(filterFileTree(mockTree, '')).toBe(mockTree)
    expect(filterFileTree(mockTree, null)).toBe(mockTree)
  })

  it('空节点应返回 null', () => {
    expect(filterFileTree(null, 'test')).toBeNull()
  })

  it('无匹配应返回 null', () => {
    expect(filterFileTree(mockTree, 'zzzzz')).toBeNull()
  })
})

describe('generateOriginalContent', () => {
  const mockFile = {
    status: FILE_CHANGE_STATUS.MODIFIED,
    content: 'line1\nline2\nline3\nline4\nline5',
  }

  it('ADDED 状态应返回空字符串', () => {
    const result = generateOriginalContent({ ...mockFile, status: FILE_CHANGE_STATUS.ADDED })
    expect(result).toBe('')
  })

  it('DELETED 状态应返回原内容', () => {
    const result = generateOriginalContent({ ...mockFile, status: FILE_CHANGE_STATUS.DELETED })
    expect(result).toBe(mockFile.content)
  })

  it('MODIFIED 状态应返回修改后的内容变体', () => {
    const result = generateOriginalContent(mockFile)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('UNCHANGED 状态应返回原内容', () => {
    const result = generateOriginalContent({ ...mockFile, status: FILE_CHANGE_STATUS.UNCHANGED })
    expect(result).toBe(mockFile.content)
  })

  it('无内容的文件应返回空字符串', () => {
    expect(generateOriginalContent(null)).toBe('')
    expect(generateOriginalContent({ content: '' })).toBe('')
  })
})
