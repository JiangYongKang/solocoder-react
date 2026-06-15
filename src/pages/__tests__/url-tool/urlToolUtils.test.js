/* eslint-disable no-undef */
import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  parseUrl,
  parseQueryParams,
  buildQueryString,
  buildUrl,
  urlEncode,
  urlDecode,
  encodeQueryParamsOnly,
  base64Encode,
  base64Decode,
  queryParamsToJson,
  jsonToQueryParams,
  parseBatchUrls,
  exportToCsv,
  downloadCsvFile,
  copyToClipboard,
} from '../../url-tool/urlToolUtils'

describe('parseUrl', () => {
  it('应该正确解析完整的 URL', () => {
    const url = 'https://www.example.com:8080/path/to/page?name=value&id=1#section'
    const result = parseUrl(url)
    expect(result.success).toBe(true)
    expect(result.protocol).toBe('https:')
    expect(result.hostname).toBe('www.example.com')
    expect(result.port).toBe('8080')
    expect(result.pathname).toBe('/path/to/page')
    expect(result.search).toBe('?name=value&id=1')
    expect(result.hash).toBe('#section')
  })

  it('应该处理没有端口号的 URL', () => {
    const url = 'https://www.example.com/path'
    const result = parseUrl(url)
    expect(result.success).toBe(true)
    expect(result.port).toBe('')
  })

  it('应该处理没有查询参数的 URL', () => {
    const url = 'https://www.example.com/path'
    const result = parseUrl(url)
    expect(result.success).toBe(true)
    expect(result.search).toBe('')
  })

  it('应该处理没有哈希的 URL', () => {
    const url = 'https://www.example.com/path'
    const result = parseUrl(url)
    expect(result.success).toBe(true)
    expect(result.hash).toBe('')
  })

  it('应该处理根路径 URL', () => {
    const url = 'https://www.example.com/'
    const result = parseUrl(url)
    expect(result.success).toBe(true)
    expect(result.pathname).toBe('/')
  })

  it('空字符串或非字符串输入应该返回错误', () => {
    expect(parseUrl('').success).toBe(false)
    expect(parseUrl('   ').success).toBe(false)
    expect(parseUrl(null).success).toBe(false)
    expect(parseUrl(undefined).success).toBe(false)
  })

  it('无效 URL 应该返回错误', () => {
    const result = parseUrl('not-a-valid-url')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('parseQueryParams', () => {
  it('应该正确解析查询参数字符串', () => {
    const params = parseQueryParams('?name=value&id=1')
    expect(params).toHaveLength(2)
    expect(params[0]).toEqual({ key: 'name', value: 'value' })
    expect(params[1]).toEqual({ key: 'id', value: '1' })
  })

  it('应该处理不带问号的查询字符串', () => {
    const params = parseQueryParams('name=value&id=1')
    expect(params).toHaveLength(2)
    expect(params[0]).toEqual({ key: 'name', value: 'value' })
  })

  it('应该解码 URL 编码的参数值', () => {
    const params = parseQueryParams('?keyword=hello%20world&email=test%40example.com')
    expect(params).toHaveLength(2)
    expect(params[0]).toEqual({ key: 'keyword', value: 'hello world' })
    expect(params[1]).toEqual({ key: 'email', value: 'test@example.com' })
  })

  it('应该处理加号作为空格', () => {
    const params = parseQueryParams('?keyword=hello+world')
    expect(params[0]).toEqual({ key: 'keyword', value: 'hello world' })
  })

  it('应该处理空值参数', () => {
    const params = parseQueryParams('?name=&id=1')
    expect(params[0]).toEqual({ key: 'name', value: '' })
    expect(params[1]).toEqual({ key: 'id', value: '1' })
  })

  it('应该处理只有键没有等号的参数', () => {
    const params = parseQueryParams('?flag')
    expect(params[0]).toEqual({ key: 'flag', value: '' })
  })

  it('空字符串或非字符串输入应该返回空数组', () => {
    expect(parseQueryParams('')).toEqual([])
    expect(parseQueryParams('   ')).toEqual([])
    expect(parseQueryParams(null)).toEqual([])
    expect(parseQueryParams(undefined)).toEqual([])
  })

  it('应该处理特殊字符的键名', () => {
    const params = parseQueryParams('?user%5Bname%5D=John')
    expect(params[0]).toEqual({ key: 'user[name]', value: 'John' })
  })

  it('应该跳过空的参数对', () => {
    const params = parseQueryParams('?a=1&&b=2')
    expect(params).toHaveLength(2)
    expect(params[0].key).toBe('a')
    expect(params[1].key).toBe('b')
  })
})

describe('buildQueryString', () => {
  it('应该从参数数组构建查询字符串', () => {
    const params = [
      { key: 'name', value: 'value' },
      { key: 'id', value: '1' },
    ]
    const result = buildQueryString(params)
    expect(result).toBe('?name=value&id=1')
  })

  it('应该对参数值进行 URL 编码', () => {
    const params = [
      { key: 'keyword', value: 'hello world' },
      { key: 'email', value: 'test@example.com' },
    ]
    const result = buildQueryString(params)
    expect(result).toBe('?keyword=hello+world&email=test%40example.com')
  })

  it('空数组应该返回空字符串', () => {
    expect(buildQueryString([])).toBe('')
  })

  it('非数组输入应该返回空字符串', () => {
    expect(buildQueryString(null)).toBe('')
    expect(buildQueryString(undefined)).toBe('')
    expect(buildQueryString('not-array')).toBe('')
  })

  it('应该跳过键和值都为空的参数', () => {
    const params = [
      { key: 'name', value: 'value' },
      { key: '', value: '' },
    ]
    const result = buildQueryString(params)
    expect(result).toBe('?name=value')
  })

  it('应该处理空值参数', () => {
    const params = [{ key: 'name', value: '' }]
    const result = buildQueryString(params)
    expect(result).toBe('?name=')
  })
})

describe('buildUrl', () => {
  it('应该从各部分构建完整 URL', () => {
    const parts = {
      protocol: 'https:',
      hostname: 'www.example.com',
      port: '8080',
      pathname: '/path/to/page',
      search: '?name=value',
      hash: '#section',
    }
    const url = buildUrl(parts)
    expect(url).toBe('https://www.example.com:8080/path/to/page?name=value#section')
  })

  it('应该处理没有端口号的情况', () => {
    const parts = {
      protocol: 'https:',
      hostname: 'www.example.com',
      port: '',
      pathname: '/path',
      search: '',
      hash: '',
    }
    const url = buildUrl(parts)
    expect(url).toBe('https://www.example.com/path')
  })

  it('应该处理协议末尾没有双斜杠的情况', () => {
    const parts = {
      protocol: 'https:',
      hostname: 'www.example.com',
      port: '',
      pathname: '/path',
      search: '',
      hash: '',
    }
    const url = buildUrl(parts)
    expect(url).toBe('https://www.example.com/path')
  })

  it('应该处理没有前导斜杠的路径', () => {
    const parts = {
      protocol: 'https:',
      hostname: 'www.example.com',
      port: '',
      pathname: 'path/to/page',
      search: '',
      hash: '',
    }
    const url = buildUrl(parts)
    expect(url).toBe('https://www.example.com/path/to/page')
  })

  it('应该处理没有前导问号的查询字符串', () => {
    const parts = {
      protocol: 'https:',
      hostname: 'www.example.com',
      port: '',
      pathname: '/path',
      search: 'name=value',
      hash: '',
    }
    const url = buildUrl(parts)
    expect(url).toBe('https://www.example.com/path?name=value')
  })

  it('应该处理没有前导井号的哈希', () => {
    const parts = {
      protocol: 'https:',
      hostname: 'www.example.com',
      port: '',
      pathname: '/path',
      search: '',
      hash: 'section',
    }
    const url = buildUrl(parts)
    expect(url).toBe('https://www.example.com/path#section')
  })

  it('只有主机名时应该添加根路径', () => {
    const parts = {
      protocol: 'https:',
      hostname: 'www.example.com',
      port: '',
      pathname: '',
      search: '',
      hash: '',
    }
    const url = buildUrl(parts)
    expect(url).toBe('https://www.example.com/')
  })
})

describe('urlEncode', () => {
  it('应该对可解析 URL 的组件值编码但保留结构符号', () => {
    const url = 'https://www.example.com/path/to/page?name=hello world&keyword=你好#section name'
    const result = urlEncode(url)
    expect(result.success).toBe(true)
    expect(result.result).toContain('https://')
    expect(result.result).toContain('www.example.com')
    expect(result.result).toContain('/path/to/page')
    expect(result.result).toContain('?')
    expect(result.result).toContain('#')
    expect(result.result).toContain('name=hello%20world')
    expect(result.result).toContain('keyword=')
  })

  it('编码后的 URL 应该仍可被 parseUrl 解析', () => {
    const url = 'https://www.example.com/path?name=hello world&keyword=测试#片段'
    const result = urlEncode(url)
    expect(result.success).toBe(true)
    const parsed = parseUrl(result.result)
    expect(parsed.success).toBe(true)
    expect(parsed.hostname).toBe('www.example.com')
    expect(parsed.search).toContain('name=hello%20world')
  })

  it('对不可解析的字符串应回退到整体 encodeURIComponent', () => {
    const result = urlEncode('hello world!@#$%^&*()')
    expect(result.success).toBe(true)
    expect(result.result).toBe('hello%20world!%40%23%24%25%5E%26*()')
  })

  it('应该编码路径段中的特殊字符', () => {
    const url = 'https://example.com/路径/页面?q=值'
    const result = urlEncode(url)
    expect(result.success).toBe(true)
    expect(result.result).toContain('https://example.com/')
    expect(result.result).toContain('%E8%B7%AF%E5%BE%84')
  })

  it('应该编码哈希片段中的特殊字符', () => {
    const url = 'https://example.com/path#片段 名称'
    const result = urlEncode(url)
    expect(result.success).toBe(true)
    expect(result.result).toContain('#%E7%89%87%E6%AE%B5%20%E5%90%8D%E7%A7%B0')
  })

  it('非字符串输入应该返回错误', () => {
    expect(urlEncode(null).success).toBe(false)
    expect(urlEncode(undefined).success).toBe(false)
    expect(urlEncode(123).success).toBe(false)
  })

  it('没有查询参数和哈希的 URL 应该只编码路径', () => {
    const url = 'https://example.com/path/to/page'
    const result = urlEncode(url)
    expect(result.success).toBe(true)
    expect(result.result).toBe('https://example.com/path/to/page')
  })

  it('空查询参数值的 URL 应该正确编码', () => {
    const url = 'https://example.com/path?key='
    const result = urlEncode(url)
    expect(result.success).toBe(true)
    expect(result.result).toContain('key=')
  })
})

describe('urlDecode', () => {
  it('应该正确 URL 解码字符串', () => {
    const result = urlDecode('hello%20world%21%40%23')
    expect(result.success).toBe(true)
    expect(result.result).toBe('hello world!@#')
  })

  it('应该解码中文字符', () => {
    const result = urlDecode('%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C')
    expect(result.success).toBe(true)
    expect(result.result).toBe('你好世界')
  })

  it('应该将加号解码为空格', () => {
    const result = urlDecode('hello+world')
    expect(result.success).toBe(true)
    expect(result.result).toBe('hello world')
  })

  it('非字符串输入应该返回错误', () => {
    expect(urlDecode(null).success).toBe(false)
    expect(urlDecode(undefined).success).toBe(false)
    expect(urlDecode(123).success).toBe(false)
  })

  it('无效的编码序列应该返回错误', () => {
    const result = urlDecode('%E%A')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('encodeQueryParamsOnly', () => {
  it('应该只编码查询参数部分', () => {
    const url = 'https://www.example.com/path?name=hello world&keyword=测试'
    const result = encodeQueryParamsOnly(url)
    expect(result.success).toBe(true)
    expect(result.result).toContain('name=hello+world')
    expect(result.result).toContain('keyword=%E6%B5%8B%E8%AF%95')
    expect(result.result).toContain('https://www.example.com/path')
  })

  it('空 URL 应该返回错误', () => {
    const result = encodeQueryParamsOnly('')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('无效 URL 应该返回错误', () => {
    const result = encodeQueryParamsOnly('not-a-url')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('没有查询参数的 URL 应该保持不变', () => {
    const url = 'https://www.example.com/path'
    const result = encodeQueryParamsOnly(url)
    expect(result.success).toBe(true)
    expect(result.result).toBe('https://www.example.com/path')
  })
})

describe('base64Encode', () => {
  it('应该正确 Base64 编码字符串', () => {
    const result = base64Encode('Hello World')
    expect(result.success).toBe(true)
    expect(result.result).toBe('SGVsbG8gV29ybGQ=')
  })

  it('应该编码中文字符', () => {
    const result = base64Encode('你好世界')
    expect(result.success).toBe(true)
    expect(result.result).toBe('5L2g5aW95LiW55WM')
  })

  it('非字符串输入应该返回错误', () => {
    expect(base64Encode(null).success).toBe(false)
    expect(base64Encode(undefined).success).toBe(false)
    expect(base64Encode(123).success).toBe(false)
  })

  it('应该编码特殊字符', () => {
    const result = base64Encode('!@#$%^&*()')
    expect(result.success).toBe(true)
    expect(result.result).toBe('IUAjJCVeJiooKQ==')
  })

  it('空字符串应该返回空 Base64', () => {
    const result = base64Encode('')
    expect(result.success).toBe(true)
    expect(result.result).toBe('')
  })
})

describe('base64Decode', () => {
  it('应该正确 Base64 解码字符串', () => {
    const result = base64Decode('SGVsbG8gV29ybGQ=')
    expect(result.success).toBe(true)
    expect(result.result).toBe('Hello World')
  })

  it('应该解码中文字符', () => {
    const result = base64Decode('5L2g5aW95LiW55WM')
    expect(result.success).toBe(true)
    expect(result.result).toBe('你好世界')
  })

  it('空字符串应该返回错误', () => {
    const result = base64Decode('')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('空白字符串应该返回错误', () => {
    const result = base64Decode('   ')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('非字符串输入应该返回错误', () => {
    expect(base64Decode(null).success).toBe(false)
    expect(base64Decode(undefined).success).toBe(false)
    expect(base64Decode(123).success).toBe(false)
  })

  it('无效的 Base64 字符串应该返回错误', () => {
    const result = base64Decode('!!!invalid!!!')
    expect(result.success).toBe(false)
    expect(result.error).toBe('非法的 Base64 字符串')
  })

  it('应该忽略前后空白字符', () => {
    const result = base64Decode('  SGVsbG8gV29ybGQ=  ')
    expect(result.success).toBe(true)
    expect(result.result).toBe('Hello World')
  })
})

describe('queryParamsToJson', () => {
  it('应该将参数数组转换为 JSON 字符串', () => {
    const params = [
      { key: 'name', value: 'value' },
      { key: 'id', value: '1' },
    ]
    const result = queryParamsToJson(params)
    expect(result.success).toBe(true)
    expect(JSON.parse(result.result)).toEqual({ name: 'value', id: '1' })
  })

  it('应该处理空值参数', () => {
    const params = [{ key: 'name', value: '' }]
    const result = queryParamsToJson(params)
    expect(result.success).toBe(true)
    expect(JSON.parse(result.result)).toEqual({ name: '' })
  })

  it('应该跳过空键名的参数', () => {
    const params = [
      { key: 'name', value: 'value' },
      { key: '', value: 'ignored' },
    ]
    const result = queryParamsToJson(params)
    expect(result.success).toBe(true)
    expect(JSON.parse(result.result)).toEqual({ name: 'value' })
  })

  it('空数组应该返回空对象的 JSON', () => {
    const result = queryParamsToJson([])
    expect(result.success).toBe(true)
    expect(JSON.parse(result.result)).toEqual({})
  })

  it('非数组输入应该返回错误', () => {
    expect(queryParamsToJson(null).success).toBe(false)
    expect(queryParamsToJson(undefined).success).toBe(false)
    expect(queryParamsToJson('not-array').success).toBe(false)
  })

  it('生成的 JSON 应该格式化输出', () => {
    const params = [{ key: 'name', value: 'value' }]
    const result = queryParamsToJson(params)
    expect(result.result).toContain('\n')
    expect(result.result).toContain('  ')
  })
})

describe('jsonToQueryParams', () => {
  it('应该将 JSON 对象字符串转换为参数数组', () => {
    const json = '{"name":"value","id":"1"}'
    const result = jsonToQueryParams(json)
    expect(result.success).toBe(true)
    expect(result.params).toHaveLength(2)
    expect(result.params).toContainEqual({ key: 'name', value: 'value' })
    expect(result.params).toContainEqual({ key: 'id', value: '1' })
  })

  it('应该将非字符串值转换为字符串', () => {
    const json = '{"count":42,"active":true,"nullValue":null}'
    const result = jsonToQueryParams(json)
    expect(result.success).toBe(true)
    expect(result.params).toContainEqual({ key: 'count', value: '42' })
    expect(result.params).toContainEqual({ key: 'active', value: 'true' })
    expect(result.params).toContainEqual({ key: 'nullValue', value: '' })
  })

  it('空字符串应该返回错误', () => {
    const result = jsonToQueryParams('')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('无效 JSON 应该返回错误', () => {
    const result = jsonToQueryParams('{invalid json}')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('非对象 JSON 应该返回错误', () => {
    const result = jsonToQueryParams('[1,2,3]')
    expect(result.success).toBe(false)
    expect(result.error).toBe('JSON 必须是对象类型')
  })

  it('null JSON 应该返回错误', () => {
    const result = jsonToQueryParams('null')
    expect(result.success).toBe(false)
    expect(result.error).toBe('JSON 必须是对象类型')
  })

  it('应该返回语法错误的行号', () => {
    const badJson = `{
  "name": "John",
  age: 30
}`
    const result = jsonToQueryParams(badJson)
    expect(result.success).toBe(false)
    expect(result.line).toBeDefined()
    expect(result.line).toBeGreaterThan(0)
  })

  it('非字符串输入应该返回错误', () => {
    expect(jsonToQueryParams(null).success).toBe(false)
    expect(jsonToQueryParams(undefined).success).toBe(false)
  })
})

describe('parseBatchUrls', () => {
  it('应该批量解析多个 URL', () => {
    const input = `https://www.example.com/path?a=1
https://test.org/page?id=2`
    const result = parseBatchUrls(input)
    expect(result.success).toBe(true)
    expect(result.results).toHaveLength(2)
    expect(result.results[0].success).toBe(true)
    expect(result.results[0].protocol).toBe('https:')
    expect(result.results[0].hostname).toBe('www.example.com')
    expect(result.results[0].paramCount).toBe(1)
    expect(result.results[1].success).toBe(true)
    expect(result.results[1].hostname).toBe('test.org')
  })

  it('空输入应该返回错误', () => {
    const result = parseBatchUrls('')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('空白输入应该返回错误', () => {
    const result = parseBatchUrls('   ')
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('应该标记无效的 URL', () => {
    const input = `https://www.example.com
not-a-valid-url
https://test.org`
    const result = parseBatchUrls(input)
    expect(result.success).toBe(true)
    expect(result.results).toHaveLength(3)
    expect(result.results[0].success).toBe(true)
    expect(result.results[1].success).toBe(false)
    expect(result.results[1].error).toBeDefined()
    expect(result.results[2].success).toBe(true)
  })

  it('空行应该标记为失败', () => {
    const input = `https://www.example.com

https://test.org`
    const result = parseBatchUrls(input)
    expect(result.success).toBe(true)
    expect(result.results).toHaveLength(3)
    expect(result.results[0].success).toBe(true)
    expect(result.results[1].success).toBe(false)
    expect(result.results[1].error).toBe('空行')
    expect(result.results[2].success).toBe(true)
  })

  it('应该正确统计参数个数', () => {
    const input = 'https://www.example.com/path?a=1&b=2&c=3'
    const result = parseBatchUrls(input)
    expect(result.success).toBe(true)
    expect(result.results[0].paramCount).toBe(3)
  })

  it('非字符串输入应该返回错误', () => {
    const result = parseBatchUrls(null)
    expect(result.success).toBe(false)
  })
})

describe('exportToCsv', () => {
  it('应该将结果导出为 CSV 格式', () => {
    const results = [
      {
        index: 1,
        url: 'https://www.example.com/path?a=1',
        protocol: 'https:',
        hostname: 'www.example.com',
        pathname: '/path',
        paramCount: 1,
        success: true,
        error: null,
      },
      {
        index: 2,
        url: 'invalid-url',
        protocol: '',
        hostname: '',
        pathname: '',
        paramCount: 0,
        success: false,
        error: '解析失败',
      },
    ]
    const result = exportToCsv(results)
    expect(result.success).toBe(true)
    expect(result.content).toContain('序号')
    expect(result.content).toContain('完整 URL')
    expect(result.content).toContain('https://www.example.com/path?a=1')
    expect(result.content).toContain('成功')
    expect(result.content).toContain('失败')
    expect(result.content).toContain('解析失败')
    expect(result.content).toContain('\uFEFF')
  })

  it('空数组应该返回错误', () => {
    const result = exportToCsv([])
    expect(result.success).toBe(false)
    expect(result.error).toBe('没有数据可导出')
  })

  it('非数组输入应该返回错误', () => {
    expect(exportToCsv(null).success).toBe(false)
    expect(exportToCsv(undefined).success).toBe(false)
  })

  it('应该正确转义包含逗号的字段', () => {
    const results = [
      {
        index: 1,
        url: 'https://www.example.com/path?name=hello,world',
        protocol: 'https:',
        hostname: 'www.example.com',
        pathname: '/path',
        paramCount: 1,
        success: true,
        error: null,
      },
    ]
    const result = exportToCsv(results)
    expect(result.success).toBe(true)
    expect(result.content).toContain('"https://www.example.com/path?name=hello,world"')
  })

  it('应该正确转义包含引号的字段', () => {
    const results = [
      {
        index: 1,
        url: 'https://www.example.com/path?name="test"',
        protocol: 'https:',
        hostname: 'www.example.com',
        pathname: '/path',
        paramCount: 1,
        success: true,
        error: null,
      },
    ]
    const result = exportToCsv(results)
    expect(result.success).toBe(true)
    expect(result.content).toContain('"https://www.example.com/path?name=""test"""')
  })

  it('应该使用 CRLF 作为行分隔符', () => {
    const results = [
      {
        index: 1,
        url: 'https://a.com',
        protocol: 'https:',
        hostname: 'a.com',
        pathname: '/',
        paramCount: 0,
        success: true,
        error: null,
      },
      {
        index: 2,
        url: 'https://b.com',
        protocol: 'https:',
        hostname: 'b.com',
        pathname: '/',
        paramCount: 0,
        success: true,
        error: null,
      },
    ]
    const result = exportToCsv(results)
    expect(result.success).toBe(true)
    expect(result.content).toContain('\r\n')
  })
})

describe('downloadCsvFile', () => {
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
    const result = downloadCsvFile('test content')
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

    const result = downloadCsvFile('csv content here', 'output.csv')

    expect(result).toBe(true)
    expect(mockBlob).toHaveBeenCalledWith(
      ['csv content here'],
      { type: 'text/csv;charset=utf-8' }
    )
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockAppendChild).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRemoveChild).toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')

    vi.useRealTimers()
  })

  it('默认文件名应为 url-parse-results.csv', () => {
    const mockClick = vi.fn()
    let createdElement = null

    global.Blob = vi.fn()
    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:url'),
      revokeObjectURL: vi.fn(),
    }
    global.window = {}
    global.document = {
      createElement: vi.fn().mockImplementation(() => {
        createdElement = { href: '', download: '', click: mockClick }
        return createdElement
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    }

    downloadCsvFile('content')
    expect(createdElement.download).toBe('url-parse-results.csv')
  })

  it('异常抛出时应返回 false', () => {
    global.window = {}
    global.document = {
      createElement: vi.fn().mockImplementation(() => {
        throw new Error('DOM error')
      }),
    }
    const result = downloadCsvFile('content')
    expect(result).toBe(false)
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
    global.document = {
      createElement: vi.fn().mockImplementation((tag) => {
        if (tag === 'textarea') {
          appendedTextarea = { value: '', style: {}, select: vi.fn() }
          return appendedTextarea
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
})
