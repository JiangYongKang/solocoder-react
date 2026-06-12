import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  TYPE_MODE,
  toPascalCase,
  debounce,
  parseJson,
  formatJson,
  extractOptionalMarkers,
  inferObjectFieldSchemas,
  inferArrayItemType,
  buildTypeDefinitions,
  generateTypeScript,
  truncateText,
  getJsonPreviewSummary,
  copyToClipboard,
  downloadTsFile,
} from '../../json-to-ts/jsonToTsUtils'

describe('TYPE_MODE', () => {
  it('应该包含正确的类型模式常量', () => {
    expect(TYPE_MODE.INTERFACE_ONLY).toBe('interface-only')
    expect(TYPE_MODE.PREFER_TYPE).toBe('prefer-type')
  })
})

describe('toPascalCase', () => {
  it('应该将字符串转换为 PascalCase 格式', () => {
    expect(toPascalCase('hello_world')).toBe('HelloWorld')
    expect(toPascalCase('user-name')).toBe('UserName')
    expect(toPascalCase('foo bar')).toBe('FooBar')
    expect(toPascalCase('my_field_name')).toBe('MyFieldName')
    expect(toPascalCase('root_type')).toBe('RootType')
  })

  it('应该处理空字符串或非字符串输入', () => {
    expect(toPascalCase('')).toBe('Type')
    expect(toPascalCase(null)).toBe('Type')
    expect(toPascalCase(undefined)).toBe('Type')
    expect(toPascalCase(123)).toBe('Type')
  })

  it('应该处理特殊字符', () => {
    expect(toPascalCase('hello___world')).toBe('HelloWorld')
    expect(toPascalCase('a-b-c-d')).toBe('ABCD')
    expect(toPascalCase('123abc')).toBe('123abc')
    expect(toPascalCase('_private')).toBe('Private')
  })

  it('应该保持已有的 PascalCase 不变', () => {
    expect(toPascalCase('HelloWorld')).toBe('HelloWorld')
    expect(toPascalCase('User')).toBe('User')
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该在等待时间后执行函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('重复调用应该重置计时器', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('应该传递参数给被包装函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('a', 'b', 'c')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('a', 'b', 'c')
  })

  it('cancel 方法应该取消待执行的函数', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()
  })

  it('传入非函数参数应该抛出 TypeError', () => {
    expect(() => debounce(null, 100)).toThrow(TypeError)
    expect(() => debounce('not a function', 100)).toThrow(TypeError)
  })
})

describe('parseJson', () => {
  it('应该正确解析有效的 JSON', () => {
    const result = parseJson('{"name": "John", "age": 30}')
    expect(result.success).toBe(true)
    expect(result.value).toEqual({ name: 'John', age: 30 })
    expect(result.error).toBeNull()
  })

  it('应该在 JSON 无效时返回错误信息和位置', () => {
    const result = parseJson('{"name": "John", age: 30}')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
    expect(result.error.length).toBeGreaterThan(0)
  })

  it('应该解析包含错误位置的 JSON', () => {
    const badJson = `{
  "name": "John",
  "age": 30
  invalid
}`
    const result = parseJson(badJson)
    expect(result.success).toBe(false)
    expect(result.line).toBeDefined()
    expect(result.line).toBeGreaterThan(0)
  })

  it('空字符串或非字符串输入应该返回错误', () => {
    expect(parseJson('').success).toBe(false)
    expect(parseJson('   ').success).toBe(false)
    expect(parseJson(null).success).toBe(false)
    expect(parseJson(undefined).success).toBe(false)
  })

  it('应该正确解析各种 JSON 类型', () => {
    expect(parseJson('null').value).toBeNull()
    expect(parseJson('42').value).toBe(42)
    expect(parseJson('3.14').value).toBe(3.14)
    expect(parseJson('true').value).toBe(true)
    expect(parseJson('"hello"').value).toBe('hello')
    expect(parseJson('[1, 2, 3]').value).toEqual([1, 2, 3])
  })
})

describe('formatJson', () => {
  it('应该正确格式化有效的 JSON', () => {
    const result = formatJson('{"name":"John","age":30}')
    expect(result.success).toBe(true)
    expect(result.formatted).toBe('{\n  "name": "John",\n  "age": 30\n}')
  })

  it('应该在 JSON 无效时返回错误', () => {
    const result = formatJson('{invalid}')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('格式化后的 JSON 应该可以重新解析', () => {
    const original = '{"a":1,"b":{"c":2}}'
    const formatted = formatJson(original)
    expect(formatted.success).toBe(true)
    const reparsed = parseJson(formatted.formatted)
    expect(reparsed.success).toBe(true)
    expect(reparsed.value).toEqual({ a: 1, b: { c: 2 } })
  })
})

describe('extractOptionalMarkers', () => {
  it('应该提取 // @optional 标记的字段', () => {
    const text = `{
  "id": 1,
  "name": "John",
  // @optional
  "metadata": {
    "foo": "bar"
  },
  // @optional
  "avatar": null
}`
    const result = extractOptionalMarkers(text)
    expect(result.has('metadata')).toBe(true)
    expect(result.has('avatar')).toBe(true)
    expect(result.has('id')).toBe(false)
    expect(result.has('name')).toBe(false)
  })

  it('应该处理 // @optional 后面有其他文字的情况', () => {
    const text = `{
  // @optional 这个字段是可选的
  "foo": "bar"
}`
    const result = extractOptionalMarkers(text)
    expect(result.has('foo')).toBe(true)
  })

  it('应该跳过空行找到下一个字段', () => {
    const text = `{
  // @optional


  "foo": "bar"
}`
    const result = extractOptionalMarkers(text)
    expect(result.has('foo')).toBe(true)
  })

  it('空字符串或非字符串输入应该返回空 Set', () => {
    expect(extractOptionalMarkers('').size).toBe(0)
    expect(extractOptionalMarkers(null).size).toBe(0)
    expect(extractOptionalMarkers(undefined).size).toBe(0)
  })

  it('没有 @optional 标记时应该返回空 Set', () => {
    const text = '{"id": 1, "name": "John"}'
    expect(extractOptionalMarkers(text).size).toBe(0)
  })
})

describe('inferObjectFieldSchemas', () => {
  it('应该推断单个对象的字段类型', () => {
    const objects = [{ id: 1, name: 'John', isActive: true }]
    const result = inferObjectFieldSchemas(objects, 'User')
    expect(result.id).toBeDefined()
    expect(result.id.required).toBe(true)
    expect(result.id.type).toContain('number')
    expect(result.name.type).toContain('string')
    expect(result.isActive.type).toContain('boolean')
  })

  it('应该识别多对象数组中的可选字段', () => {
    const objects = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane' },
      { id: 3, name: 'Bob', email: 'bob@example.com' },
    ]
    const result = inferObjectFieldSchemas(objects, 'User')
    expect(result.id.required).toBe(true)
    expect(result.name.required).toBe(true)
    expect(result.email.required).toBe(false)
  })

  it('应该正确处理 null 值字段', () => {
    const objects = [{ id: 1, avatar: null, name: 'John' }]
    const result = inferObjectFieldSchemas(objects, 'User')
    expect(result.avatar.type).toContain('null')
  })

  it('应该正确处理嵌套对象', () => {
    const objects = [{ id: 1, address: { city: 'Beijing', country: 'China' } }]
    const result = inferObjectFieldSchemas(objects, 'User')
    expect(result.address.hasObject).toBe(true)
    expect(result.address.type).toContain('UserAddress')
  })

  it('应该正确处理数组字段', () => {
    const objects = [{ id: 1, tags: ['a', 'b', 'c'] }]
    const result = inferObjectFieldSchemas(objects, 'User')
    expect(result.tags.hasArray).toBe(true)
    expect(result.tags.type).toContain('[]')
  })

  it('空对象数组应该返回空结果', () => {
    const result = inferObjectFieldSchemas([], 'Test')
    expect(Object.keys(result).length).toBe(0)
  })

  it('应该正确处理数字类型（整数和浮点数都为 number）', () => {
    const objects = [{ int: 42, float: 3.14 }]
    const result = inferObjectFieldSchemas(objects, 'Test')
    expect(result.int.type).toBe('number')
    expect(result.float.type).toBe('number')
  })
})

describe('inferArrayItemType', () => {
  it('空数组应该返回 any', () => {
    expect(inferArrayItemType([[]], 'Test')).toBe('any')
  })

  it('应该推断字符串数组的类型', () => {
    const result = inferArrayItemType([['a', 'b', 'c']], 'Test')
    expect(result).toBe('string')
  })

  it('应该推断数字数组的类型', () => {
    const result = inferArrayItemType([[1, 2, 3]], 'Test')
    expect(result).toBe('number')
  })

  it('应该推断混合类型数组的联合类型', () => {
    const result = inferArrayItemType([[1, 'a', true]], 'Test')
    expect(result).toContain('number')
    expect(result).toContain('string')
    expect(result).toContain('boolean')
  })

  it('应该推断对象数组的类型为命名类型', () => {
    const result = inferArrayItemType([[{ id: 1, name: 'a' }]], 'Test')
    expect(result).toBe('TestItem')
  })

  it('应该处理包含 null 的数组', () => {
    const result = inferArrayItemType([[1, null, 3]], 'Test')
    expect(result).toContain('number')
    expect(result).toContain('null')
  })

  it('应该处理嵌套数组', () => {
    const result = inferArrayItemType([[[1, 2], [3, 4]]], 'Test')
    expect(result).toContain('(number)[]')
  })
})

describe('buildTypeDefinitions', () => {
  it('应该为简单对象构建类型定义', () => {
    const value = { id: 1, name: 'John' }
    const result = buildTypeDefinitions(value, 'User')
    const defs = result.typeDefs
    expect(defs.length).toBeGreaterThan(0)
    expect(defs[0].name).toBe('User')
    expect(defs[0].fields).toBeDefined()
    expect(defs[0].fields.id).toBeDefined()
  })

  it('应该为数组根构建列表类型', () => {
    const value = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]
    const result = buildTypeDefinitions(value, 'User')
    const defs = result.typeDefs
    const listDef = defs.find((d) => d.isArray)
    expect(listDef).toBeDefined()
    expect(listDef.name).toBe('UserList')
    expect(listDef.itemType).toBe('User')
    expect(result.listTypeName).toBe('UserList')
  })

  it('应该递归处理嵌套对象', () => {
    const value = {
      id: 1,
      name: 'John',
      address: {
        city: 'Beijing',
        country: 'China',
      },
    }
    const result = buildTypeDefinitions(value, 'User')
    const defs = result.typeDefs
    const addressDef = defs.find((d) => d.name === 'UserAddress')
    expect(addressDef).toBeDefined()
    expect(addressDef.fields.city).toBeDefined()
  })

  it('应该处理空对象为 Record<string, any>', () => {
    const value = {}
    const result = buildTypeDefinitions(value, 'Empty')
    const defs = result.typeDefs
    expect(defs[0].isRecord).toBe(true)
  })

  it('应该处理空数组为 any[]', () => {
    const value = []
    const result = buildTypeDefinitions(value, 'Empty')
    const defs = result.typeDefs
    expect(defs[0].isArray).toBe(true)
    expect(defs[0].itemType).toBe('any')
    expect(result.listTypeName).toBe('EmptyList')
  })

  it('应该尊重自定义类型名称', () => {
    const value = { id: 1, name: 'John' }
    const customNames = { RootType: 'MyCustomType' }
    const result = buildTypeDefinitions(value, 'RootType', customNames)
    const defs = result.typeDefs
    expect(defs[0].name).toBe('MyCustomType')
  })

  it('处理带数组字段的对象时应返回 topLevelListName', () => {
    const value = { items: [1, 2, 3] }
    const result = buildTypeDefinitions(value, 'RootType')
    const defs = result.typeDefs
    expect(defs.length).toBeGreaterThan(1)
    expect(result.topLevelListName).toBeDefined()
    const arrayDef = defs.find((d) => d.isArray && d.depth === 1)
    expect(arrayDef).toBeDefined()
    expect(arrayDef.name).toBe(result.topLevelListName)
  })
})

describe('generateTypeScript', () => {
  it('应该为简单对象生成 interface', () => {
    const value = { id: 1, name: 'John' }
    const result = generateTypeScript(value, { rootName: 'User' })
    expect(result.code).toContain('export interface User')
    expect(result.code).toContain('id: number')
    expect(result.code).toContain('name: string')
    expect(result.rootTypeName).toBe('User')
  })

  it('应该为数组生成 type 别名', () => {
    const value = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]
    const result = generateTypeScript(value, { rootName: 'User' })
    expect(result.code).toContain('export type UserList = User[]')
    expect(result.rootListName).toBe('UserList')
  })

  it('应该正确处理可选字段标记', () => {
    const value = { id: 1, name: 'John' }
    const optionalMarkers = new Set(['name'])
    const result = generateTypeScript(value, { rootName: 'User', optionalMarkers })
    expect(result.code).toContain('id: number')
    expect(result.code).toContain('name?: string')
  })

  it('应该正确处理 null 值字段', () => {
    const value = { id: 1, avatar: null }
    const result = generateTypeScript(value, { rootName: 'User' })
    expect(result.code).toContain('avatar: any | null')
  })

  it('PREFER_TYPE 模式应该在深度超过阈值时使用 type', () => {
    const value = {
      level1: {
        level2: {
          level3: {
            level4: {
              deep: true,
            },
          },
        },
      },
    }
    const result = generateTypeScript(value, {
      rootName: 'Root',
      mode: TYPE_MODE.PREFER_TYPE,
      depthThreshold: 3,
    })
    expect(result.code).toContain('export interface Root')
    expect(result.code).toContain('export type')
  })

  it('INTERFACE_ONLY 模式应该全部使用 interface', () => {
    const value = {
      level1: {
        level2: {
          level3: {
            level4: {
              deep: true,
            },
          },
        },
      },
    }
    const result = generateTypeScript(value, {
      rootName: 'Root',
      mode: TYPE_MODE.INTERFACE_ONLY,
      depthThreshold: 3,
    })
    const typeCount = (result.code.match(/export type/g) || []).length
    const interfaceCount = (result.code.match(/export interface/g) || []).length
    expect(interfaceCount).toBeGreaterThan(0)
    expect(typeCount).toBe(0)
  })

  it('应该正确处理多对象数组中的可选字段', () => {
    const value = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane' },
    ]
    const result = generateTypeScript(value, { rootName: 'User' })
    expect(result.code).toContain('id: number')
    expect(result.code).toContain('name: string')
    expect(result.code).toContain('email?:')
  })

  it('应该正确处理空对象', () => {
    const value = {}
    const result = generateTypeScript(value, { rootName: 'Empty' })
    expect(result.code).toContain('export type Empty = Record<string, any>')
  })

  it('应该正确处理空数组', () => {
    const value = []
    const result = generateTypeScript(value, { rootName: 'Empty' })
    expect(result.code).toContain('export type EmptyList = any[]')
  })

  it('undefined 值应该返回空代码', () => {
    const result = generateTypeScript(undefined, { rootName: 'Test' })
    expect(result.code).toBe('')
    expect(result.typeDefs).toEqual([])
  })

  it('应该正确应用自定义类型名称', () => {
    const value = { id: 1, name: 'John' }
    const customNames = { RootType: 'MyUser' }
    const result = generateTypeScript(value, { rootName: 'RootType', customNames })
    expect(result.code).toContain('export interface MyUser')
    expect(result.rootTypeName).toBe('MyUser')
  })

  it('应该正确应用嵌套对象的自定义类型名称', () => {
    const value = {
      id: 1,
      name: 'John',
      address: {
        city: 'Beijing',
        country: 'China',
      },
    }
    const customNames = { RootType: 'User', RootTypeAddress: 'UserAddress' }
    const result = generateTypeScript(value, { rootName: 'RootType', customNames })
    expect(result.code).toContain('export interface User')
    expect(result.code).toContain('export interface UserAddress')
    expect(result.code).toContain('address: UserAddress')
  })

  it('应该正确应用数组根类型的自定义名称', () => {
    const value = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]
    const customNames = { RootType: 'User', RootTypeList: 'UserList' }
    const result = generateTypeScript(value, { rootName: 'RootType', customNames })
    expect(result.code).toContain('export interface User')
    expect(result.code).toContain('export type UserList = User[]')
    expect(result.rootListName).toBe('UserList')
  })

  it('应该正确处理特殊字符的属性名', () => {
    const value = { 'normal-key': 'value', '123key': 'value', 'has space': 'value' }
    const result = generateTypeScript(value, { rootName: 'Test' })
    expect(result.code).toContain('"normal-key"')
    expect(result.code).toContain('"123key"')
    expect(result.code).toContain('"has space"')
  })

  it('应该正确处理嵌套数组', () => {
    const value = {
      matrix: [
        [1, 2],
        [3, 4],
      ],
    }
    const result = generateTypeScript(value, { rootName: 'Test' })
    expect(result.code).toContain('matrix:')
    expect(result.code).toContain('[]')
  })

  it('根对象包含数组字段时应正确设置 rootListName', () => {
    const value = { items: [1, 2, 3] }
    const result = generateTypeScript(value, { rootName: 'RootType' })
    expect(result.rootTypeName).toBeDefined()
    expect(result.rootListName).toBeDefined()
    expect(result.rootListName).not.toBeNull()
    expect(result.code).toContain(result.rootListName)
  })

  it('根对象包含对象数组字段时应正确设置 rootListName', () => {
    const value = {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
    }
    const result = generateTypeScript(value, { rootName: 'RootType' })
    expect(result.rootListName).toBeDefined()
    expect(result.rootListName).not.toBeNull()
    expect(result.code).toContain(result.rootListName)
  })

  it('根对象包含多个数组字段时 rootListName 应为第一个数组类型', () => {
    const value = {
      numbers: [1, 2, 3],
      names: ['a', 'b'],
    }
    const result = generateTypeScript(value, { rootName: 'RootType' })
    expect(result.rootListName).toBeDefined()
    expect(result.rootListName).not.toBeNull()
  })
})

