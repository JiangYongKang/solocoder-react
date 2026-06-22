import {
  INITIAL_FILESYSTEM,
  HOME_DIR,
  SUPPORTED_COMMANDS,
  COMMANDS,
  HELP_TEXT,
  PROMPT_USER,
} from './constants.js'

export { HOME_DIR }

export function createFilesystem() {
  return JSON.parse(JSON.stringify(INITIAL_FILESYSTEM))
}

export function normalizePath(path) {
  if (path === '' || path === undefined || path === null) {
    return '/'
  }

  if (path === '~') {
    return HOME_DIR
  }

  if (path.startsWith('~/')) {
    path = HOME_DIR + path.slice(1)
  }

  if (!path.startsWith('/')) {
    path = '/' + path
  }

  const parts = path.split('/').filter(Boolean)
  const result = []

  for (const part of parts) {
    if (part === '.') {
      continue
    } else if (part === '..') {
      result.pop()
    } else {
      result.push(part)
    }
  }

  return '/' + result.join('/')
}

export function resolvePath(currentPath, targetPath) {
  if (targetPath === undefined || targetPath === null || targetPath === '') {
    return normalizePath(currentPath)
  }

  if (targetPath === '~' || targetPath.startsWith('~/')) {
    return normalizePath(targetPath)
  }

  if (targetPath.startsWith('/')) {
    return normalizePath(targetPath)
  }

  return normalizePath(currentPath + '/' + targetPath)
}

export function getNode(filesystem, path) {
  const normalized = normalizePath(path)

  if (normalized === '/') {
    return filesystem
  }

  const parts = normalized.split('/').filter(Boolean)
  let current = filesystem

  for (const part of parts) {
    if (!current || current.type !== 'directory' || !current.children || !(part in current.children)) {
      return null
    }
    current = current.children[part]
  }

  return current
}

export function getParentPath(path) {
  const normalized = normalizePath(path)
  if (normalized === '/') {
    return '/'
  }
  const parts = normalized.split('/').filter(Boolean)
  parts.pop()
  return '/' + parts.join('/')
}

export function getPathBasename(path) {
  const normalized = normalizePath(path)
  if (normalized === '/') {
    return '/'
  }
  const parts = normalized.split('/').filter(Boolean)
  return parts[parts.length - 1]
}

export function parseCommand(input) {
  if (!input || input.trim() === '') {
    return { command: '', args: [], raw: '' }
  }

  const trimmed = input.trim()
  const tokens = []
  let current = ''
  let inSingleQuote = false
  let inDoubleQuote = false

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i]

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote
      continue
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote
      continue
    }

    if (char === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current !== '') {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current !== '') {
    tokens.push(current)
  }

  const [command, ...args] = tokens

  return {
    command: command || '',
    args: args || [],
    raw: trimmed,
  }
}

export function tokenizeForHighlight(commandStr) {
  if (!commandStr) {
    return []
  }

  const { command, args } = parseCommand(commandStr)
  const tokens = []

  if (command) {
    const isSupported = SUPPORTED_COMMANDS.includes(command)
    tokens.push({
      type: isSupported ? 'command' : 'command-unknown',
      value: command,
    })
  }

  let processedLength = command.length

  for (const arg of args) {
    const remaining = commandStr.slice(processedLength)
    const argStart = remaining.indexOf(arg)
    if (argStart > 0) {
      tokens.push({
        type: 'whitespace',
        value: remaining.slice(0, argStart),
      })
      processedLength += argStart
    } else {
      const spaceMatch = commandStr.slice(processedLength).match(/^\s+/)
      if (spaceMatch) {
        tokens.push({
          type: 'whitespace',
          value: spaceMatch[0],
        })
        processedLength += spaceMatch[0].length
      }
    }

    let type = 'argument'
    if (arg.startsWith('-')) {
      type = 'flag'
    } else if (arg.includes('/') || arg.startsWith('.') || arg.startsWith('~')) {
      type = 'path'
    } else if (arg === '..' || arg === '.') {
      type = 'path'
    }

    tokens.push({
      type,
      value: arg,
    })
    processedLength += arg.length
  }

  return tokens
}

