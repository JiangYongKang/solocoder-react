export const LANGUAGES = {
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
}

export const LANGUAGE_LABELS = {
  [LANGUAGES.JAVASCRIPT]: 'JavaScript',
  [LANGUAGES.PYTHON]: 'Python',
}

export const STORAGE_KEYS = {
  SNIPPETS: 'code_sandbox_snippets',
  HISTORY: 'code_sandbox_history',
}

export const MAX_SNIPPETS = 50
export const MAX_HISTORY = 50

export const JS_KEYWORDS = [
  'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
  'return', 'break', 'continue', 'switch', 'case', 'default', 'do',
  'new', 'class', 'extends', 'super', 'this', 'try', 'catch', 'finally',
  'throw', 'async', 'await', 'import', 'export', 'from', 'typeof',
  'instanceof', 'in', 'of', 'true', 'false', 'null', 'undefined', 'NaN',
]

export const PYTHON_KEYWORDS = [
  'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return',
  'import', 'from', 'as', 'break', 'continue', 'pass', 'try', 'except',
  'finally', 'raise', 'with', 'lambda', 'True', 'False', 'None', 'and',
  'or', 'not', 'in', 'is', 'global', 'nonlocal', 'yield', 'async', 'await',
]

export const HIGHLIGHT_COLORS = {
  keyword: '#569cd6',
  string: '#6a9955',
  comment: '#808080',
  number: '#ce9178',
}

export const DEFAULT_CODE = {
  [LANGUAGES.JAVASCRIPT]: `// JavaScript 示例
function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log('Sum:', sum);

greet('World');`,
  [LANGUAGES.PYTHON]: `# Python 示例
def greet(name):
    message = f"Hello, {name}!"
    print(message)
    return message

numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print("Sum:", total)

greet("World")`,
}

export const OUTPUT_LINE_PREFIX = '> '
