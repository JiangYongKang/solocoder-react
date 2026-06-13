import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  generateRandomArray,
  validateCustomInput,
  getSortGenerator,
  getOperationMessage,
  formatTime,
  ALGORITHMS,
  ALGORITHM_NAMES,
} from './sortAlgorithms.js'
import {
  OPERATION_TYPES,
  SPEED_CONFIG,
  speedToDelay,
  BAR_COLORS,
  DEFAULT_BAR_COUNT,
} from './constants.js'
import './sort-visualizer.css'

const RUN_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  DONE: 'done',
}

function getBarColor(index, step, sortedSet, pivotIndex) {
  if (sortedSet.has(index)) return BAR_COLORS.SORTED
  if (step && step.type === OPERATION_TYPES.SWAP && step.indices.includes(index)) {
    return BAR_COLORS.SWAP
  }
  if (step && step.type === OPERATION_TYPES.COMPARE && step.indices.includes(index)) {
    return BAR_COLORS.COMPARE
  }
  if (pivotIndex === index) return BAR_COLORS.PIVOT
  return BAR_COLORS.DEFAULT
}

function createVisualizerState() {
  return {
    array: generateRandomArray(DEFAULT_BAR_COUNT),
    generator: null,
    currentStep: null,
    sortedIndices: new Set(),
    pivotIndex: null,
    swappingIndices: new Set(),
    status: RUN_STATUS.IDLE,
    stepCount: 0,
    compareCount: 0,
    swapCount: 0,
    elapsedMs: 0,
    startTime: null,
    logs: [],
  }
}

