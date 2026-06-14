import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  escapeHtml,
  getKeywords,
  highlightSyntax,
  handleTabKey,
  handleBracketCompletion,
  executePythonCode,
  executeJavaScriptCode,
  executeCode,
  formatOutputLines,
  measureExecution,
} from '@/pages/code-sandbox/codeSandboxUtils'
import { LANGUAGES, JS_KEYWORDS, PYTHON_KEYWORDS, HIGHLIGHT_COLORS, OUTPUT_LINE_PREFIX } from '@/pages/code-sandbox/constants'
import {
  loadSnippets,
  saveSnippets,
  createSnippet,
  addSnippet,
  updateSnippet,
  renameSnippet,
  deleteSnippet,
  loadHistory,
  saveHistory,
  createHistoryItem,
  addHistoryItem,
  clearHistory,
  formatTimestamp,
  truncateCode,
  countLines,
} from '@/pages/code-sandbox/storage'
import { STORAGE_KEYS, MAX_SNIPPETS, MAX_HISTORY } from '@/pages/code-sandbox/constants'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

describe('codeSandboxUtils', () => {
  describe('escapeHtml', () => {
    it('should escape & character', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b')
    })

    it('should escape < and > characters', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
    })

    it('should escape double quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
    })

    it('should escape single quotes', () => {
      expect(escapeHtml("'hello'")).toBe('&#39;hello&#39;')
    })

    it('should return empty string for non-string input', () => {
      expect(escapeHtml(null)).toBe('')
      expect(escapeHtml(undefined)).toBe('')
      expect(escapeHtml(123)).toBe('')
    })

    it('should return empty string for empty input', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('should not alter plain text', () => {
      expect(escapeHtml('hello world')).toBe('hello world')
    })
  })

  describe('getKeywords', () => {
    it('should return Python keywords for Python language', () => {
      expect(getKeywords(LANGUAGES.PYTHON)).toBe(PYTHON_KEYWORDS)
    })

    it('should return JS keywords for JavaScript language', () => {
      expect(getKeywords(LANGUAGES.JAVASCRIPT)).toBe(JS_KEYWORDS)
    })

    it('should return JS keywords for unknown language', () => {
      expect(getKeywords('unknown')).toBe(JS_KEYWORDS)
    })
  })

  describe('highlightSyntax', () => {
    it('should return empty string for empty code', () => {
      expect(highlightSyntax('', LANGUAGES.JAVASCRIPT)).toBe('')
    })

    it('should return empty string for non-string input', () => {
      expect(highlightSyntax(null, LANGUAGES.JAVASCRIPT)).toBe('')
      expect(highlightSyntax(undefined, LANGUAGES.JAVASCRIPT)).toBe('')
    })

    it('should highlight JS keywords in blue', () => {
      const result = highlightSyntax('function test() {}', LANGUAGES.JAVASCRIPT)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.keyword}`)
      expect(result).toContain('function')
    })

    it('should highlight Python keywords', () => {
      const result = highlightSyntax('def test():', LANGUAGES.PYTHON)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.keyword}`)
      expect(result).toContain('def')
    })

    it('should highlight JS single-line comments', () => {
      const result = highlightSyntax('// comment', LANGUAGES.JAVASCRIPT)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.comment}`)
    })

    it('should highlight JS multi-line comments', () => {
      const result = highlightSyntax('/* block */', LANGUAGES.JAVASCRIPT)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.comment}`)
    })

    it('should highlight Python comments', () => {
      const result = highlightSyntax('# comment', LANGUAGES.PYTHON)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.comment}`)
    })

    it('should highlight double-quoted strings', () => {
      const result = highlightSyntax('"hello"', LANGUAGES.JAVASCRIPT)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.string}`)
    })

    it('should highlight single-quoted strings', () => {
      const result = highlightSyntax("'hello'", LANGUAGES.JAVASCRIPT)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.string}`)
    })

    it('should highlight numbers', () => {
      const result = highlightSyntax('42', LANGUAGES.JAVASCRIPT)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.number}`)
    })

    it('should highlight decimal numbers', () => {
      const result = highlightSyntax('3.14', LANGUAGES.JAVASCRIPT)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.number}`)
    })

    it('should handle code with multiple token types', () => {
      const code = 'function test() { return 42; }'
      const result = highlightSyntax(code, LANGUAGES.JAVASCRIPT)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.keyword}`)
      expect(result).toContain(`color:${HIGHLIGHT_COLORS.number}`)
    })
  })

  describe('handleTabKey', () => {
    function createMockTextarea(value, selStart, selEnd) {
      return {
        key: 'Tab',
        target: {
          selectionStart: selStart,
          selectionEnd: selEnd,
          value,
        },
        preventDefault: () => {},
      }
    }

    it('should insert 2 spaces for Tab key', () => {
      const e = createMockTextarea('hello', 5, 5)
      const result = handleTabKey(e)
      expect(result.newValue).toBe('hello  ')
      expect(result.newCursorStart).toBe(7)
      expect(result.newCursorEnd).toBe(7)
    })

    it('should replace selection with 2 spaces', () => {
      const e = createMockTextarea('hello world', 5, 11)
      const result = handleTabKey(e)
      expect(result.newValue).toBe('hello  ')
      expect(result.newCursorStart).toBe(7)
      expect(result.newCursorEnd).toBe(7)
    })

    it('should return null for non-Tab key', () => {
      const e = { key: 'Enter', target: { selectionStart: 0, selectionEnd: 0, value: '' } }
      expect(handleTabKey(e)).toBeNull()
    })
  })

  describe('handleBracketCompletion', () => {
    function createMockEvent(key, value, selStart, selEnd) {
      return {
        key,
        target: {
          selectionStart: selStart,
          selectionEnd: selEnd,
          value,
        },
        preventDefault: () => {},
      }
    }

    it('should auto-complete parentheses', () => {
      const e = createMockEvent('(', 'hello', 5, 5)
      const result = handleBracketCompletion(e)
      expect(result.newValue).toBe('hello()')
      expect(result.newCursorStart).toBe(6)
      expect(result.newCursorEnd).toBe(6)
    })

    it('should auto-complete square brackets', () => {
      const e = createMockEvent('[', 'arr', 3, 3)
      const result = handleBracketCompletion(e)
      expect(result.newValue).toBe('arr[]')
      expect(result.newCursorStart).toBe(4)
    })

    it('should auto-complete curly braces', () => {
      const e = createMockEvent('{', 'code', 4, 4)
      const result = handleBracketCompletion(e)
      expect(result.newValue).toBe('code{}')
      expect(result.newCursorStart).toBe(5)
    })

    it('should wrap selected text in brackets', () => {
      const e = createMockEvent('(', 'hello world', 6, 11)
      const result = handleBracketCompletion(e)
      expect(result.newValue).toBe('hello (world)')
      expect(result.newCursorStart).toBe(7)
      expect(result.newCursorEnd).toBe(12)
    })

    it('should return null for non-bracket key', () => {
      const e = createMockEvent('a', 'hello', 5, 5)
      expect(handleBracketCompletion(e)).toBeNull()
    })

    it('should skip closing bracket when next char is same closing bracket', () => {
      const e = createMockEvent(')', 'hello()', 6, 6)
      const result = handleBracketCompletion(e)
      expect(result.newValue).toBe('hello()')
      expect(result.newCursorStart).toBe(7)
      expect(result.newCursorEnd).toBe(7)
    })

    it('should skip closing square bracket when next char is same', () => {
      const e = createMockEvent(']', 'arr[ ]', 5, 5)
      const result = handleBracketCompletion(e)
      expect(result.newValue).toBe('arr[ ]')
      expect(result.newCursorStart).toBe(6)
    })

    it('should skip closing curly brace when next char is same', () => {
      const e = createMockEvent('}', 'obj{ }', 5, 5)
      const result = handleBracketCompletion(e)
      expect(result.newValue).toBe('obj{ }')
      expect(result.newCursorStart).toBe(6)
    })

    it('should not skip closing bracket when there is selection', () => {
      const e = createMockEvent(')', 'hello()', 5, 6)
      expect(handleBracketCompletion(e)).toBeNull()
    })

    it('should not skip closing bracket when next char is different', () => {
      const e = createMockEvent(')', 'hello( )', 6, 6)
      expect(handleBracketCompletion(e)).toBeNull()
    })
  })

  describe('executeJavaScriptCode', () => {
    it('should execute simple JS and capture console.log output', () => {
      const result = executeJavaScriptCode('console.log("hello")')
      expect(result.success).toBe(true)
      expect(result.output).toHaveLength(1)
      expect(result.output[0].type).toBe('log')
      expect(result.output[0].content).toBe('hello')
    })

    it('should capture multiple console.log calls', () => {
      const result = executeJavaScriptCode('console.log("a"); console.log("b")')
      expect(result.success).toBe(true)
      expect(result.output).toHaveLength(2)
      expect(result.output[0].content).toBe('a')
      expect(result.output[1].content).toBe('b')
    })

    it('should capture console.error output', () => {
      const result = executeJavaScriptCode('console.error("err")')
      expect(result.success).toBe(true)
      expect(result.output).toHaveLength(1)
      expect(result.output[0].type).toBe('error')
      expect(result.output[0].content).toBe('err')
    })

    it('should return error on invalid code', () => {
      const result = executeJavaScriptCode('throw new Error("test error")')
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should capture syntax error', () => {
      const result = executeJavaScriptCode('function (')
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should handle numeric output', () => {
      const result = executeJavaScriptCode('console.log(42)')
      expect(result.success).toBe(true)
      expect(result.output[0].content).toBe('42')
    })

    it('should handle object output', () => {
      const result = executeJavaScriptCode('console.log({a:1})')
      expect(result.success).toBe(true)
      expect(result.output[0].content).toContain('a')
    })
  })

  describe('executePythonCode', () => {
    it('should execute print function', () => {
      const result = executePythonCode('print("hello")')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.type === 'log' && o.content === 'hello')).toBe(true)
    })

    it('should execute range and list functions', () => {
      const result = executePythonCode('print(list(range(5)))')
      expect(result.success).toBe(true)
    })

    it('should execute len function', () => {
      const result = executePythonCode('print(len([1, 2, 3]))')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === '3')).toBe(true)
    })

    it('should execute sum function', () => {
      const result = executePythonCode('print(sum([1, 2, 3]))')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === '6')).toBe(true)
    })

    it('should handle Python stdin input', () => {
      const result = executePythonCode('x = input()\nprint(x)', 'hello')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'hello')).toBe(true)
    })

    it('should handle math operations', () => {
      const result = executePythonCode('print(abs(-5))')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === '5')).toBe(true)
    })

    it('should return error on invalid Python code', () => {
      const result = executePythonCode('def (')
      expect(result.success).toBe(false)
    })

    it('should handle True/False/None constants', () => {
      const result = executePythonCode('print(True)\nprint(False)\nprint(None)')
      expect(result.success).toBe(true)
    })

    it('should report unsupported functions', () => {
      const result = executePythonCode('open("file.txt")')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content.includes('暂不支持'))).toBe(true)
    })

    it('should handle Python in operator for list membership', () => {
      const result = executePythonCode('print(3 in [1, 2, 3])')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'True')).toBe(true)
    })

    it('should handle Python in operator returning false', () => {
      const result = executePythonCode('print(5 in [1, 2, 3])')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'False')).toBe(true)
    })

    it('should handle Python not in operator', () => {
      const result = executePythonCode('print(5 not in [1, 2, 3])')
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'True')).toBe(true)
    })

    it('should handle in operator in if condition', () => {
      const code = `x = 3
if x in [1, 2, 3]:
    print("found")
else:
    print("not found")`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'found')).toBe(true)
    })

    it('should handle in operator in while condition', () => {
      const code = `nums = [1, 2, 3]
i = 0
while i in nums:
    print(i)
    i += 1`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
    })

    it('should handle in operator in return statement', () => {
      const code = `def check(x):
    return x in [1, 2, 3]
print(check(3))
print(check(5))`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'True')).toBe(true)
      expect(result.output.some((o) => o.content === 'False')).toBe(true)
    })

    it('should handle in operator in variable assignment', () => {
      const code = `nums = [1, 2, 3]
result = 3 in nums
print(result)`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'True')).toBe(true)
    })

    it('should handle if-elif-else correctly', () => {
      const code = `x = 5
if x < 0:
    print("negative")
elif x == 0:
    print("zero")
elif x < 10:
    print("small positive")
else:
    print("large positive")`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
      const logs = result.output.filter((o) => o.type === 'log').map((o) => o.content)
      expect(logs).toContain('small positive')
    })

    it('should handle elif with multiple branches', () => {
      const code = `grade = 75
if grade >= 90:
    print("A")
elif grade >= 80:
    print("B")
elif grade >= 70:
    print("C")
elif grade >= 60:
    print("D")
else:
    print("F")`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
      const logs = result.output.filter((o) => o.type === 'log').map((o) => o.content)
      expect(logs).toContain('C')
    })

    it('should handle elif with in operator condition', () => {
      const code = `fruit = "banana"
if fruit in ["apple", "pear"]:
    print("pome fruit")
elif fruit in ["banana", "mango"]:
    print("tropical fruit")
elif fruit in ["strawberry", "blueberry"]:
    print("berry")
else:
    print("unknown")`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
      const logs = result.output.filter((o) => o.type === 'log').map((o) => o.content)
      expect(logs).toContain('tropical fruit')
    })

    it('should handle elif with logical operators', () => {
      const code = `x = 15
if x > 0 and x < 10:
    print("between 0 and 10")
elif x > 10 and x < 20:
    print("between 10 and 20")
elif x > 20 or x < 0:
    print("out of range")
else:
    print("exactly 10 or 20")`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
      const logs = result.output.filter((o) => o.type === 'log').map((o) => o.content)
      expect(logs).toContain('between 10 and 20')
    })

    it('should handle nested if-elif correctly', () => {
      const code = `x = 12
if x > 0:
    if x % 2 == 0:
        print("positive even")
    elif x % 3 == 0:
        print("positive odd divisible by 3")
    else:
        print("positive other")
elif x < 0:
    print("negative")
else:
    print("zero")`
      const result = executePythonCode(code)
      expect(result.success).toBe(true)
      const logs = result.output.filter((o) => o.type === 'log').map((o) => o.content)
      expect(logs).toContain('positive even')
    })

    it('should handle stdin with empty lines correctly', () => {
      const code = `a = input()
b = input()
c = input()
print(a)
print(b)
print(c)`
      const stdin = 'hello\n\nworld'
      const result = executePythonCode(code, stdin)
      expect(result.success).toBe(true)
      const logs = result.output.filter((o) => o.type === 'log').map((o) => o.content)
      expect(logs).toContain('hello')
      expect(logs).toContain('')
      expect(logs).toContain('world')
    })

    it('should handle multiple empty lines in stdin', () => {
      const code = `for i in range(4):
    x = input()
    print(f"got: {x}")`
      const stdin = 'a\n\n\nb'
      const result = executePythonCode(code, stdin)
      expect(result.success).toBe(true)
      const logs = result.output.filter((o) => o.type === 'log').map((o) => o.content)
      expect(logs).toContain('got: a')
      expect(logs).toContain('got: ')
      expect(logs).toContain('got: b')
    })

    it('should return empty string for input when stdin is exhausted', () => {
      const code = `a = input()
b = input()
print(a)
print(b)`
      const stdin = 'only_one'
      const result = executePythonCode(code, stdin)
      expect(result.success).toBe(true)
      const logs = result.output.filter((o) => o.type === 'log').map((o) => o.content)
      expect(logs).toContain('only_one')
      expect(logs).toContain('')
    })
  })

  describe('executeCode', () => {
    it('should route to JS executor for JavaScript', () => {
      const result = executeCode('console.log("js")', LANGUAGES.JAVASCRIPT)
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'js')).toBe(true)
    })

    it('should route to Python executor for Python', () => {
      const result = executeCode('print("py")', LANGUAGES.PYTHON)
      expect(result.success).toBe(true)
      expect(result.output.some((o) => o.content === 'py')).toBe(true)
    })
  })

  describe('formatOutputLines', () => {
    it('should prefix each output line with > ', () => {
      const output = [
        { type: 'log', content: 'hello' },
        { type: 'error', content: 'err' },
      ]
      const result = formatOutputLines(output)
      expect(result[0].content).toBe(OUTPUT_LINE_PREFIX + 'hello')
      expect(result[1].content).toBe(OUTPUT_LINE_PREFIX + 'err')
    })

    it('should preserve type information', () => {
      const output = [{ type: 'error', content: 'fail' }]
      const result = formatOutputLines(output)
      expect(result[0].type).toBe('error')
    })

    it('should return empty array for non-array input', () => {
      expect(formatOutputLines(null)).toEqual([])
      expect(formatOutputLines(undefined)).toEqual([])
      expect(formatOutputLines('not array')).toEqual([])
    })
  })

  describe('measureExecution', () => {
    it('should return result and duration', () => {
      const { result, duration } = measureExecution(() => 42)
      expect(result).toBe(42)
      expect(typeof duration).toBe('number')
      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('should measure non-zero duration for slow function', () => {
      const { duration } = measureExecution(() => {
        let sum = 0
        for (let i = 0; i < 1000000; i++) sum += i
        return sum
      })
      expect(typeof duration).toBe('number')
    })
  })
})