describe('truncateText', () => {
  it('短文本不应该被截断', () => {
    expect(truncateText('hello', 50)).toBe('hello')
  })

  it('长文本应该被截断并添加省略号', () => {
    const long = 'a'.repeat(100)
    const result = truncateText(long, 50)
    expect(result.length).toBe(53)
    expect(result.endsWith('...')).toBe(true)
  })

  it('默认最大长度应该为 80', () => {
    const text = 'a'.repeat(100)
    const result = truncateText(text)
    expect(result.length).toBe(83)
  })

  it('非字符串输入应该返回空字符串', () => {
    expect(truncateText(null)).toBe('')
    expect(truncateText(undefined)).toBe('')
    expect(truncateText(123)).toBe('')
  })

  it('应该清理多余的空白字符', () => {
    expect(truncateText('  hello   world  ')).toBe('hello world')
  })
})

describe('getJsonPreviewSummary', () => {
  it('应该生成 JSON 预览摘要（移除注释和多余空格）', () => {
    const json = `{
  // 这是注释
  "id": 1,
  "name": "John",
  /* 多行注释不会被移除 */
  "tags": ["a", "b"]
}`
    const result = getJsonPreviewSummary(json, 50)
    expect(result).not.toContain('//')
    expect(result).toContain('"id"')
    expect(result).toContain('"name"')
  })

  it('空字符串或非字符串输入应该返回空字符串', () => {
    expect(getJsonPreviewSummary('')).toBe('')
    expect(getJsonPreviewSummary(null)).toBe('')
    expect(getJsonPreviewSummary(undefined)).toBe('')
  })

  it('长 JSON 应该被截断到指定长度', () => {
    const json = '{"a": ' + '1234567890'.repeat(20) + '}'
    const result = getJsonPreviewSummary(json, 50)
    expect(result.length).toBeLessThanOrEqual(53)
    expect(result.endsWith('...')).toBe(true)
  })
})

