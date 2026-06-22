export const PROMPT_USER = 'user'
export const PROMPT_HOST = 'localhost'
export const HOME_DIR = '/home/user'

export const COMMANDS = {
  LS: 'ls',
  CD: 'cd',
  CAT: 'cat',
  MKDIR: 'mkdir',
  PWD: 'pwd',
  CLEAR: 'clear',
  HELP: 'help',
  ECHO: 'echo',
  WHOAMI: 'whoami',
  DATE: 'date',
}

export const SUPPORTED_COMMANDS = Object.values(COMMANDS)

export const INITIAL_FILESYSTEM = {
  type: 'directory',
  children: {
    home: {
      type: 'directory',
      children: {
        user: {
          type: 'directory',
          children: {
            documents: {
              type: 'directory',
              children: {
                'readme.txt': {
                  type: 'file',
                  content:
                    'Welcome to the Terminal Simulator!\n\nThis is a simulated Unix-like command line environment.\nTry out some commands like ls, cd, cat, etc.\n',
                },
                'notes.md': {
                  type: 'file',
                  content:
                    '# Notes\n\n- Remember to use Tab for autocomplete\n- Use arrow keys for command history\n- Type "help" to see available commands\n',
                },
                projects: {
                  type: 'directory',
                  children: {
                    'todo.txt': {
                      type: 'file',
                      content:
                        'Project TODO:\n1. Implement feature A\n2. Write tests\n3. Deploy to production\n',
                    },
                  },
                },
              },
            },
            downloads: {
              type: 'directory',
              children: {
                'image.png': {
                  type: 'file',
                  content: '[Binary file: image.png - 2.4 MB]\n',
                },
                'report.pdf': {
                  type: 'file',
                  content: '[Binary file: report.pdf - 856 KB]\n',
                },
              },
            },
            pictures: {
              type: 'directory',
              children: {},
            },
            '.bashrc': {
              type: 'file',
              content:
                '# ~/.bashrc\n\nexport PS1="\\u@\\h:\\w$ "\nexport PATH="/usr/local/bin:$PATH"\n\nalias ll="ls -la"\nalias la="ls -a"\n',
            },
          },
        },
      },
    },
    etc: {
      type: 'directory',
      children: {
        config: {
          type: 'directory',
          children: {
            'settings.conf': {
              type: 'file',
              content:
                '[general]\nlanguage = en_US\ntheme = dark\nautocomplete = true\n\n[history]\nmax_entries = 1000\npersist = true\n',
            },
            'network.conf': {
              type: 'file',
              content:
                '[network]\nhostname = localhost\nport = 8080\ntimeout = 30\nretries = 3\n',
            },
          },
        },
        hosts: {
          type: 'file',
          content:
            '127.0.0.1   localhost\n::1         localhost ip6-localhost\n10.0.0.1    gateway.local\n192.168.1.1 router.local\n',
        },
      },
    },
    usr: {
      type: 'directory',
      children: {
        bin: {
          type: 'directory',
          children: {
            ls: { type: 'file', content: '[executable binary]\n' },
            cat: { type: 'file', content: '[executable binary]\n' },
            mkdir: { type: 'file', content: '[executable binary]\n' },
          },
        },
        local: {
          type: 'directory',
          children: {
            share: {
              type: 'directory',
              children: {},
            },
          },
        },
      },
    },
    tmp: {
      type: 'directory',
      children: {
        'temp.txt': {
          type: 'file',
          content: 'This is a temporary file.\nIt may be deleted at any time.\n',
        },
      },
    },
    var: {
      type: 'directory',
      children: {
        log: {
          type: 'directory',
          children: {
            'system.log': {
              type: 'file',
              content:
                '[2024-01-15 08:00:01] System started\n[2024-01-15 08:00:02] Network initialized\n[2024-01-15 08:00:05] Services loaded\n[2024-01-15 09:15:33] User login: user\n[2024-01-15 10:30:00] Backup completed\n',
            },
          },
        },
      },
    },
  },
}

export const HIGHLIGHT_COLORS = {
  command: '#50fa7b',
  argument: '#f8f8f2',
  path: '#8be9fd',
  flag: '#ff79c6',
  prompt: '#50fa7b',
  promptAt: '#f8f8f2',
  promptHost: '#bd93f9',
  promptPath: '#8be9fd',
  promptSymbol: '#f8f8f2',
  directory: '#8be9fd',
  file: '#f8f8f2',
  error: '#ff5555',
  warning: '#f1fa8c',
  success: '#50fa7b',
}

export const HELP_TEXT = `Available commands:

  ls              List directory contents
  cd <dir>        Change directory (cd .. for parent, cd / for root, cd ~ for home)
  cat <file>      Display file contents
  mkdir <dir>     Create a new directory
  pwd             Print working directory
  clear           Clear the terminal screen
  echo <text>     Print text to terminal
  whoami          Display current user
  date            Display current date and time
  help            Show this help message

Useful tips:
  - Press Tab for auto-completion
  - Press Up/Down arrows for command history
  - Press Ctrl+L or type "clear" to clear the screen
`