export function executeCommand(filesystem, currentPath, input) {
  const parsed = parseCommand(input)
  const { command, args } = parsed

  if (command === '') {
    return {
      filesystem,
      newPath: currentPath,
      output: null,
      type: 'empty',
    }
  }

  switch (command) {
    case COMMANDS.PWD:
      return cmdPwd(currentPath)
    case COMMANDS.LS:
      return cmdLs(filesystem, currentPath, args)
    case COMMANDS.CD:
      return cmdCd(filesystem, currentPath, args)
    case COMMANDS.CAT:
      return cmdCat(filesystem, currentPath, args)
    case COMMANDS.MKDIR:
      return cmdMkdir(filesystem, currentPath, args)
    case COMMANDS.CLEAR:
      return {
        filesystem,
        newPath: currentPath,
        output: null,
        type: 'clear',
      }
    case COMMANDS.HELP:
      return {
        filesystem,
        newPath: currentPath,
        output: HELP_TEXT,
        type: 'success',
      }
    case COMMANDS.ECHO:
      return {
        filesystem,
        newPath: currentPath,
        output: args.join(' '),
        type: 'success',
      }
    case COMMANDS.WHOAMI:
      return {
        filesystem,
        newPath: currentPath,
        output: PROMPT_USER,
        type: 'success',
      }
    case COMMANDS.DATE:
      return {
        filesystem,
        newPath: currentPath,
        output: new Date().toString(),
        type: 'success',
      }
    default:
      return {
        filesystem,
        newPath: currentPath,
        output: `command not found: ${command}. Type 'help' for available commands.`,
        type: 'error',
      }
  }
}

function cmdPwd(currentPath) {
  return {
    filesystem: null,
    newPath: currentPath,
    output: currentPath,
    type: 'success',
  }
}

