import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './terminal.css'
import { PROMPT_USER, PROMPT_HOST } from './constants.js'
import {
  createFilesystem,
  executeCommand,
  tokenizeForHighlight,
  autocomplete,
  formatPrompt,
  HOME_DIR,
} from './terminalCore.js'

const WELCOME_MESSAGE = `Welcome to Terminal Simulator v1.0.0
Type 'help' to see available commands.
`

function renderHighlightedTokens(commandStr) {
  const tokens = tokenizeForHighlight(commandStr)
  return tokens.map((token, idx) => (
    <span key={idx} className={`token-${token.type}`}>
      {token.value}
    </span>
  ))
}

function renderPrompt(currentPath) {
  const displayPath = formatPrompt(currentPath)
  return (
    <span className="terminal-prompt">
      <span className="prompt-user">{PROMPT_USER}</span>
      <span className="prompt-at">@</span>
      <span className="prompt-host">{PROMPT_HOST}</span>
      <span className="prompt-colon">:</span>
      <span className="prompt-path">{displayPath}</span>
      <span className="prompt-symbol">$</span>
    </span>
  )
}

function renderOutput(result) {
  if (result.type === 'empty' || result.output === null || result.output === undefined) {
    return null
  }

  if (result.type === 'ls' && Array.isArray(result.entries)) {
    return (
      <div className="terminal-output ls-output">
        {result.entries.map((entry, idx) => (
          <span key={idx} className={`ls-item ${entry.type}`}>
            {entry.type === 'directory' ? `${entry.name}/` : entry.name}
          </span>
        ))}
      </div>
    )
  }

  if (result.type === 'error') {
    return <div className="terminal-output error">{String(result.output)}</div>
  }

  return <div className={`terminal-output ${result.type}`}>{String(result.output)}</div>
}