describe('递归深度限制', () => {
  it('处理超过最大递归深度的嵌套对象不应崩溃', () => {
    const buildDeepObject = (depth) => {
      let obj = { value: 'leaf' }
      for (let i = 0; i < depth; i++) {
        obj = { nested: obj }
      }
      return obj
    }
    const deepObj = buildDeepObject(200)
    expect(() => {
      const result = generateTypeScript(deepObj, { rootName: 'Deep' })
      expect(result).toBeDefined()
      expect(typeof result.code).toBe('string')
    }).not.toThrow()
  })

  it('处理超过最大递归深度的嵌套数组不应崩溃', () => {
    const buildDeepArray = (depth) => {
      let arr = [1]
      for (let i = 0; i < depth; i++) {
        arr = [arr]
      }
      return arr
    }
    const deepArr = buildDeepArray(200)
    expect(() => {
      const result = generateTypeScript(deepArr, { rootName: 'Deep' })
      expect(result).toBeDefined()
      expect(typeof result.code).toBe('string')
    }).not.toThrow()
  })

  it('超过深度限制的嵌套对象字段应停止生成子类型', () => {
    const buildDeepObject = (depth) => {
      let obj = { value: 'leaf' }
      for (let i = 0; i < depth; i++) {
        obj = { nested: obj }
      }
      return obj
    }
    const deepObj = buildDeepObject(30)
    const result = generateTypeScript(deepObj, { rootName: 'Deep' })
    const lines = result.code.split('\n')
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.length).toBeLessThan(200)
  })

  it('深层嵌套中的数组字段应保留 any[] 类型而非退化为 any', () => {
    const buildDeepWithArray = (depth) => {
      let obj = { items: [1, 2, 3] }
      for (let i = 0; i < depth; i++) {
        obj = { nested: obj }
      }
      return obj
    }
    const deepObj = buildDeepWithArray(50)
    const result = generateTypeScript(deepObj, { rootName: 'Deep' })
    expect(result).toBeDefined()
    const arrayFields = result.code.split('\n').filter((line) => line.includes('items:'))
    expect(arrayFields.length).toBeGreaterThan(0)
    expect(arrayFields[0]).toContain('[]')
    expect(arrayFields[0]).not.toMatch(/items:\s*any\s*[;}]?$/)
  })

  it('深层嵌套中的数组字段在 inferObjectFieldSchemas 中应保留 hasArray 标记和 [] 类型', () => {
    const obj = { items: [1, 2, 3] }
    const result = inferObjectFieldSchemas([obj], 'Test', 200)
    expect(result.items).toBeDefined()
    expect(result.items.hasArray).toBe(true)
    expect(result.items.type).toContain('[]')
    expect(result.items.type).not.toBe('any')
  })

  it('inferArrayItemType 在深度限制附近嵌套数组应正确处理', () => {
    const arrays = [[[1, 2]]]
    const result = inferArrayItemType(arrays, 'Test', 49)
    expect(result).toContain('[]')
    expect(result).not.toBe('any')
  })

  it('inferArrayItemType 深度超限时应返回 any（无法推断元素类型）', () => {
    const arrays = [[[1, 2]]]
    const result = inferArrayItemType(arrays, 'Test', 200)
    expect(result).toBe('any')
  })

  it('collectNestedObjects 深度限制提前返回时 buildTypeDefinitions 应正常工作', () => {
    const buildDeepObject = (depth) => {
      let obj = { value: 'leaf' }
      for (let i = 0; i < depth; i++) {
        obj = { nested: obj }
      }
      return obj
    }
    const deepObj = buildDeepObject(300)
    const result = buildTypeDefinitions(deepObj, 'Deep')
    expect(result).toBeDefined()
    expect(Array.isArray(result.typeDefs)).toBe(true)
    expect(result).toHaveProperty('listTypeName')
    expect(result).toHaveProperty('topLevelListName')
  })
})

