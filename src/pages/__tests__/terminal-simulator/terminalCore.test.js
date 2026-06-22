import { describe, it, expect, beforeEach } from 'vitest'
import {
  HOME_DIR,
  SUPPORTED_COMMANDS,
} from '@/pages/terminal-simulator/constants.js'
import {
  createFilesystem,
  normalizePath,
  resolvePath,
  getNode,
  getParentPath,
  getPathBasename,
  parseCommand,
  tokenizeForHighlight,
  executeCommand,
  autocomplete,
  formatPrompt,
} from '@/pages/terminal-simulator/terminalCore.js'

describe('terminalCore', () => {
  let fs

  function makeFs() {
    return createFilesystem()
  }

  describe('normalizePath', () => {
    it('should return / for empty/undefined/null paths', () => {
      expect(normalizePath('')).toBe('/')
      expect(normalizePath(undefined)).toBe('/')
      expect(normalizePath(null)).toBe('/')
    })

    it('should handle tilde expansion', () => {
      expect(normalizePath('~')).toBe(HOME_DIR)
      expect(normalizePath('~/documents')).toBe('/home/user/documents')
      expect(normalizePath('~/documents/projects')).toBe('/home/user/documents/projects')
    })

    it('should add leading slash if missing', () => {
      expect(normalizePath('home')).toBe('/home')
      expect(normalizePath('home/user')).toBe('/home/user')
    })

    it('should handle single dot for current directory', () => {
      expect(normalizePath('/home/./user')).toBe('/home/user')
      expect(normalizePath('/././')).toBe('/')
    })

    it('should handle double dot for parent directory', () => {
      expect(normalizePath('/home/user/..')).toBe('/home')
      expect(normalizePath('/home/user/../..')).toBe('/')
      expect(normalizePath('/../..')).toBe('/')
    })

    it('should handle mixed dots and normal segments', () => {
      expect(normalizePath('/home/./user/../user/./documents/..')).toBe('/home/user')
    })

    it('should remove duplicate slashes', () => {
      expect(normalizePath('//home//user///documents')).toBe('/home/user/documents')
    })

    it('should handle root correctly', () => {
      expect(normalizePath('/')).toBe('/')
      expect(normalizePath('///')).toBe('/')
    })

    it('should handle complex paths', () => {
      expect(normalizePath('/a/b/c/../../d/e/../f')).toBe('/a/d/f')
    })
  })

  describe('resolvePath', () => {
    it('should resolve absolute paths', () => {
      expect(resolvePath('/home/user', '/etc/config')).toBe('/etc/config')
      expect(resolvePath('/home/user', '/')).toBe('/')
    })

    it('should resolve relative paths', () => {
      expect(resolvePath('/home/user', 'documents')).toBe('/home/user/documents')
      expect(resolvePath('/home/user', '../..')).toBe('/')
      expect(resolvePath('/home/user', './downloads/../pictures')).toBe('/home/user/pictures')
    })

    it('should handle empty target as current path', () => {
      expect(resolvePath('/home/user', '')).toBe('/home/user')
      expect(resolvePath('/home/user', undefined)).toBe('/home/user')
    })

    it('should handle tilde in target', () => {
      expect(resolvePath('/etc', '~')).toBe(HOME_DIR)
      expect(resolvePath('/etc', '~/documents')).toBe('/home/user/documents')
    })

    it('should resolve from root correctly', () => {
      expect(resolvePath('/', 'home')).toBe('/home')
      expect(resolvePath('/', 'home/user')).toBe('/home/user')
    })
  })

  describe('getParentPath & getPathBasename', () => {
    it('should return parent path', () => {
      expect(getParentPath('/home/user')).toBe('/home')
      expect(getParentPath('/home/user/documents')).toBe('/home/user')
      expect(getParentPath('/')).toBe('/')
      expect(getParentPath('/home')).toBe('/')
    })

    it('should return basename', () => {
      expect(getPathBasename('/home/user')).toBe('user')
      expect(getPathBasename('/home/user/documents/readme.txt')).toBe('readme.txt')
      expect(getPathBasename('/')).toBe('/')
    })
  })

  describe('getNode', () => {
    beforeEach(() => {
      fs = makeFs()
    })

    it('should get root node', () => {
      const node = getNode(fs, '/')
      expect(node).not.toBeNull()
      expect(node.type).toBe('directory')
      expect(node.children).toBeDefined()
    })

    it('should get existing directory nodes', () => {
      expect(getNode(fs, '/home')).not.toBeNull()
      expect(getNode(fs, '/home').type).toBe('directory')
      expect(getNode(fs, '/home/user/documents').type).toBe('directory')
      expect(getNode(fs, '/etc/config').type).toBe('directory')
    })

    it('should get existing file nodes', () => {
      const node = getNode(fs, '/home/user/documents/readme.txt')
      expect(node).not.toBeNull()
      expect(node.type).toBe('file')
      expect(node.content).toBeDefined()
      expect(typeof node.content).toBe('string')
    })

    it('should return null for non-existent paths', () => {
      expect(getNode(fs, '/nonexistent')).toBeNull()
      expect(getNode(fs, '/home/user/nonexistent.txt')).toBeNull()
      expect(getNode(fs, '/etc/invalid/path')).toBeNull()
    })

    it('should not mutate filesystem when accessing nodes', () => {
      const before = JSON.stringify(fs)
      const node = getNode(fs, '/home/user')
      node.children = {}
      const after = JSON.stringify(fs)
      expect(after).not.toBe(before)
    })
  })

  describe('parseCommand', () => {
    it('should parse empty input', () => {
      expect(parseCommand('')).toEqual({ command: '', args: [], raw: '' })
      expect(parseCommand('   ')).toEqual({ command: '', args: [], raw: '' })
    })

    it('should parse simple commands without args', () => {
      expect(parseCommand('ls')).toEqual({ command: 'ls', args: [], raw: 'ls' })
      expect(parseCommand('pwd')).toEqual({ command: 'pwd', args: [], raw: 'pwd' })
    })

    it('should parse commands with args', () => {
      expect(parseCommand('cd /home')).toEqual({ command: 'cd', args: ['/home'], raw: 'cd /home' })
      expect(parseCommand('cat readme.txt')).toEqual({ command: 'cat', args: ['readme.txt'], raw: 'cat readme.txt' })
      expect(parseCommand('mkdir mydir')).toEqual({ command: 'mkdir', args: ['mydir'], raw: 'mkdir mydir' })
    })

    it('should parse commands with multiple args', () => {
      expect(parseCommand('ls -la /home')).toEqual({
        command: 'ls', args: ['-la', '/home'], raw: 'ls -la /home'
      })
      expect(parseCommand('echo hello world')).toEqual({
        command: 'echo', args: ['hello', 'world'], raw: 'echo hello world'
      })
    })

    it('should handle leading and trailing whitespace', () => {
      expect(parseCommand('   ls   -la   ')).toEqual({
        command: 'ls', args: ['-la'], raw: 'ls   -la'
      })
    })

    it('should handle multiple spaces between args', () => {
      expect(parseCommand('cd   /home/user')).toEqual({
        command: 'cd', args: ['/home/user'], raw: 'cd   /home/user'
      })
    })

    it('should handle single quoted arguments', () => {
      expect(parseCommand("echo 'hello world'")).toEqual({
        command: 'echo', args: ['hello world'], raw: "echo 'hello world'"
      })
    })

    it('should handle double quoted arguments', () => {
      expect(parseCommand('echo "hello world"')).toEqual({
        command: 'echo', args: ['hello world'], raw: 'echo "hello world"'
      })
    })
  })

  describe('tokenizeForHighlight', () => {
    it('should return empty array for empty string', () => {
      expect(tokenizeForHighlight('')).toEqual([])
    })

    it('should tokenize supported command', () => {
      const tokens = tokenizeForHighlight('ls')
      expect(tokens.length).toBeGreaterThanOrEqual(1)
      expect(tokens[0].type).toBe('command')
      expect(tokens[0].value).toBe('ls')
    })

    it('should tokenize unsupported command as unknown', () => {
      const tokens = tokenizeForHighlight('unknowncmd')
      expect(tokens[0].type).toBe('command-unknown')
    })

    it('should tokenize paths in arguments', () => {
      const tokens = tokenizeForHighlight('cd /home/user')
      const pathToken = tokens.find(t => t.type === 'path')
      expect(pathToken).toBeDefined()
      expect(pathToken.value).toBe('/home/user')
    })

    it('should tokenize flags in arguments', () => {
      const tokens = tokenizeForHighlight('ls -la')
      const flagToken = tokens.find(t => t.type === 'flag')
      expect(flagToken).toBeDefined()
      expect(flagToken.value).toBe('-la')
    })

    it('should tokenize relative paths', () => {
      const tokens = tokenizeForHighlight('cd ..')
      const pathToken = tokens.find(t => t.value === '..')
      expect(pathToken).toBeDefined()
      expect(pathToken.type).toBe('path')
    })

    it('should tokenize tilde paths', () => {
      const tokens = tokenizeForHighlight('cd ~/documents')
      const pathToken = tokens.find(t => t.type === 'path')
      expect(pathToken).toBeDefined()
    })

    it('should preserve quotes in highlighted output', () => {
      const tokens = tokenizeForHighlight("echo 'hello world'")
      const argToken = tokens.find(t => t.value.includes('hello'))
      expect(argToken).toBeDefined()
      expect(argToken.value).toBe("'hello world'")
    })

    it('should preserve double quotes in highlighted output', () => {
      const tokens = tokenizeForHighlight('echo "hello world"')
      const argToken = tokens.find(t => t.value.includes('hello'))
      expect(argToken).toBeDefined()
      expect(argToken.value).toBe('"hello world"')
    })

    it('should highlight bare relative path args for path-taking commands', () => {
      const tokens = tokenizeForHighlight('cd documents')
      const pathToken = tokens.find(t => t.value === 'documents')
      expect(pathToken).toBeDefined()
      expect(pathToken.type).toBe('path')
    })

    it('should highlight bare relative path args for ls', () => {
      const tokens = tokenizeForHighlight('ls documents')
      const pathToken = tokens.find(t => t.value === 'documents')
      expect(pathToken).toBeDefined()
      expect(pathToken.type).toBe('path')
    })

    it('should highlight bare relative path args for cat', () => {
      const tokens = tokenizeForHighlight('cat readme.txt')
      const pathToken = tokens.find(t => t.value === 'readme.txt')
      expect(pathToken).toBeDefined()
      expect(pathToken.type).toBe('path')
    })

    it('should not highlight bare args as path for non-path commands', () => {
      const tokens = tokenizeForHighlight('echo hello')
      const argToken = tokens.find(t => t.value === 'hello')
      expect(argToken).toBeDefined()
      expect(argToken.type).toBe('argument')
    })
  })

  describe('executeCommand', () => {
    beforeEach(() => {
      fs = makeFs()
    })

    describe('empty command', () => {
      it('should handle empty input', () => {
        const result = executeCommand(fs, HOME_DIR, '')
        expect(result.type).toBe('empty')
        expect(result.newPath).toBe(HOME_DIR)
        expect(result.output).toBeNull()
      })
    })

    describe('pwd', () => {
      it('should print current directory', () => {
        const result = executeCommand(fs, '/home/user', 'pwd')
        expect(result.type).toBe('success')
        expect(result.output).toBe('/home/user')
      })

      it('should print root directory', () => {
        const result = executeCommand(fs, '/', 'pwd')
        expect(result.output).toBe('/')
      })
    })

    describe('ls', () => {
      it('should list current directory', () => {
        const result = executeCommand(fs, HOME_DIR, 'ls')
        expect(result.type).toBe('ls')
        expect(result.entries).toBeDefined()
        expect(Array.isArray(result.entries)).toBe(true)
        const names = result.entries.map(e => e.name)
        expect(names).toContain('documents')
        expect(names).toContain('downloads')
        expect(names).toContain('pictures')
        expect(names).not.toContain('.bashrc')
      })

      it('should sort directories before files', () => {
        const result = executeCommand(fs, HOME_DIR, 'ls')
        let lastWasDir = true
        for (const entry of result.entries) {
          if (entry.type === 'directory') {
            expect(lastWasDir).toBe(true)
          }
          lastWasDir = entry.type === 'directory'
        }
      })

      it('should list specific directory by path', () => {
        const result = executeCommand(fs, HOME_DIR, 'ls /')
        expect(result.type).toBe('ls')
        const names = result.entries.map(e => e.name)
        expect(names).toContain('home')
        expect(names).toContain('etc')
        expect(names).toContain('tmp')
      })

      it('should error for non-existent path', () => {
        const result = executeCommand(fs, HOME_DIR, 'ls /nonexistent')
        expect(result.type).toBe('error')
        expect(result.output).toContain('No such file or directory')
      })
    })

    describe('cd', () => {
      it('should change to home directory with no args', () => {
        const result = executeCommand(fs, '/etc', 'cd')
        expect(result.type).toBe('cd')
        expect(result.newPath).toBe(HOME_DIR)
      })

      it('should change to absolute path', () => {
        const result = executeCommand(fs, HOME_DIR, 'cd /etc/config')
        expect(result.newPath).toBe('/etc/config')
      })

      it('should change to relative path', () => {
        const result = executeCommand(fs, HOME_DIR, 'cd documents')
        expect(result.newPath).toBe('/home/user/documents')
      })

      it('should change to parent with ..', () => {
        const result = executeCommand(fs, '/home/user', 'cd ..')
        expect(result.newPath).toBe('/home')
      })

      it('should change to root with /', () => {
        const result = executeCommand(fs, HOME_DIR, 'cd /')
        expect(result.newPath).toBe('/')
      })

      it('should change to tilde home', () => {
        const result = executeCommand(fs, '/etc', 'cd ~')
        expect(result.newPath).toBe(HOME_DIR)
      })

      it('should error for non-existent directory', () => {
        const result = executeCommand(fs, HOME_DIR, 'cd nonexistent')
        expect(result.type).toBe('error')
        expect(result.output).toContain('No such file or directory')
      })

      it('should error when target is a file', () => {
        const result = executeCommand(fs, HOME_DIR, 'cd documents/readme.txt')
        expect(result.type).toBe('error')
        expect(result.output).toContain('Not a directory')
      })
    })

    describe('cat', () => {
      it('should display file content', () => {
        const result = executeCommand(fs, '/home/user/documents', 'cat readme.txt')
        expect(result.type).toBe('success')
        expect(result.output).toContain('Welcome')
      })

      it('should display file with absolute path', () => {
        const result = executeCommand(fs, '/', 'cat /etc/hosts')
        expect(result.type).toBe('success')
        expect(result.output).toContain('127.0.0.1')
      })

      it('should error for missing operand', () => {
        const result = executeCommand(fs, HOME_DIR, 'cat')
        expect(result.type).toBe('error')
        expect(result.output).toContain('missing operand')
      })

      it('should error for non-existent file', () => {
        const result = executeCommand(fs, HOME_DIR, 'cat nonexistent.txt')
        expect(result.type).toBe('error')
        expect(result.output).toContain('No such file or directory')
      })

      it('should error for directory', () => {
        const result = executeCommand(fs, HOME_DIR, 'cat documents')
        expect(result.type).toBe('error')
        expect(result.output).toContain('Is a directory')
      })
    })

    describe('mkdir', () => {
      it('should create directory', () => {
        const result = executeCommand(fs, HOME_DIR, 'mkdir testdir')
        expect(result.type).toBe('mkdir')
        expect(result.output).toBeNull()
        const newNode = getNode(result.filesystem, '/home/user/testdir')
        expect(newNode).not.toBeNull()
        expect(newNode.type).toBe('directory')
      })

      it('should error for missing operand', () => {
        const result = executeCommand(fs, HOME_DIR, 'mkdir')
        expect(result.type).toBe('error')
        expect(result.output).toContain('missing operand')
      })

      it('should error for path with slashes', () => {
        const result = executeCommand(fs, HOME_DIR, 'mkdir a/b')
        expect(result.type).toBe('error')
      })

      it('should error for directory exists', () => {
        executeCommand(fs, HOME_DIR, 'mkdir documents')
        const result = executeCommand(fs, HOME_DIR, 'mkdir documents')
        expect(result.type).toBe('error')
        expect(result.output).toContain('File exists')
      })

      it('should not mutate original filesystem', () => {
        const originalFs = makeFs()
        const result = executeCommand(originalFs, HOME_DIR, 'mkdir newdir')
        const originalNode = getNode(originalFs, '/home/user/newdir')
        expect(originalNode).toBeNull()
        expect(result.filesystem).not.toBe(originalFs)
      })
    })

    describe('clear', () => {
      it('should return clear type', () => {
        const result = executeCommand(fs, HOME_DIR, 'clear')
        expect(result.type).toBe('clear')
        expect(result.output).toBeNull()
      })
    })

    describe('help', () => {
      it('should return help text', () => {
        const result = executeCommand(fs, HOME_DIR, 'help')
        expect(result.type).toBe('success')
        expect(typeof result.output).toBe('string')
        expect(result.output).toContain('Available commands')
      })
    })

    describe('echo', () => {
      it('should echo arguments', () => {
        const result = executeCommand(fs, HOME_DIR, 'echo hello world')
        expect(result.type).toBe('success')
        expect(result.output).toBe('hello world')
      })

      it('should handle no args', () => {
        const result = executeCommand(fs, HOME_DIR, 'echo')
        expect(result.output).toBe('')
      })
    })

    describe('whoami', () => {
      it('should return user', () => {
        const result = executeCommand(fs, HOME_DIR, 'whoami')
        expect(result.type).toBe('success')
        expect(result.output).toBe('user')
      })
    })

    describe('date', () => {
      it('should return date string', () => {
        const result = executeCommand(fs, HOME_DIR, 'date')
        expect(result.type).toBe('success')
        expect(typeof result.output).toBe('string')
        expect(result.output.length).toBeGreaterThan(0)
      })
    })

    describe('unknown command', () => {
      it('should error for unknown command', () => {
        const result = executeCommand(fs, HOME_DIR, 'foobar')
        expect(result.type).toBe('error')
        expect(result.output).toContain('command not found')
        expect(result.output).toContain('foobar')
      })
    })
  })

  describe('autocomplete', () => {
    beforeEach(() => {
      fs = makeFs()
    })

    describe('command completion', () => {
      it('should list all commands for empty input', () => {
        const result = autocomplete(fs, HOME_DIR, '')
        expect(Array.isArray(result.completions)).toBe(true)
        expect(result.completions.length).toBe(SUPPORTED_COMMANDS.length)
        for (const cmd of SUPPORTED_COMMANDS) {
          expect(result.completions).toContain(cmd)
        }
      })

      it('should complete single command uniquely', () => {
        const result = autocomplete(fs, HOME_DIR, 'pw')
        expect(result.completed).toBe('pwd ')
      })

      it('should complete with multiple matches', () => {
        const result = autocomplete(fs, HOME_DIR, 'c')
        expect(result.completions).toContain('cat')
        expect(result.completions).toContain('cd')
        expect(result.completions).toContain('clear')
        expect(result.completed).toBeNull()
      })

      it('should return empty for no match', () => {
        const result = autocomplete(fs, HOME_DIR, 'zzz')
        expect(result.completions).toEqual([])
        expect(result.completed).toBeNull()
      })
    })

    describe('path completion', () => {
      it('should complete path uniquely for directories', () => {
        const result = autocomplete(fs, HOME_DIR, 'cd doc')
        expect(result.completed).toBe('documents/')
      })

      it('should complete path uniquely for files', () => {
        const result = autocomplete(fs, '/home/user/documents', 'cat read')
        expect(result.completed).toBe('readme.txt ')
      })

      it('should return multiple matches', () => {
        const result = autocomplete(fs, HOME_DIR, 'cd d')
        expect(result.completions).toContain('documents')
        expect(result.completions).toContain('downloads')
        expect(result.completed).toBeNull()
      })

      it('should complete from subdirectory paths', () => {
        const result = autocomplete(fs, HOME_DIR, 'cd doc')
        expect(result.completions).toContain('documents')
      })

      it('should complete in / directory paths', () => {
        const result = autocomplete(fs, '/', 'cd hom')
        expect(result.completed).toBe('home/')
      })

      it('should return empty for non-matching prefix', () => {
        const result = autocomplete(fs, HOME_DIR, 'cd zzz')
        expect(result.completions).toEqual([])
        expect(result.completed).toBeNull()
      })

      it('should list directory contents on empty path cd command with space', () => {
        const result = autocomplete(fs, HOME_DIR, 'cd ')
        expect(result.completions.length).toBeGreaterThan(0)
      })

      it('should return nothing for echo args non-path-taking command', () => {
        const result = autocomplete(fs, HOME_DIR, 'echo hello')
        expect(result.completions).toEqual([])
      })
    })
  })

  describe('formatPrompt', () => {
    it('should replace HOME_DIR with tilde', () => {
      expect(formatPrompt(HOME_DIR)).toBe('~')
      expect(formatPrompt('/home/user/documents')).toBe('~/documents')
      expect(formatPrompt('/home/user/documents/projects')).toBe('~/documents/projects')
    })

    it('should show full path for non-home paths', () => {
      expect(formatPrompt('/etc/config')).toBe('/etc/config')
      expect(formatPrompt('/')).toBe('/')
      expect(formatPrompt('/usr/bin')).toBe('/usr/bin')
    })
  })
})