export default function TerminalSimulatorPage() {
  const navigate = useNavigate()
  const [filesystem, setFilesystem] = useState(() => createFilesystem())
  const [currentPath, setCurrentPath] = useState(HOME_DIR)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lines, setLines] = useState(() => [
    { type: 'welcome', content: WELCOME_MESSAGE },
  ])
  const [autocompleteMenu, setAutocompleteMenu] = useState(null)

  const inputRef = useRef(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [lines])

  useEffect(() => {
    inputRef.current && inputRef.current.focus()
  }, [])

  const handleTerminalClick = useCallback(() => {
    inputRef.current && inputRef.current.focus()
  }, [])

  const handleClearScreen = useCallback(() => {
    setLines([])
    inputRef.current && inputRef.current.focus()
  }, [])

  const handleSubmit = useCallback(() => {
    const rawInput = input
    const trimmedInput = rawInput.trim()

    const newLines = [...lines]
    newLines.push({
      type: 'command',
      content: rawInput,
      path: currentPath,
    })

    if (trimmedInput !== '') {
      setHistory((prev) => [...prev, trimmedInput])
    }
    setHistoryIndex(-1)

    const result = executeCommand(filesystem, currentPath, trimmedInput)

    if (result.type === 'clear') {
      setFilesystem(result.filesystem || filesystem)
      setCurrentPath(result.newPath)
      setInput('')
      setAutocompleteMenu(null)
      setLines([])
      inputRef.current && inputRef.current.focus()
      return
    }

    if (result.type === 'mkdir' && result.filesystem) {
      setFilesystem(result.filesystem)
    } else if (result.filesystem) {
      setFilesystem(result.filesystem)
    }

    if (result.output !== null && result.output !== undefined) {
      newLines.push({
        type: 'output',
        resultType: result.type,
        content: result.output,
        entries: result.entries,
      })
    }

    if (result.newPath !== currentPath) {
      setCurrentPath(result.newPath)
    }

    setLines(newLines)
    setInput('')
    setAutocompleteMenu(null)
    inputRef.current && inputRef.current.focus()
  }, [input, lines, filesystem, currentPath])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex] || '')
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (history.length > 0 && historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= history.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(history[newIndex])
        }
      }
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const result = autocomplete(filesystem, currentPath, input)

      if (result.completed) {
        const { command, args } = {
          command: input.split(' ')[0] || '',
          args: input.split(' ').slice(1),
        }
        const newArgs = [...args]
        if (newArgs.length > 0) {
          newArgs[newArgs.length - 1] = result.completed
        } else {
          newArgs.push(result.completed)
        }
        const newInput = args.length > 0 || input.endsWith(' ')
          ? `${command} ${newArgs.join(' ')}`
          : result.completed
        setInput(newInput.trimEnd().endsWith('/') ? newInput.trimEnd() : newInput)
        setAutocompleteMenu(null)
      } else if (result.completions.length > 1) {
        setAutocompleteMenu(result.completions)
      } else if (result.completions.length === 0) {
        setAutocompleteMenu(null)
      } else {
        setAutocompleteMenu(result.completions)
      }
      return
    }

    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      handleClearScreen()
      return
    }

    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      const newLines = [...lines]
      newLines.push({
        type: 'command',
        content: input + '^C',
        path: currentPath,
      })
      setLines(newLines)
      setInput('')
      setHistoryIndex(-1)
      setAutocompleteMenu(null)
      return
    }

    setAutocompleteMenu(null)
  }, [handleSubmit, history, historyIndex, filesystem, currentPath, input, lines, handleClearScreen])

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value)
  }, [])

  return (
    <div className="terminal-page">
      <div className="terminal-header">
        <button onClick={() => navigate('/')}>← 返回首页</button>
        <h1>命令行终端模拟</h1>
        <button onClick={handleClearScreen}>清屏</button>
      </div>

      <div className="terminal-window" onClick={handleTerminalClick}>
        <div className="terminal-titlebar">
          <div className="terminal-buttons">
            <div className="terminal-btn close" />
            <div className="terminal-btn minimize" />
            <div className="terminal-btn maximize" />
          </div>
          <div className="terminal-title">Terminal — -zsh — {PROMPT_USER}@{PROMPT_HOST}</div>
          <div style={{ width: 60 }} />
        </div>

        <div className="terminal-body" ref={bodyRef}>
          {lines.map((line, idx) => {
            if (line.type === 'welcome') {
              return (
                <div key={idx} className="terminal-line terminal-output success">
                  {line.content}
                </div>
              )
            }
            if (line.type === 'command') {
              return (
                <div key={idx} className="terminal-line terminal-prompt-line">
                  {renderPrompt(line.path)}
                  <div className="terminal-highlighted">
                    {renderHighlightedTokens(line.content)}
                  </div>
                </div>
              )
            }
            if (line.type === 'output') {
              return (
                <div key={idx} className="terminal-line">
                  {renderOutput({
                    type: line.resultType,
                    output: line.content,
                    entries: line.entries,
                  })}
                </div>
              )
            }
            return null
          })}

          <div className="terminal-line terminal-prompt-line">
            {renderPrompt(currentPath)}
            <div className="terminal-input-wrapper">
              <div className="terminal-highlighted">
                {input ? renderHighlightedTokens(input) : null}
                <span className="terminal-cursor" />
              </div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="hidden-input"
                rows={1}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {autocompleteMenu && autocompleteMenu.length > 0 && (
          <div className="terminal-autocomplete">
            {autocompleteMenu.map((item, idx) => (
              <span key={idx} className="autocomplete-item">
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="terminal-tips">
        <strong>快捷键：</strong>
        <kbd>Enter</kbd> 执行命令 &nbsp;·&nbsp;
        <kbd>↑</kbd> <kbd>↓</kbd> 历史命令 &nbsp;·&nbsp;
        <kbd>Tab</kbd> 自动补全 &nbsp;·&nbsp;
        <kbd>Ctrl+L</kbd> 清屏 &nbsp;·&nbsp;
        <kbd>Ctrl+C</kbd> 取消当前输入
      </div>
    </div>
  )
}