describe('generateTypeScript - rootListName', () => {
  it('根为数组时 rootListName 应正确返回', () => {
    const value = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]
    const result = generateTypeScript(value, { rootName: 'Item' })
    expect(result.rootListName).toBe('ItemList')
    expect(result.code).toContain('export type ItemList = Item[]')
  })

  it('根为包含数组字段的对象时 rootListName 应返回顶层数组类型名', () => {
    const value = { items: [1, 2, 3] }
    const result = generateTypeScript(value, { rootName: 'RootType' })
    expect(result.rootListName).toBeDefined()
    expect(result.rootListName).not.toBeNull()
    expect(result.code).toContain('export type RootTypeItemsList =')
  })

  it('根为包含对象数组字段的对象时 rootListName 应正确返回', () => {
    const value = { items: [{ id: 1 }, { id: 2 }] }
    const result = generateTypeScript(value, { rootName: 'RootType' })
    expect(result.rootListName).toBeDefined()
    expect(result.code).toContain(`export type ${result.rootListName} =`)
  })

  it('根为纯对象（无数组字段）时 rootListName 应为 null', () => {
    const value = { id: 1, name: 'test' }
    const result = generateTypeScript(value, { rootName: 'User' })
    expect(result.rootListName).toBeNull()
  })

  it('数组字段类型应引用容器类型别名而非内联类型', () => {
    const value = { items: [1, 2, 3] }
    const result = generateTypeScript(value, { rootName: 'Root' })
    expect(result.code).toContain('items: RootItemsList')
    expect(result.code).toContain('export type RootItemsList = number[]')
  })
})