function cmdLs(filesystem, currentPath, args) {
  const targetPath = args.length > 0 ? resolvePath(currentPath, args[0]) : currentPath
  const node = getNode(filesystem, targetPath)

  if (!node) {
    return {
      filesystem,
      newPath: currentPath,
      output: `ls: cannot access '${args[0]}': No such file or directory`,
      type: 'error',
    }
  }

  if (node.type === 'file') {
    return {
      filesystem,
      newPath: currentPath,
      output: getPathBasename(targetPath),
      type: 'success',
      entries: [{ name: getPathBasename(targetPath), type: 'file' }],
    }
  }

  const entries = Object.keys(node.children)
    .filter((name) => !name.startsWith('.'))
    .map((name) => ({
      name,
      type: node.children[name].type,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

  return {
    filesystem,
    newPath: currentPath,
    output: entries,
    type: 'ls',
    entries,
  }
}

function cmdCd(filesystem, currentPath, args) {
  const targetRaw = args.length > 0 ? args[0] : HOME_DIR
  const targetPath = resolvePath(currentPath, targetRaw)
  const node = getNode(filesystem, targetPath)

  if (!node) {
    return {
      filesystem,
      newPath: currentPath,
      output: `cd: ${targetRaw}: No such file or directory`,
      type: 'error',
    }
  }

  if (node.type !== 'directory') {
    return {
      filesystem,
      newPath: currentPath,
      output: `cd: ${targetRaw}: Not a directory`,
      type: 'error',
    }
  }

  return {
    filesystem,
    newPath: targetPath,
    output: null,
    type: 'cd',
  }
}

function cmdCat(filesystem, currentPath, args) {
  if (args.length === 0) {
    return {
      filesystem,
      newPath: currentPath,
      output: 'cat: missing operand',
      type: 'error',
    }
  }

  const targetPath = resolvePath(currentPath, args[0])
  const node = getNode(filesystem, targetPath)

  if (!node) {
    return {
      filesystem,
      newPath: currentPath,
      output: `cat: ${args[0]}: No such file or directory`,
      type: 'error',
    }
  }

  if (node.type === 'directory') {
    return {
      filesystem,
      newPath: currentPath,
      output: `cat: ${args[0]}: Is a directory`,
      type: 'error',
    }
  }

  return {
    filesystem,
    newPath: currentPath,
    output: node.content,
    type: 'success',
  }
}

function cmdMkdir(filesystem, currentPath, args) {
  if (args.length === 0) {
    return {
      filesystem,
      newPath: currentPath,
      output: 'mkdir: missing operand',
      type: 'error',
    }
  }

  const dirName = args[0]

  if (dirName.includes('/')) {
    return {
      filesystem,
      newPath: currentPath,
      output: `mkdir: cannot create directory '${dirName}': No such file or directory`,
      type: 'error',
    }
  }

  if (dirName === '.' || dirName === '..') {
    return {
      filesystem,
      newPath: currentPath,
      output: `mkdir: cannot create directory '${dirName}': File exists`,
      type: 'error',
    }
  }

  const currentNode = getNode(filesystem, currentPath)

  if (dirName in currentNode.children) {
    return {
      filesystem,
      newPath: currentPath,
      output: `mkdir: cannot create directory '${dirName}': File exists`,
      type: 'error',
    }
  }

  const newFs = JSON.parse(JSON.stringify(filesystem))
  const newCurrentNode = getNode(newFs, currentPath)
  newCurrentNode.children[dirName] = {
    type: 'directory',
    children: {},
  }

  return {
    filesystem: newFs,
    newPath: currentPath,
    output: null,
    type: 'mkdir',
  }
}

export function autocomplete(filesystem, currentPath, input) {
  if (!input || input === '') {
    return {
      completions: [...SUPPORTED_COMMANDS].sort(),
      completed: null,
    }
  }

  const { command, args } = parseCommand(input)

  if (args.length === 0 && !input.endsWith(' ')) {
    const matches = SUPPORTED_COMMANDS.filter((c) => c.startsWith(command)).sort()
    return {
      completions: matches,
      completed: matches.length === 1 ? matches[0] + ' ' : null,
    }
  }

  const isCompletingArg = input.endsWith(' ') || args.length > 0
  if (!isCompletingArg) {
    return {
      completions: [],
      completed: null,
    }
  }

  const commandsTakingPaths = [COMMANDS.CD, COMMANDS.CAT, COMMANDS.LS, COMMANDS.MKDIR]
  if (!commandsTakingPaths.includes(command)) {
    return {
      completions: [],
      completed: null,
    }
  }

  const partialPath = args.length > 0 ? args[args.length - 1] : ''

  let baseDir = currentPath
  let prefix = ''

  if (partialPath === '') {
    baseDir = currentPath
    prefix = ''
  } else if (partialPath.includes('/')) {
    const lastSlashIdx = partialPath.lastIndexOf('/')
    const dirPart = partialPath.slice(0, lastSlashIdx)
    prefix = partialPath.slice(lastSlashIdx + 1)
    baseDir = resolvePath(currentPath, dirPart)
  } else {
    prefix = partialPath
  }

  const dirNode = getNode(filesystem, baseDir)
  if (!dirNode || dirNode.type !== 'directory') {
    return {
      completions: [],
      completed: null,
    }
  }

  const matches = Object.keys(dirNode.children)
    .filter((name) => name.startsWith(prefix))
    .sort()

  if (matches.length === 0) {
    return {
      completions: [],
      completed: null,
    }
  }

  let completed = null
  if (matches.length === 1) {
    const fullMatch = matches[0]
    const matchNode = dirNode.children[fullMatch]
    const suffix = matchNode.type === 'directory' ? '/' : ' '
    const prefixPath = partialPath.includes('/') ? partialPath.slice(0, partialPath.lastIndexOf('/') + 1) : ''
    completed = prefixPath + fullMatch + suffix
  }

  return {
    completions: matches,
    completed,
  }
}

export function formatPrompt(currentPath) {
  const displayPath = currentPath.startsWith(HOME_DIR)
    ? '~' + currentPath.slice(HOME_DIR.length)
    : currentPath
  return displayPath
}

export function createInitialState() {
  return {
    filesystem: createFilesystem(),
    currentPath: HOME_DIR,
    history: [],
    historyIndex: -1,
  }
}
