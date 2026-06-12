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
    const defs = buildTypeDefinitions(value, 'User')
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
    const defs = buildTypeDefinitions(value, 'User')
    const listDef = defs.find((d) => d.isArray)
    expect(listDef).toBeDefined()
    expect(listDef.name).toBe('UserList')
    expect(listDef.itemType).toBe('User')
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
    const defs = buildTypeDefinitions(value, 'User')
    const addressDef = defs.find((d) => d.name === 'UserAddress')
    expect(addressDef).toBeDefined()
    expect(addressDef.fields.city).toBeDefined()
  })

  it('应该处理空对象为 Record<string, any>', () => {
    const value = {}
    const defs = buildTypeDefinitions(value, 'Empty')
    expect(defs[0].isRecord).toBe(true)
  })

  it('应该处理空数组为 any[]', () => {
    const value = []
    const defs = buildTypeDefinitions(value, 'Empty')
    expect(defs[0].isArray).toBe(true)
    expect(defs[0].itemType).toBe('any')
  })

  it('应该尊重自定义类型名称', () => {
    const value = { id: 1, name: 'John' }
    const customNames = { RootType: 'MyCustomType' }
    const defs = buildTypeDefinitions(value, 'RootType', customNames)
    expect(defs[0].name).toBe('MyCustomType')
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