describe('copyToClipboard', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    global.navigator = originalNavigator
    delete global.document
  })

  it('SSR 环境（navigator 未定义）应返回 false', async () => {
    delete global.navigator
    const result = await copyToClipboard('test')
    expect(result).toBe(false)
  })

  it('优先使用 navigator.clipboard.writeText API', async () => {
    let writtenText = null
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockImplementation((text) => {
          writtenText = text
          return Promise.resolve()
        }),
      },
    }
    const result = await copyToClipboard('hello clipboard')
    expect(result).toBe(true)
    expect(writtenText).toBe('hello clipboard')
    expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('hello clipboard')
  })

  it('navigator.clipboard 失败时回退到 execCommand', async () => {
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('clipboard failed')),
      },
    }
    let execCommandCalled = false
    let appendedTextarea = null
    const fakeSelection = { removeAllRanges: vi.fn(), addRange: vi.fn() }
    global.document = {
      createElement: vi.fn().mockImplementation((tag) => {
        if (tag === 'textarea') {
          appendedTextarea = { value: '', style: {}, select: vi.fn() }
          return appendedTextarea
        }
        return {}
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      getSelection: vi.fn().mockReturnValue(fakeSelection),
      createRange: vi.fn().mockReturnValue({ selectNodeContents: vi.fn() }),
      execCommand: vi.fn().mockImplementation((cmd) => {
        if (cmd === 'copy') {
          execCommandCalled = true
          return true
        }
        return false
      }),
    }
    const result = await copyToClipboard('fallback text')
    expect(result).toBe(true)
    expect(execCommandCalled).toBe(true)
    expect(appendedTextarea).not.toBeNull()
    expect(appendedTextarea.value).toBe('fallback text')
    expect(global.document.body.appendChild).toHaveBeenCalled()
    expect(global.document.body.removeChild).toHaveBeenCalled()
  })

  it('所有复制方式都失败时应返回 false', async () => {
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('fail')),
      },
    }
    global.document = {
      createElement: vi.fn().mockReturnValue({ value: '', style: {}, select: vi.fn() }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      getSelection: vi.fn().mockReturnValue({ removeAllRanges: vi.fn(), addRange: vi.fn() }),
      createRange: vi.fn().mockReturnValue({ selectNodeContents: vi.fn() }),
      execCommand: vi.fn().mockReturnValue(false),
    }
    const result = await copyToClipboard('will fail')
    expect(result).toBe(false)
  })

  it('处理空字符串应正常工作', async () => {
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(),
      },
    }
    const result = await copyToClipboard('')
    expect(result).toBe(true)
  })

  it('navigator.clipboard 存在但无 writeText 方法时应回退到 execCommand', async () => {
    global.navigator = {
      clipboard: {},
    }
    let execCommandCalled = false
    global.document = {
      createElement: vi.fn().mockImplementation((tag) => {
        if (tag === 'textarea') {
          return { value: '', style: {}, select: vi.fn() }
        }
        return {}
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      getSelection: vi.fn().mockReturnValue({ removeAllRanges: vi.fn(), addRange: vi.fn() }),
      createRange: vi.fn().mockReturnValue({ selectNodeContents: vi.fn() }),
      execCommand: vi.fn().mockImplementation((cmd) => {
        if (cmd === 'copy') {
          execCommandCalled = true
          return true
        }
        return false
      }),
    }
    const result = await copyToClipboard('no writeText')
    expect(result).toBe(true)
    expect(execCommandCalled).toBe(true)
  })

  it('navigator.clipboard.writeText 同步抛异常时应回退到 execCommand', async () => {
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => {
          throw new Error('sync error')
        }),
      },
    }
    let execCommandCalled = false
    global.document = {
      createElement: vi.fn().mockReturnValue({ value: '', style: {}, select: vi.fn() }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      getSelection: vi.fn().mockReturnValue({ removeAllRanges: vi.fn(), addRange: vi.fn() }),
      createRange: vi.fn().mockReturnValue({ selectNodeContents: vi.fn() }),
      execCommand: vi.fn().mockImplementation(() => {
        execCommandCalled = true
        return true
      }),
    }
    const result = await copyToClipboard('sync throw')
    expect(result).toBe(true)
    expect(execCommandCalled).toBe(true)
  })

  it('document.execCommand 抛异常时应返回 false', async () => {
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('fail')),
      },
    }
    global.document = {
      createElement: vi.fn().mockReturnValue({ value: '', style: {}, select: vi.fn() }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      getSelection: vi.fn().mockReturnValue({ removeAllRanges: vi.fn(), addRange: vi.fn() }),
      createRange: vi.fn().mockReturnValue({ selectNodeContents: vi.fn() }),
      execCommand: vi.fn().mockImplementation(() => {
        throw new Error('execCommand error')
      }),
    }
    const result = await copyToClipboard('will fail')
    expect(result).toBe(false)
  })

  it('navigator 存在但 document 不存在时应返回 false', async () => {
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('fail')),
      },
    }
    delete global.document
    const result = await copyToClipboard('no document')
    expect(result).toBe(false)
  })
})

