import { describe, it, expect } from 'vitest'
import {
  simpleHash,
  seededRandom,
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
  buildFileTreeFromList,
  computeCommitFileSnapshot,
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

  it('MODIFIED 状态对同一文件应生成确定性内容', () => {
    const file1 = {
      path: 'src/App.js',
      status: FILE_CHANGE_STATUS.MODIFIED,
      content: 'const a = 1\nconst b = 2\nconst c = 3\nconst d = 4\nconst e = 5',
    }
    const file2 = {
      path: 'src/App.js',
      status: FILE_CHANGE_STATUS.MODIFIED,
      content: 'const a = 1\nconst b = 2\nconst c = 3\nconst d = 4\nconst e = 5',
    }
    const result1 = generateOriginalContent(file1)
    const result2 = generateOriginalContent(file2)
    expect(result1).toBe(result2)
  })

  it('不同文件路径应生成不同内容', () => {
    const file1 = {
      path: 'src/App.js',
      status: FILE_CHANGE_STATUS.MODIFIED,
      content: 'const a = 1\nconst b = 2\nconst c = 3\nconst d = 4\nconst e = 5',
    }
    const file2 = {
      path: 'src/index.js',
      status: FILE_CHANGE_STATUS.MODIFIED,
      content: 'const a = 1\nconst b = 2\nconst c = 3\nconst d = 4\nconst e = 5',
    }
    const result1 = generateOriginalContent(file1)
    const result2 = generateOriginalContent(file2)
    expect(result1).not.toBe(result2)
  })
})

