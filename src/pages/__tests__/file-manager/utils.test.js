import { describe, it, expect } from 'vitest'
import { createInitialData } from '@/pages/file-manager/initialData'
import {
  generateId,
  getNodeChildren,
  getPathToNode,
  countFolderChildren,
  collectDescendantIds,
  createFolder,
  createFile,
  getFileTypeFromName,
  renameNode,
  deleteNode,
  sortItems,
  formatFileSize,
  formatDate,
  isNameValid,
  hasChildWithName,
} from '@/pages/file-manager/utils'

function makeTestData() {
  const now = 1700000000000
  return {
    rootId: 'root',
    nodes: {
      root: {
        id: 'root',
        name: '根目录',
        type: 'folder',
        parentId: null,
        children: ['f1', 'f2', 'file-a'],
        createdAt: now,
        updatedAt: now,
      },
      f1: {
        id: 'f1',
        name: '文档',
        type: 'folder',
        parentId: 'root',
        children: ['f1-1', 'file-b'],
        createdAt: now,
        updatedAt: now,
      },
      'f1-1': {
        id: 'f1-1',
        name: '子文档',
        type: 'folder',
        parentId: 'f1',
        children: [],
        createdAt: now,
        updatedAt: now,
      },
      f2: {
        id: 'f2',
        name: '图片',
        type: 'folder',
        parentId: 'root',
        children: [],
        createdAt: now,
        updatedAt: now,
      },
      'file-a': {
        id: 'file-a',
        name: 'readme.txt',
        type: 'file',
        fileType: 'txt',
        parentId: 'root',
        size: 1024,
        createdAt: now,
        updatedAt: now,
      },
      'file-b': {
        id: 'file-b',
        name: 'report.pdf',
        type: 'file',
        fileType: 'pdf',
        parentId: 'f1',
        size: 2048000,
        createdAt: now,
        updatedAt: now,
      },
    },
  }
}