function BarVisualizer({
  array,
  step,
  sortedIndices,
  pivotIndex,
  swappingIndices,
  containerWidth,
}) {
  const maxVal = useMemo(() => Math.max(...array, 1), [array])
  const areaWidth = containerWidth - 40
  const barWidth = Math.max(4, (areaWidth - array.length * 3) / array.length)
  const showValueInside = barWidth >= 24

  return (
    <div className="sv-visualizer-area">
      {array.map((val, idx) => {
        const height = (val / maxVal) * 320
        const bgColor = getBarColor(idx, step, sortedIndices, pivotIndex)
        const isSwapping = swappingIndices.has(idx)
        return (
          <div
            key={idx}
            className={`sv-bar${isSwapping ? ' swapping' : ''}`}
            style={{
              backgroundColor: bgColor,
              width: `${barWidth}px`,
              height: `${height + (showValueInside ? 0 : 14)}px`,
              minWidth: `${Math.max(4, barWidth)}px`,
            }}
          >
            {!showValueInside && (
              <span className="sv-bar-value">{val}</span>
            )}
            {showValueInside && height > 22 && (
              <span className="sv-bar-value inside">{val}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Legend() {
  return (
    <div className="sv-legend">
      <div className="sv-legend-item">
        <div className="sv-legend-color" style={{ backgroundColor: BAR_COLORS.DEFAULT }} />
        <span>未处理</span>
      </div>
      <div className="sv-legend-item">
        <div className="sv-legend-color" style={{ backgroundColor: BAR_COLORS.COMPARE }} />
        <span>正在比较</span>
      </div>
      <div className="sv-legend-item">
        <div className="sv-legend-color" style={{ backgroundColor: BAR_COLORS.SWAP }} />
        <span>正在交换</span>
      </div>
      <div className="sv-legend-item">
        <div className="sv-legend-color" style={{ backgroundColor: BAR_COLORS.SORTED }} />
        <span>已排序</span>
      </div>
      <div className="sv-legend-item">
        <div className="sv-legend-color" style={{ backgroundColor: BAR_COLORS.PIVOT }} />
        <span>Pivot (快排)</span>
      </div>
    </div>
  )
}

function VisualizerCard({
  title,
  state,
  algorithm,
  isWinner,
  containerWidth,
}) {
  const elapsedStr = formatTime(state.elapsedMs)
  return (
    <div className={`sv-visualizer-container${isWinner ? ' winner' : ''}`}>
      <div className="sv-visualizer-header">
        {isWinner && <span className="sv-winner-badge">🏆 先完成</span>}
        <span className="sv-algorithm-name">{title}</span>
        <div className="sv-stats-row">
          <span className="sv-stat-item">
            步数: <span className="sv-stat-value">{state.stepCount}</span>
          </span>
          <span className="sv-stat-item">
            比较: <span className="sv-stat-value compare">{state.compareCount}</span>
          </span>
          <span className="sv-stat-item">
            交换: <span className="sv-stat-value swap">{state.swapCount}</span>
          </span>
          <span className="sv-stat-item">
            时间: <span className="sv-stat-value time">{elapsedStr}</span>
          </span>
          {state.status === RUN_STATUS.DONE && (
            <span className="sv-done-indicator">✓ 完成</span>
          )}
        </div>
      </div>
      <BarVisualizer
        array={state.array}
        step={state.currentStep}
        sortedIndices={state.sortedIndices}
        pivotIndex={state.pivotIndex}
        swappingIndices={state.swappingIndices}
        containerWidth={containerWidth}
      />
    </div>
  )
}

export default function SortVisualizer() {
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [speed, setSpeed] = useState(SPEED_CONFIG.DEFAULT_SPEED)
  const [algorithmA, setAlgorithmA] = useState(ALGORITHMS.BUBBLE)
  const [algorithmB, setAlgorithmB] = useState(ALGORITHMS.QUICK)
  const [singleAlgorithm, setSingleAlgorithm] = useState(ALGORITHMS.BUBBLE)
  const [customInput, setCustomInput] = useState('')
  const [customError, setCustomError] = useState('')

  const [stateA, setStateA] = useState(() => createVisualizerState())
  const [stateB, setStateB] = useState(() => createVisualizerState())

  const stateARef = useRef(stateA)
  const stateBRef = useRef(stateB)
  stateARef.current = stateA
  stateBRef.current = stateB

  const timerRef = useRef(null)
  const timerBRef = useRef(null)

  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(800)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const currentDelay = useMemo(() => speedToDelay(speed), [speed])

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (timerBRef.current) {
      clearTimeout(timerBRef.current)
      timerBRef.current = null
    }
  }, [])

  const stepGeneratorOnce = useCallback((stateKey, setState, stateRef) => {
    const state = stateRef.current
    if (state.status === RUN_STATUS.DONE) return false

    if (state.status === RUN_STATUS.IDLE) {
      const algo = isCompareMode
        ? stateKey === 'A'
          ? algorithmA
          : algorithmB
        : singleAlgorithm
      const gen = getSortGenerator(algo, [...state.array])
      const newState = {
        ...state,
        generator: gen,
        status: RUN_STATUS.RUNNING,
        startTime: Date.now(),
      }
      setState(newState)
      stateRef.current = newState
    }

    const curState = stateRef.current
    if (!curState.generator) return false

    const next = curState.generator.next()
    if (next.done) {
      const allSorted = new Set(curState.array.map((_, i) => i))
      const endState = {
        ...curState,
        status: RUN_STATUS.DONE,
        sortedIndices: allSorted,
        currentStep: null,
        pivotIndex: null,
        swappingIndices: new Set(),
        elapsedMs: Date.now() - curState.startTime,
      }
      setState(endState)
      stateRef.current = endState
      return false
    }

    const step = next.value
    const newSorted = new Set(curState.sortedIndices)
    let newPivot = curState.pivotIndex
    let newSwapping = new Set()

    if (step.type === OPERATION_TYPES.SORTED) {
      for (const idx of step.indices) newSorted.add(idx)
    } else if (step.type === OPERATION_TYPES.PIVOT) {
      newPivot = step.indices[0]
    } else if (step.type === OPERATION_TYPES.SWAP) {
      newSwapping = new Set(step.indices)
    } else if (step.type === OPERATION_TYPES.COMPLETE) {
      const allSortedFinal = new Set(step.array.map((_, i) => i))
      const doneState = {
        ...curState,
        array: [...step.array],
        compareCount: step.compareCount,
        swapCount: step.swapCount,
        status: RUN_STATUS.DONE,
        sortedIndices: allSortedFinal,
        currentStep: step,
        pivotIndex: null,
        swappingIndices: new Set(),
        stepCount: curState.stepCount + 1,
        elapsedMs: Date.now() - curState.startTime,
        logs: [
          ...curState.logs,
          {
            stepNum: curState.stepCount + 1,
            type: step.type,
            message: getOperationMessage(
              step,
              ALGORITHM_NAMES[
                isCompareMode
                  ? stateKey === 'A'
                    ? algorithmA
                    : algorithmB
                  : singleAlgorithm
              ]
            ),
          },
        ],
      }
      setState(doneState)
      stateRef.current = doneState
      return false
    }

    const algoName =
      ALGORITHM_NAMES[
        isCompareMode
          ? stateKey === 'A'
            ? algorithmA
            : algorithmB
          : singleAlgorithm
      ]

    const nextState = {
      ...curState,
      array: [...step.array],
      currentStep: step,
      sortedIndices: newSorted,
      pivotIndex: newPivot,
      swappingIndices: newSwapping,
      compareCount: step.compareCount,
      swapCount: step.swapCount,
      stepCount: curState.stepCount + 1,
      elapsedMs: Date.now() - curState.startTime,
      logs:
        step.type === OPERATION_TYPES.SORTED && step.indices.length > 10
          ? curState.logs
          : [
              ...curState.logs,
              {
                stepNum: curState.stepCount + 1,
                type: step.type,
                message: getOperationMessage(step, algoName),
              },
            ],
    }

    setState(nextState)
    stateRef.current = nextState
    return true
  }, [isCompareMode, algorithmA, algorithmB, singleAlgorithm])

  const scheduleNext = useCallback(() => {
    const delay = speedToDelay(speed)
    const sA = stateARef.current
    const sB = stateBRef.current

    if (isCompareMode) {
      const aRunning = sA.status !== RUN_STATUS.DONE
      const bRunning = sB.status !== RUN_STATUS.DONE
      if (!aRunning && !bRunning) {
        return
      }

      if (aRunning) {
        timerRef.current = setTimeout(() => {
          const hasMore = stepGeneratorOnce('A', setStateA, stateARef)
          if (hasMore || stateBRef.current.status !== RUN_STATUS.DONE) {
            scheduleNext()
          }
        }, delay)
      }

      if (bRunning) {
        timerBRef.current = setTimeout(() => {
          stepGeneratorOnce('B', setStateB, stateBRef)
        }, delay)
      }
    } else {
      timerRef.current = setTimeout(() => {
        const hasMore = stepGeneratorOnce('A', setStateA, stateARef)
        if (hasMore) {
          scheduleNext()
        }
      }, delay)
    }
  }, [speed, isCompareMode, stepGeneratorOnce])

  const start = useCallback(() => {
    clearTimers()
    if (isCompareMode) {
      if (stateARef.current.status === RUN_STATUS.DONE) resetSingle('A')
      if (stateBRef.current.status === RUN_STATUS.DONE) resetSingle('B')
      stepGeneratorOnce('A', setStateA, stateARef)
      stepGeneratorOnce('B', setStateB, stateBRef)
      scheduleNext()
    } else {
      if (stateARef.current.status === RUN_STATUS.DONE) resetSingle('A')
      stepGeneratorOnce('A', setStateA, stateARef)
      scheduleNext()
    }
  }, [clearTimers, isCompareMode, stepGeneratorOnce, scheduleNext])

  const pause = useCallback(() => {
    clearTimers()
    const updateStatus = (s) => {
      if (s.status === RUN_STATUS.RUNNING) {
        const paused = { ...s, status: RUN_STATUS.PAUSED }
        return paused
      }
      return s
    }
    setStateA((prev) => {
      const updated = updateStatus(prev)
      stateARef.current = updated
      return updated
    })
    if (isCompareMode) {
      setStateB((prev) => {
        const updated = updateStatus(prev)
        stateBRef.current = updated
        return updated
      })
    }
  }, [clearTimers, isCompareMode])

  const resume = useCallback(() => {
    clearTimers()
    setStateA((prev) => {
      if (prev.status === RUN_STATUS.PAUSED) {
        const next = { ...prev, status: RUN_STATUS.RUNNING }
        stateARef.current = next
        return next
      }
      return prev
    })
    if (isCompareMode) {
      setStateB((prev) => {
        if (prev.status === RUN_STATUS.PAUSED) {
          const next = { ...prev, status: RUN_STATUS.RUNNING }
          stateBRef.current = next
          return next
        }
        return prev
      })
    }
    scheduleNext()
  }, [clearTimers, isCompareMode, scheduleNext])

  const stepSingle = useCallback(() => {
    clearTimers()
    if (isCompareMode) {
      stepGeneratorOnce('A', setStateA, stateARef)
      stepGeneratorOnce('B', setStateB, stateBRef)
    } else {
      stepGeneratorOnce('A', setStateA, stateARef)
    }
  }, [clearTimers, isCompareMode, stepGeneratorOnce])

  function resetSingle(key) {
    const freshState = createVisualizerState()
    if (key === 'A') {
      setStateA(freshState)
      stateARef.current = freshState
    } else {
      setStateB(freshState)
      stateBRef.current = freshState
    }
  }

  const reset = useCallback(() => {
    clearTimers()
    resetSingle('A')
    if (isCompareMode) resetSingle('B')
    setCustomError('')
  }, [clearTimers, isCompareMode])

  const setCustomData = useCallback(() => {
    clearTimers()
    const result = validateCustomInput(customInput)
    if (!result.valid) {
      setCustomError(result.error)
      return
    }
    setCustomError('')

    const createWithData = (data) => {
      const s = createVisualizerState()
      s.array = [...data]
      return s
    }

    const sA = createWithData(result.data)
    setStateA(sA)
    stateARef.current = sA

    if (isCompareMode) {
      const sB = createWithData(result.data)
      setStateB(sB)
      stateBRef.current = sB
    }
  }, [clearTimers, customInput, isCompareMode])

  const enterCompareMode = useCallback(() => {
    clearTimers()
    setIsCompareMode(true)
    const sB = createVisualizerState()
    sB.array = [...stateARef.current.array]
    setStateB(sB)
    stateBRef.current = sB
  }, [clearTimers])

  const exitCompareMode = useCallback(() => {
    clearTimers()
    setIsCompareMode(false)
  }, [clearTimers])

  const clearLogs = useCallback(() => {
    setStateA((prev) => {
      const next = { ...prev, logs: [] }
      stateARef.current = next
      return next
    })
    if (isCompareMode) {
      setStateB((prev) => {
        const next = { ...prev, logs: [] }
        stateBRef.current = next
        return next
      })
    }
  }, [isCompareMode])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const isRunning = stateA.status === RUN_STATUS.RUNNING ||
    (isCompareMode && stateB.status === RUN_STATUS.RUNNING)
  const isPaused = stateA.status === RUN_STATUS.PAUSED ||
    (isCompareMode && stateB.status === RUN_STATUS.PAUSED)
  const isDoneSingle = !isCompareMode && stateA.status === RUN_STATUS.DONE
  const isDoneCompare = isCompareMode &&
    stateA.status === RUN_STATUS.DONE &&
    stateB.status === RUN_STATUS.DONE
  const winnerKey = (() => {
    if (!isCompareMode) return null
    if (stateA.status === RUN_STATUS.DONE && stateB.status === RUN_STATUS.DONE) {
      if (stateA.elapsedMs < stateB.elapsedMs) return 'A'
      if (stateB.elapsedMs < stateA.elapsedMs) return 'B'
      return 'tie'
    }
    if (stateA.status === RUN_STATUS.DONE) return 'A'
    if (stateB.status === RUN_STATUS.DONE) return 'B'
    return null
  })()

  const allLogs = useMemo(() => {
    if (!isCompareMode) return stateA.logs
    const merged = []
    const maxLen = Math.max(stateA.logs.length, stateB.logs.length)
    for (let i = 0; i < maxLen; i++) {
      if (stateA.logs[i]) merged.push({ ...stateA.logs[i], side: 'A' })
      if (stateB.logs[i]) merged.push({ ...stateB.logs[i], side: 'B' })
    }
    return merged
  }, [stateA.logs, stateB.logs, isCompareMode])

  return (
    <div className="sort-visualizer-page">
      <div className="sv-header">
        <h1 className="sv-title">排序算法可视化</h1>
        <p className="sv-subtitle">
          直观理解冒泡、选择、插入和快速排序的执行过程 — 支持双算法同步对比
        </p>
      </div>

      <div className="sv-control-panel">
        <div className="sv-controls-row">
          {!isCompareMode ? (
            <div className="sv-control-group">
              <span className="sv-label">算法：</span>
              <select
                className="sv-select"
                value={singleAlgorithm}
                onChange={(e) => setSingleAlgorithm(e.target.value)}
                disabled={isRunning || isPaused}
              >
                {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="sv-algorithm-selector-group">
              <div className="sv-control-group">
                <span className="sv-label">算法 A：</span>
                <select
                  className="sv-select"
                  value={algorithmA}
                  onChange={(e) => setAlgorithmA(e.target.value)}
                  disabled={isRunning || isPaused}
                >
                  {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="sv-control-group">
                <span className="sv-label">算法 B：</span>
                <select
                  className="sv-select"
                  value={algorithmB}
                  onChange={(e) => setAlgorithmB(e.target.value)}
                  disabled={isRunning || isPaused}
                >
                  {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="sv-speed-control">
            <span className="sv-label">速度：</span>
            <input
              type="range"
              min={SPEED_CONFIG.MIN_SPEED}
              max={SPEED_CONFIG.MAX_SPEED}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="sv-speed-slider"
            />
            <span className="sv-speed-value">{speed}x · {currentDelay}ms</span>
          </div>
        </div>

        <div className="sv-controls-row">
          <div className="sv-control-group">
            {!isRunning && !isPaused && (
              <button
                className="sv-btn sv-btn-primary"
                onClick={start}
                disabled={isDoneSingle || isDoneCompare}
              >
                ▶ 开始
              </button>
            )}
            {isRunning && (
              <button className="sv-btn sv-btn-warning" onClick={pause}>
                ⏸ 暂停
              </button>
            )}
            {isPaused && (
              <button className="sv-btn sv-btn-success" onClick={resume}>
                ▶ 继续
              </button>
            )}
            <button
              className="sv-btn sv-btn-secondary"
              onClick={stepSingle}
              disabled={isRunning}
            >
              ⏭ 单步
            </button>
            <button className="sv-btn sv-btn-danger" onClick={reset}>
              ↺ 重置
            </button>
            {!isCompareMode ? (
              <button
                className="sv-btn sv-btn-purple"
                onClick={enterCompareMode}
                disabled={isRunning || isPaused}
              >
                ⚖ 对比模式
              </button>
            ) : (
              <button
                className="sv-btn sv-btn-secondary"
                onClick={exitCompareMode}
                disabled={isRunning || isPaused}
              >
                ✕ 退出对比
              </button>
            )}
          </div>
        </div>

        <div className="sv-controls-row">
          <div className="sv-control-group" style={{ flex: 1, minWidth: 0 }}>
            <span className="sv-label">自定义数据：</span>
            <input
              type="text"
              className={`sv-custom-input${customError ? ' error' : ''}`}
              placeholder="输入逗号分隔的数字，如 5,3,8,1,9,2（至少 3 个，最多 50 个）"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value)
                if (customError) setCustomError('')
              }}
              disabled={isRunning}
            />
            <button
              className="sv-btn sv-btn-primary"
              onClick={setCustomData}
              disabled={isRunning || !customInput.trim()}
            >
              使用自定义
            </button>
          </div>
        </div>
        {customError && <div className="sv-error-text">{customError}</div>}
      </div>

      {isCompareMode && (
        <div className="sv-compare-mode-banner">
          <span className="sv-compare-banner-text">
            对比模式：{ALGORITHM_NAMES[algorithmA]}  VS  {ALGORITHM_NAMES[algorithmB]}
          </span>
          {winnerKey && winnerKey !== 'tie' && (
            <span className="sv-compare-banner-text">
              🏆 胜者：{winnerKey === 'A' ? ALGORITHM_NAMES[algorithmA] : ALGORITHM_NAMES[algorithmB]}
            </span>
          )}
          {winnerKey === 'tie' && (
            <span className="sv-compare-banner-text">🤝 平局！</span>
          )}
        </div>
      )}

      <div className="sv-main-content" ref={containerRef}>
        <div className={`sv-visualizer-wrapper${isCompareMode ? ' compare-mode' : ''}`}>
          {!isCompareMode ? (
            <VisualizerCard
              title={ALGORITHM_NAMES[singleAlgorithm]}
              state={stateA}
              algorithm={singleAlgorithm}
              containerWidth={containerWidth}
            />
          ) : (
            <>
              <VisualizerCard
                title={`A · ${ALGORITHM_NAMES[algorithmA]}`}
                state={stateA}
                algorithm={algorithmA}
                isWinner={winnerKey === 'A'}
                containerWidth={Math.max(300, (containerWidth - 20) / 2)}
              />
              <VisualizerCard
                title={`B · ${ALGORITHM_NAMES[algorithmB]}`}
                state={stateB}
                algorithm={algorithmB}
                isWinner={winnerKey === 'B'}
                containerWidth={Math.max(300, (containerWidth - 20) / 2)}
              />
            </>
          )}
        </div>

        <Legend />

        <div className="sv-bottom-section">
          <div className="sv-log-panel">
            <div className="sv-log-header">
              <h3 className="sv-log-title">📋 操作日志</h3>
              <button className="sv-log-clear-btn" onClick={clearLogs}>
                清空
              </button>
            </div>
            <div className="sv-log-content">
              {allLogs.length === 0 ? (
                <div className="sv-empty-state">点击「开始」运行排序算法</div>
              ) : (
                allLogs.slice(-200).map((log, idx) => (
                  <div
                    key={idx}
                    className={`sv-log-entry ${log.type}`}
                  >
                    <span className="sv-log-step">
                      {isCompareMode ? `[${log.side}]#${log.stepNum}` : `#${log.stepNum}`}
                    </span>
                    <span className="sv-log-type">{log.type}</span>
                    <span className="sv-log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sv-summary-panel">
            <h3 className="sv-summary-header">📊 统计信息</h3>
            {!isCompareMode ? (
              <>
                <div className="sv-summary-card">
                  <div className="sv-summary-label">{ALGORITHM_NAMES[singleAlgorithm]}</div>
                  <div className="sv-summary-grid">
                    <div>
                      <div className="sv-summary-label">比较次数</div>
                      <div className="sv-summary-value compare">{stateA.compareCount}</div>
                    </div>
                    <div>
                      <div className="sv-summary-label">交换次数</div>
                      <div className="sv-summary-value swap">{stateA.swapCount}</div>
                    </div>
                  </div>
                </div>
                <div className="sv-summary-card">
                  <div className="sv-summary-label">执行步数</div>
                  <div className="sv-summary-value">{stateA.stepCount}</div>
                </div>
                <div className="sv-summary-card">
                  <div className="sv-summary-label">总耗时</div>
                  <div className="sv-summary-value time">{formatTime(stateA.elapsedMs)}</div>
                </div>
              </>
            ) : (
              <div className="sv-summary-grid">
                <div className="sv-summary-card">
                  <div className="sv-summary-label">A · {ALGORITHM_NAMES[algorithmA]}</div>
                  <div className="sv-summary-label" style={{ marginTop: 8 }}>
                    比较: <span className="sv-summary-value compare">{stateA.compareCount}</span>
                  </div>
                  <div className="sv-summary-label">
                    交换: <span className="sv-summary-value swap">{stateA.swapCount}</span>
                  </div>
                  <div className="sv-summary-label">
                    步数: <span className="sv-stat-value">{stateA.stepCount}</span>
                  </div>
                  <div className="sv-summary-label" style={{ marginTop: 8 }}>
                    耗时: <span className="sv-summary-value time">{formatTime(stateA.elapsedMs)}</span>
                  </div>
                </div>
                <div className="sv-summary-card">
                  <div className="sv-summary-label">B · {ALGORITHM_NAMES[algorithmB]}</div>
                  <div className="sv-summary-label" style={{ marginTop: 8 }}>
                    比较: <span className="sv-summary-value compare">{stateB.compareCount}</span>
                  </div>
                  <div className="sv-summary-label">
                    交换: <span className="sv-summary-value swap">{stateB.swapCount}</span>
                  </div>
                  <div className="sv-summary-label">
                    步数: <span className="sv-stat-value">{stateB.stepCount}</span>
                  </div>
                  <div className="sv-summary-label" style={{ marginTop: 8 }}>
                    耗时: <span className="sv-summary-value time">{formatTime(stateB.elapsedMs)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