describe('storage', () => {
  let storage

  beforeEach(() => {
    storage = createMockStorage()
    globalThis.localStorage = storage
  })

  afterEach(() => {
    delete globalThis.localStorage
  })

  describe('snippet CRUD', () => {
    describe('createSnippet', () => {
      it('should create a snippet with required fields', () => {
        const snippet = createSnippet({ name: 'test', language: LANGUAGES.JAVASCRIPT, code: 'console.log(1)' })
        expect(snippet.id).toBeTruthy()
        expect(snippet.name).toBe('test')
        expect(snippet.language).toBe(LANGUAGES.JAVASCRIPT)
        expect(snippet.code).toBe('console.log(1)')
        expect(snippet.lineCount).toBe(1)
        expect(snippet.createdAt).toBeTruthy()
        expect(snippet.updatedAt).toBeTruthy()
      })

      it('should count lines correctly', () => {
        const snippet = createSnippet({ name: 'multi', language: LANGUAGES.PYTHON, code: 'a\nb\nc' })
        expect(snippet.lineCount).toBe(3)
      })

      it('should handle empty code', () => {
        const snippet = createSnippet({ name: 'empty', language: LANGUAGES.JAVASCRIPT, code: '' })
        expect(snippet.code).toBe('')
        expect(snippet.lineCount).toBe(0)
      })

      it('should default name to 未命名片段 if empty', () => {
        const snippet = createSnippet({ name: '', language: LANGUAGES.JAVASCRIPT, code: 'x' })
        expect(snippet.name).toBe('未命名片段')
      })
    })

    describe('addSnippet', () => {
      it('should add snippet to beginning of list', () => {
        const s1 = createSnippet({ name: 'first', language: LANGUAGES.JAVASCRIPT, code: '1' })
        const s2 = createSnippet({ name: 'second', language: LANGUAGES.PYTHON, code: '2' })
        let list = addSnippet([], s1)
        list = addSnippet(list, s2)
        expect(list[0].name).toBe('second')
        expect(list[1].name).toBe('first')
      })

      it('should limit to MAX_SNIPPETS', () => {
        let list = []
        for (let i = 0; i < MAX_SNIPPETS + 5; i++) {
          const s = createSnippet({ name: `s${i}`, language: LANGUAGES.JAVASCRIPT, code: String(i) })
          list = addSnippet(list, s)
        }
        expect(list.length).toBe(MAX_SNIPPETS)
      })
    })

    describe('updateSnippet', () => {
      it('should update snippet data by id', () => {
        const s = createSnippet({ name: 'old', language: LANGUAGES.JAVASCRIPT, code: '1' })
        const updated = updateSnippet([s], s.id, { name: 'new' })
        expect(updated[0].name).toBe('new')
        expect(updated[0].updatedAt).toBeGreaterThanOrEqual(s.createdAt)
      })

      it('should recalculate lineCount when code changes', () => {
        const s = createSnippet({ name: 'test', language: LANGUAGES.JAVASCRIPT, code: 'a' })
        const updated = updateSnippet([s], s.id, { code: 'a\nb\nc' })
        expect(updated[0].lineCount).toBe(3)
      })

      it('should not modify other snippets', () => {
        const s1 = createSnippet({ name: 'a', language: LANGUAGES.JAVASCRIPT, code: '1' })
        const s2 = createSnippet({ name: 'b', language: LANGUAGES.PYTHON, code: '2' })
        const updated = updateSnippet([s1, s2], s1.id, { name: 'updated' })
        expect(updated[1].name).toBe('b')
      })
    })

    describe('renameSnippet', () => {
      it('should rename a snippet', () => {
        const s = createSnippet({ name: 'old', language: LANGUAGES.JAVASCRIPT, code: '1' })
        const renamed = renameSnippet([s], s.id, 'new name')
        expect(renamed[0].name).toBe('new name')
      })
    })

    describe('deleteSnippet', () => {
      it('should remove snippet by id', () => {
        const s1 = createSnippet({ name: 'a', language: LANGUAGES.JAVASCRIPT, code: '1' })
        const s2 = createSnippet({ name: 'b', language: LANGUAGES.PYTHON, code: '2' })
        const result = deleteSnippet([s1, s2], s1.id)
        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('b')
      })

      it('should return same array if id not found', () => {
        const s = createSnippet({ name: 'a', language: LANGUAGES.JAVASCRIPT, code: '1' })
        const result = deleteSnippet([s], 'nonexistent')
        expect(result).toHaveLength(1)
      })
    })
  })

  describe('localStorage operations for snippets', () => {
    it('loadSnippets should return empty array when storage is empty', () => {
      const result = loadSnippets()
      expect(result).toEqual([])
    })

    it('saveSnippets and loadSnippets should round-trip', () => {
      const snippets = [createSnippet({ name: 'test', language: LANGUAGES.JAVASCRIPT, code: '1' })]
      saveSnippets(snippets)
      const loaded = loadSnippets()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].name).toBe('test')
    })

    it('loadSnippets should handle corrupted data', () => {
      localStorage.setItem(STORAGE_KEYS.SNIPPETS, 'not-json')
      const result = loadSnippets()
      expect(result).toEqual([])
    })

    it('saveSnippets should return true on success', () => {
      expect(saveSnippets([])).toBe(true)
    })
  })

  describe('history operations', () => {
    describe('createHistoryItem', () => {
      it('should create history item with required fields', () => {
        const item = createHistoryItem({
          language: LANGUAGES.JAVASCRIPT,
          code: 'console.log(1)',
          duration: 1.5,
          success: true,
          error: null,
        })
        expect(item.id).toBeTruthy()
        expect(item.language).toBe(LANGUAGES.JAVASCRIPT)
        expect(item.code).toBe('console.log(1)')
        expect(item.duration).toBe(1.5)
        expect(item.success).toBe(true)
        expect(item.error).toBeNull()
        expect(item.timestamp).toBeTruthy()
      })

      it('should default success to false', () => {
        const item = createHistoryItem({ language: LANGUAGES.PYTHON, code: 'x' })
        expect(item.success).toBe(false)
      })

      it('should default duration to 0', () => {
        const item = createHistoryItem({ language: LANGUAGES.PYTHON, code: 'x' })
        expect(item.duration).toBe(0)
      })
    })

    describe('addHistoryItem', () => {
      it('should add item to beginning of list', () => {
        const item1 = createHistoryItem({ language: LANGUAGES.JAVASCRIPT, code: '1', duration: 1, success: true })
        const item2 = createHistoryItem({ language: LANGUAGES.PYTHON, code: '2', duration: 2, success: false })
        let list = addHistoryItem([], item1)
        list = addHistoryItem(list, item2)
        expect(list[0].language).toBe(LANGUAGES.PYTHON)
        expect(list[1].language).toBe(LANGUAGES.JAVASCRIPT)
      })

      it('should limit to MAX_HISTORY', () => {
        let list = []
        for (let i = 0; i < MAX_HISTORY + 10; i++) {
          const item = createHistoryItem({ language: LANGUAGES.JAVASCRIPT, code: String(i), duration: i, success: true })
          list = addHistoryItem(list, item)
        }
        expect(list.length).toBe(MAX_HISTORY)
      })
    })
  })

  describe('localStorage operations for history', () => {
    it('loadHistory should return empty array when storage is empty', () => {
      localStorage.removeItem(STORAGE_KEYS.HISTORY)
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('saveHistory and loadHistory should round-trip', () => {
      const item = createHistoryItem({ language: LANGUAGES.JAVASCRIPT, code: '1', duration: 1, success: true })
      const history = [item]
      saveHistory(history)
      const loaded = loadHistory()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].language).toBe(LANGUAGES.JAVASCRIPT)
    })

    it('loadHistory should handle corrupted data', () => {
      localStorage.setItem(STORAGE_KEYS.HISTORY, 'invalid-json')
      const result = loadHistory()
      expect(result).toEqual([])
    })

    it('clearHistory should remove history from storage', () => {
      const item = createHistoryItem({ language: LANGUAGES.JAVASCRIPT, code: '1', duration: 1, success: true })
      saveHistory([item])
      clearHistory()
      expect(loadHistory()).toEqual([])
    })

    it('clearHistory should return true on success', () => {
      expect(clearHistory()).toBe(true)
    })
  })

  describe('formatTimestamp', () => {
    it('should format a known timestamp correctly', () => {
      const ts = new Date(2025, 0, 15, 10, 30, 45).getTime()
      const result = formatTimestamp(ts)
      expect(result).toBe('2025-01-15 10:30:45')
    })

    it('should pad single-digit values', () => {
      const ts = new Date(2025, 2, 5, 3, 7, 9).getTime()
      const result = formatTimestamp(ts)
      expect(result).toBe('2025-03-05 03:07:09')
    })

    it('should return empty string for falsy input', () => {
      expect(formatTimestamp(null)).toBe('')
      expect(formatTimestamp(undefined)).toBe('')
      expect(formatTimestamp(0)).toBe('')
    })
  })

  describe('truncateCode', () => {
    it('should not truncate short code', () => {
      expect(truncateCode('short code')).toBe('short code')
    })

    it('should truncate long code with ellipsis', () => {
      const longCode = 'a'.repeat(100)
      const result = truncateCode(longCode, 50)
      expect(result.length).toBe(53)
      expect(result.endsWith('...')).toBe(true)
    })

    it('should collapse whitespace before truncating', () => {
      expect(truncateCode('  hello   world  ')).toBe('hello world')
    })

    it('should return empty string for non-string input', () => {
      expect(truncateCode(null)).toBe('')
      expect(truncateCode(undefined)).toBe('')
    })

    it('should use default maxLen of 50', () => {
      const code = 'a'.repeat(60)
      const result = truncateCode(code)
      expect(result.length).toBe(53)
    })
  })

  describe('countLines', () => {
    it('should count single line', () => {
      expect(countLines('hello')).toBe(1)
    })

    it('should count multiple lines', () => {
      expect(countLines('a\nb\nc')).toBe(3)
    })

    it('should return 0 for empty string', () => {
      expect(countLines('')).toBe(0)
    })

    it('should return 0 for non-string input', () => {
      expect(countLines(null)).toBe(0)
      expect(countLines(undefined)).toBe(0)
    })
  })
})