describe('generateId', () => {
  it('生成非空字符串 ID', () => {
    const id = generateId('folder')
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(id.startsWith('folder-')).toBe(true)
  })

  it('生成的 ID 不重复', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('getNodeChildren', () => {
  it('获取根目录的直接子节点', () => {
    const data = makeTestData()
    const children = getNodeChildren(data, 'root')
    expect(children).toHaveLength(3)
    expect(children.map((c) => c.id).sort()).toEqual(['f1', 'f2', 'file-a'].sort())
  })

  it('空文件夹返回空数组', () => {
    const data = makeTestData()
    const children = getNodeChildren(data, 'f2')
    expect(children).toEqual([])
  })

  it('不存在的节点返回空数组', () => {
    const data = makeTestData()
    const children = getNodeChildren(data, 'non-existent')
    expect(children).toEqual([])
  })
})

describe('getPathToNode', () => {
  it('获取到嵌套文件夹的完整路径', () => {
    const data = makeTestData()
    const path = getPathToNode(data, 'f1-1')
    expect(path).toEqual([
      { id: 'root', name: '根目录' },
      { id: 'f1', name: '文档' },
      { id: 'f1-1', name: '子文档' },
    ])
  })

  it('根目录路径只包含自己', () => {
    const data = makeTestData()
    const path = getPathToNode(data, 'root')
    expect(path).toEqual([{ id: 'root', name: '根目录' }])
  })

  it('不存在的节点返回空数组', () => {
    const data = makeTestData()
    const path = getPathToNode(data, 'non-existent')
    expect(path).toEqual([])
  })
})

describe('countFolderChildren', () => {
  it('只统计文件夹的直接子文件夹数量（不含文件）', () => {
    const data = makeTestData()
    expect(countFolderChildren(data, 'root')).toBe(2)
    expect(countFolderChildren(data, 'f1')).toBe(1)
    expect(countFolderChildren(data, 'f2')).toBe(0)
  })
})

describe('collectDescendantIds', () => {
  it('收集所有后代节点 ID', () => {
    const data = makeTestData()
    const descendants = collectDescendantIds(data, 'root').sort()
    expect(descendants).toEqual(['f1', 'f1-1', 'f2', 'file-a', 'file-b'].sort())
  })

  it('空文件夹返回空数组', () => {
    const data = makeTestData()
    expect(collectDescendantIds(data, 'f2')).toEqual([])
  })
})

describe('createFolder', () => {
  it('在根目录下创建新文件夹', () => {
    const data = makeTestData()
    const result = createFolder(data, 'root', '新建文件夹')
    const newFolderId = result.nodes.root.children.find((id) => !data.nodes[id])
    expect(newFolderId).toBeTruthy()
    const newFolder = result.nodes[newFolderId]
    expect(newFolder.name).toBe('新建文件夹')
    expect(newFolder.type).toBe('folder')
    expect(newFolder.parentId).toBe('root')
    expect(newFolder.children).toEqual([])
    expect(result.nodes.root.children).toContain(newFolderId)
  })

  it('不修改原始数据', () => {
    const data = makeTestData()
    const originalChildren = [...data.nodes.root.children]
    createFolder(data, 'root', '新建文件夹')
    expect(data.nodes.root.children).toEqual(originalChildren)
  })
})

describe('createFile', () => {
  it('创建文件并正确识别文件类型', () => {
    const data = makeTestData()
    const result = createFile(data, 'f1', 'hello.js')
    const newFileId = result.nodes.f1.children.find((id) => !data.nodes[id])
    expect(newFileId).toBeTruthy()
    const newFile = result.nodes[newFileId]
    expect(newFile.name).toBe('hello.js')
    expect(newFile.type).toBe('file')
    expect(newFile.fileType).toBe('js')
    expect(newFile.parentId).toBe('f1')
    expect(typeof newFile.size).toBe('number')
    expect(result.nodes.f1.children).toContain(newFileId)
  })
})

describe('getFileTypeFromName', () => {
  it('从文件名提取后缀', () => {
    expect(getFileTypeFromName('test.jsx')).toBe('jsx')
    expect(getFileTypeFromName('README.MD')).toBe('md')
    expect(getFileTypeFromName('archive.tar.gz')).toBe('gz')
  })

  it('无后缀文件返回空字符串', () => {
    expect(getFileTypeFromName('noextension')).toBe('')
    expect(getFileTypeFromName('.hidden')).toBe('')
  })
})

describe('renameNode', () => {
  it('重命名文件并更新 fileType', () => {
    const data = makeTestData()
    const result = renameNode(data, 'file-a', 'new-name.md')
    expect(result.nodes['file-a'].name).toBe('new-name.md')
    expect(result.nodes['file-a'].fileType).toBe('md')
  })

  it('重命名文件夹', () => {
    const data = makeTestData()
    const result = renameNode(data, 'f1', '新文档')
    expect(result.nodes.f1.name).toBe('新文档')
    expect(result.nodes.f1.type).toBe('folder')
  })

  it('不修改原始数据', () => {
    const data = makeTestData()
    renameNode(data, 'file-a', 'changed.txt')
    expect(data.nodes['file-a'].name).toBe('readme.txt')
  })
})

describe('deleteNode', () => {
  it('删除文件并从父节点 children 中移除', () => {
    const data = makeTestData()
    const result = deleteNode(data, 'file-a')
    expect(result.nodes['file-a']).toBeUndefined()
    expect(result.nodes.root.children).not.toContain('file-a')
  })

  it('删除文件夹时级联删除所有后代', () => {
    const data = makeTestData()
    const result = deleteNode(data, 'f1')
    expect(result.nodes.f1).toBeUndefined()
    expect(result.nodes['f1-1']).toBeUndefined()
    expect(result.nodes['file-b']).toBeUndefined()
    expect(result.nodes.root.children).not.toContain('f1')
  })

  it('不删除根目录', () => {
    const data = makeTestData()
    const result = deleteNode(data, 'root')
    expect(result.nodes.root).toBeDefined()
  })
})

describe('sortItems', () => {
  it('文件夹排在文件前面', () => {
    const items = [
      { id: '1', name: 'b.txt', type: 'file', fileType: 'txt', size: 100 },
      { id: '2', name: 'a', type: 'folder' },
    ]
    const sorted = sortItems(items, 'name', 'asc')
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('1')
  })

  it('按名称升序', () => {
    const items = [
      { id: '1', name: 'banana', type: 'folder' },
      { id: '2', name: 'apple', type: 'folder' },
      { id: '3', name: 'cherry', type: 'folder' },
    ]
    const sorted = sortItems(items, 'name', 'asc')
    expect(sorted.map((i) => i.name)).toEqual(['apple', 'banana', 'cherry'])
  })

  it('按名称降序', () => {
    const items = [
      { id: '1', name: 'banana', type: 'folder' },
      { id: '2', name: 'apple', type: 'folder' },
      { id: '3', name: 'cherry', type: 'folder' },
    ]
    const sorted = sortItems(items, 'name', 'desc')
    expect(sorted.map((i) => i.name)).toEqual(['cherry', 'banana', 'apple'])
  })

  it('按类型排序', () => {
    const items = [
      { id: '1', name: 'c', type: 'file', fileType: 'zip', size: 10 },
      { id: '2', name: 'a', type: 'file', fileType: 'jpg', size: 10 },
      { id: '3', name: 'b', type: 'file', fileType: 'pdf', size: 10 },
    ]
    const sorted = sortItems(items, 'type', 'asc')
    expect(sorted.map((i) => i.fileType)).toEqual(['jpg', 'pdf', 'zip'])
  })

  it('按大小升序', () => {
    const items = [
      { id: '1', name: 'a', type: 'file', fileType: 'txt', size: 200 },
      { id: '2', name: 'b', type: 'file', fileType: 'txt', size: 50 },
      { id: '3', name: 'c', type: 'file', fileType: 'txt', size: 100 },
    ]
    const sorted = sortItems(items, 'size', 'asc')
    expect(sorted.map((i) => i.size)).toEqual([50, 100, 200])
  })

  it('按大小降序', () => {
    const items = [
      { id: '1', name: 'a', type: 'file', fileType: 'txt', size: 200 },
      { id: '2', name: 'b', type: 'file', fileType: 'txt', size: 50 },
      { id: '3', name: 'c', type: 'file', fileType: 'txt', size: 100 },
    ]
    const sorted = sortItems(items, 'size', 'desc')
    expect(sorted.map((i) => i.size)).toEqual([200, 100, 50])
  })
})

describe('formatFileSize', () => {
  it('格式化字节', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('格式化 KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('格式化 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('格式化 GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
  })

  it('无效值返回 -', () => {
    expect(formatFileSize(null)).toBe('-')
    expect(formatFileSize(undefined)).toBe('-')
    expect(formatFileSize(NaN)).toBe('-')
  })
})

describe('formatDate', () => {
  it('格式化时间戳为 YYYY-MM-DD HH:mm', () => {
    const ts = new Date('2024-01-15T09:30:00').getTime()
    const result = formatDate(ts)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })

  it('timestamp 0 是合法值，对应 1970-01-01', () => {
    const result = formatDate(0)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    expect(result).toContain('1970')
  })

  it('无效时间戳返回 -', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate(NaN)).toBe('-')
  })
})

describe('isNameValid', () => {
  it('有效名称', () => {
    expect(isNameValid('hello')).toBe(true)
    expect(isNameValid('  hello  ')).toBe(true)
    expect(isNameValid('文件.txt')).toBe(true)
  })

  it('无效名称', () => {
    expect(isNameValid('')).toBe(false)
    expect(isNameValid('   ')).toBe(false)
    expect(isNameValid(null)).toBe(false)
    expect(isNameValid(undefined)).toBe(false)
  })
})

describe('hasChildWithName', () => {
  it('检测存在同名子节点', () => {
    const data = makeTestData()
    expect(hasChildWithName(data, 'root', '文档')).toBe(true)
    expect(hasChildWithName(data, 'root', 'readme.txt')).toBe(true)
  })

  it('检测不存在同名子节点', () => {
    const data = makeTestData()
    expect(hasChildWithName(data, 'root', '不存在')).toBe(false)
  })

  it('排除指定 ID', () => {
    const data = makeTestData()
    expect(hasChildWithName(data, 'root', '文档', 'f1')).toBe(false)
    expect(hasChildWithName(data, 'root', '文档')).toBe(true)
  })
})

describe('createInitialData', () => {
  it('创建有效的初始数据结构', () => {
    const data = createInitialData()
    expect(data.rootId).toBe('root')
    expect(typeof data.nodes).toBe('object')
    expect(data.nodes.root).toBeDefined()
    expect(data.nodes.root.type).toBe('folder')
    expect(Array.isArray(data.nodes.root.children)).toBe(true)
    expect(data.nodes.root.children.length).toBeGreaterThan(0)
  })

  it('初始数据包含示例文件和文件夹', () => {
    const data = createInitialData()
    const rootChildren = data.nodes.root.children.map((id) => data.nodes[id])
    const hasFolder = rootChildren.some((n) => n?.type === 'folder')
    const hasFile = rootChildren.some((n) => n?.type === 'file')
    expect(hasFolder).toBe(true)
    expect(hasFile).toBe(true)
  })
})