describe('downloadTsFile', () => {
  const originalDocument = global.document
  const originalWindow = global.window
  const originalURL = global.URL

  afterEach(() => {
    global.document = originalDocument
    global.window = originalWindow
    global.URL = originalURL
    vi.restoreAllMocks()
  })

  it('SSR 环境（document/window 未定义）应返回 false', () => {
    delete global.document
    delete global.window
    const result = downloadTsFile('export type A = string')
    expect(result).toBe(false)
  })

  it('应正确创建 Blob 并触发下载', () => {
    const mockBlob = vi.fn()
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url')
    const mockRevokeObjectURL = vi.fn()
    const mockClick = vi.fn()
    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()

    global.Blob = mockBlob
    global.URL = {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    }
    global.window = {}
    global.document = {
      createElement: vi.fn().mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
      }),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    }

    vi.useFakeTimers()

    const result = downloadTsFile('export type Foo = { id: number }', 'output.ts')

    expect(result).toBe(true)
    expect(mockBlob).toHaveBeenCalledWith(
      ['export type Foo = { id: number }'],
      { type: 'text/typescript;charset=utf-8' }
    )
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockAppendChild).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRemoveChild).toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')

    vi.useRealTimers()
  })

  it('默认文件名应为 types.ts', () => {
    const mockClick = vi.fn()
    let createdElement = null

    global.Blob = vi.fn()
    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:url'),
      revokeObjectURL: vi.fn(),
    }
    global.window = {}
    global.document = {
      createElement: vi.fn().mockImplementation((tag) => {
        createdElement = { href: '', download: '', click: mockClick }
        return createdElement
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    }

    downloadTsFile('code here')

    expect(createdElement.download).toBe('types.ts')
  })

  it('异常抛出时应返回 false', () => {
    global.window = {}
    global.document = {
      createElement: vi.fn().mockImplementation(() => {
        throw new Error('DOM error')
      }),
    }
    const result = downloadTsFile('code')
    expect(result).toBe(false)
  })

  it('Blob 构造函数缺失时应优雅降级返回 false', () => {
    global.window = {}
    global.document = { createElement: vi.fn(), body: { appendChild: vi.fn() } }
    const originalBlob = global.Blob
    delete global.Blob

    const result = downloadTsFile('code')
    expect(result).toBe(false)

    global.Blob = originalBlob
  })

  it('document 存在但 window 未定义时应返回 false', () => {
    delete global.window
    global.document = { createElement: vi.fn(), body: { appendChild: vi.fn() } }
    const result = downloadTsFile('code')
    expect(result).toBe(false)
  })

  it('window 存在但 document 未定义时应返回 false', () => {
    delete global.document
    global.window = {}
    const result = downloadTsFile('code')
    expect(result).toBe(false)
  })

  it('URL.createObjectURL 抛异常时应返回 false', () => {
    global.Blob = vi.fn()
    global.URL = {
      createObjectURL: vi.fn().mockImplementation(() => {
        throw new Error('URL error')
      }),
      revokeObjectURL: vi.fn(),
    }
    global.window = {}
    global.document = {
      createElement: vi.fn().mockReturnValue({ href: '', download: '', click: vi.fn() }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    }
    const result = downloadTsFile('code')
    expect(result).toBe(false)
  })

  it('document.body.appendChild 抛异常时应返回 false', () => {
    global.Blob = vi.fn()
    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:url'),
      revokeObjectURL: vi.fn(),
    }
    global.window = {}
    global.document = {
      createElement: vi.fn().mockReturnValue({ href: '', download: '', click: vi.fn() }),
      body: {
        appendChild: vi.fn().mockImplementation(() => {
          throw new Error('append error')
        }),
        removeChild: vi.fn(),
      },
    }
    const result = downloadTsFile('code')
    expect(result).toBe(false)
  })

  it('自定义文件名应正确设置', () => {
    const mockClick = vi.fn()
    let createdElement = null

    global.Blob = vi.fn()
    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:url'),
      revokeObjectURL: vi.fn(),
    }
    global.window = {}
    global.document = {
      createElement: vi.fn().mockImplementation((tag) => {
        createdElement = { href: '', download: '', click: mockClick }
        return createdElement
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    }

    downloadTsFile('code here', 'my-custom-types.ts')

    expect(createdElement.download).toBe('my-custom-types.ts')
  })
})