describe('simpleHash', () => {
  it('应对相同字符串返回相同哈希值', () => {
    expect(simpleHash('hello')).toBe(simpleHash('hello'))
    expect(simpleHash('src/App.js')).toBe(simpleHash('src/App.js'))
  })

  it('应对不同字符串返回不同哈希值', () => {
    expect(simpleHash('hello')).not.toBe(simpleHash('world'))
    expect(simpleHash('a')).not.toBe(simpleHash('b'))
  })

  it('应返回非负整数', () => {
    const result = simpleHash('test string')
    expect(Number.isInteger(result)).toBe(true)
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('空字符串或非字符串应返回 0', () => {
    expect(simpleHash('')).toBe(0)
    expect(simpleHash(null)).toBe(0)
    expect(simpleHash(undefined)).toBe(0)
    expect(simpleHash(123)).toBe(0)
  })
})

describe('seededRandom', () => {
  it('相同 seed 应生成相同的随机序列', () => {
    const rand1 = seededRandom(42)
    const rand2 = seededRandom(42)
    const seq1 = [rand1(), rand1(), rand1()]
    const seq2 = [rand2(), rand2(), rand2()]
    expect(seq1).toEqual(seq2)
  })

  it('不同 seed 应生成不同的随机序列', () => {
    const rand1 = seededRandom(1)
    const rand2 = seededRandom(2)
    const seq1 = [rand1(), rand1(), rand1()]
    const seq2 = [rand2(), rand2(), rand2()]
    expect(seq1).not.toEqual(seq2)
  })

  it('生成的随机数应在 [0, 1) 范围内', () => {
    const rand = seededRandom(123)
    for (let i = 0; i < 100; i++) {
      const val = rand()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })
})

describe('buildFileTreeFromList', () => {
  it('应从文件列表构建正确的树结构', () => {
    const fileList = [
      { path: 'package.json', status: FILE_CHANGE_STATUS.UNCHANGED },
      { path: 'src/index.js', status: FILE_CHANGE_STATUS.MODIFIED },
      { path: 'src/components/Button.jsx', status: FILE_CHANGE_STATUS.ADDED },
      { path: 'src/utils/helpers.js', status: FILE_CHANGE_STATUS.UNCHANGED },
    ]
    const fileContents = {
      'package.json': '{"name":"test"}',
      'src/index.js': 'console.log("index")',
      'src/components/Button.jsx': 'export default Button',
      'src/utils/helpers.js': 'export const help = () => {}',
    }

    const tree = buildFileTreeFromList(fileList, fileContents)
    expect(tree).not.toBeNull()
    expect(tree.name).toBe('my-project')
    expect(tree.type).toBe(FILE_TYPE.FOLDER)

    const rootFiles = tree.children.filter((c) => c.type === FILE_TYPE.FILE)
    expect(rootFiles.length).toBe(1)
    expect(rootFiles[0].name).toBe('package.json')

    const srcFolder = tree.children.find((c) => c.name === 'src')
    expect(srcFolder).not.toBeUndefined()
    expect(srcFolder.type).toBe(FILE_TYPE.FOLDER)

    const srcFiles = srcFolder.children.filter((c) => c.type === FILE_TYPE.FILE)
    expect(srcFiles.length).toBe(1)
    expect(srcFiles[0].name).toBe('index.js')
    expect(srcFiles[0].status).toBe(FILE_CHANGE_STATUS.MODIFIED)

    const componentsFolder = srcFolder.children.find((c) => c.name === 'components')
    expect(componentsFolder).not.toBeUndefined()
    expect(componentsFolder.children[0].name).toBe('Button.jsx')
    expect(componentsFolder.children[0].status).toBe(FILE_CHANGE_STATUS.ADDED)
  })

  it('非数组输入应返回 null', () => {
    expect(buildFileTreeFromList(null, {})).toBeNull()
    expect(buildFileTreeFromList(undefined, {})).toBeNull()
  })

  it('空列表应返回只有根节点的树', () => {
    const tree = buildFileTreeFromList([], {})
    expect(tree).not.toBeNull()
    expect(tree.children.length).toBe(0)
  })
})

describe('computeCommitFileSnapshot', () => {
  const baseFileList = [
    { path: 'package.json', status: FILE_CHANGE_STATUS.UNCHANGED },
    { path: 'src/index.js', status: FILE_CHANGE_STATUS.UNCHANGED },
    { path: 'README.md', status: FILE_CHANGE_STATUS.UNCHANGED },
  ]

  const commitHistory = [
    { hash: 'c001', files: ['README.md'] },
    { hash: 'c002', files: ['src/index.js', 'src/utils.js'] },
    { hash: 'c003', files: ['package.json'] },
  ]

  it('目标提交不存在应返回 baseFileList', () => {
    const result = computeCommitFileSnapshot(commitHistory, 'nonexistent', baseFileList)
    expect(result.length).toBe(baseFileList.length)
  })

  it('应正确计算第一条提交的快照', () => {
    const result = computeCommitFileSnapshot(commitHistory, 'c001', baseFileList)
    const readme = result.find((f) => f.path === 'README.md')
    expect(readme.status).toBe(FILE_CHANGE_STATUS.MODIFIED)
    const index = result.find((f) => f.path === 'src/index.js')
    expect(index.status).toBe(FILE_CHANGE_STATUS.UNCHANGED)
  })

  it('应正确计算中间提交的快照（包含新增文件）', () => {
    const result = computeCommitFileSnapshot(commitHistory, 'c002', baseFileList)
    const utils = result.find((f) => f.path === 'src/utils.js')
    expect(utils).not.toBeUndefined()
    expect(utils.status).toBe(FILE_CHANGE_STATUS.ADDED)

    const index = result.find((f) => f.path === 'src/index.js')
    expect(index.status).toBe(FILE_CHANGE_STATUS.MODIFIED)

    const readme = result.find((f) => f.path === 'README.md')
    expect(readme.status).toBe(FILE_CHANGE_STATUS.UNCHANGED)
  })

  it('应正确计算最后一条提交的快照', () => {
    const result = computeCommitFileSnapshot(commitHistory, 'c003', baseFileList)
    const pkg = result.find((f) => f.path === 'package.json')
    expect(pkg.status).toBe(FILE_CHANGE_STATUS.MODIFIED)
  })

  it('非数组输入应返回空数组', () => {
    expect(computeCommitFileSnapshot(null, 'c001', baseFileList)).toEqual([])
    expect(computeCommitFileSnapshot(commitHistory, 'c001', null)).toEqual([])
  })
})
