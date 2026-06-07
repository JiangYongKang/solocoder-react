import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import NodePanel from './NodePanel'
import WorkflowCanvas from './WorkflowCanvas'
import PropertyPanel from './PropertyPanel'
import {
  loadFromStorage,
  saveToStorage,
  downloadJson,
  importFromJson,
  simulateExecution,
  updateNode,
  deleteNode,
  deleteEdgesByNodeId,
  hasStartNode,
  hasEndNode,
  getNodeById,
} from './workflowCore'
import './workflow.css'

function WorkflowPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [nodes, setNodes] = useState(() => {
    const saved = loadFromStorage()
    return saved.nodes || []
  })

  const [edges, setEdges] = useState(() => {
    const saved = loadFromStorage()
    return saved.edges || []
  })

  const [selectedNodeId, setSelectedNodeId] = useState(null)

  const [activeNodeIds, setActiveNodeIds] = useState([])
  const [activeEdgeIds, setActiveEdgeIds] = useState([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [simStatus, setSimStatus] = useState('')
  const simTimerRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage({ nodes, edges })
    }, 0)
    return () => clearTimeout(timer)
  }, [nodes, edges])

  useEffect(() => {
    return () => {
      if (simTimerRef.current) {
        clearTimeout(simTimerRef.current)
      }
    }
  }, [])

  const selectedNode = selectedNodeId ? getNodeById(nodes, selectedNodeId) : null

  const handleUpdateNode = useCallback((nodeId, updates) => {
    setNodes((prev) => updateNode(prev, nodeId, updates))
  }, [])

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((prev) => deleteNode(prev, nodeId))
    setEdges((prev) => deleteEdgesByNodeId(prev, nodeId))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }, [selectedNodeId])

  const handleExport = useCallback(() => {
    downloadJson({ nodes, edges })
  }, [nodes, edges])

  const handleImportClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const jsonData = JSON.parse(ev.target.result)
        const result = importFromJson(jsonData)
        if (!result.valid) {
          alert(`导入失败: ${result.error}`)
          return
        }
        setNodes(result.data.nodes)
        setEdges(result.data.edges)
        setSelectedNodeId(null)
      } catch {
        alert('导入失败: 无法解析 JSON 文件')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleClear = useCallback(() => {
    if (!window.confirm('确定要清空所有节点和连线吗？')) return
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setActiveNodeIds([])
    setActiveEdgeIds([])
  }, [])

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current)
      simTimerRef.current = null
    }
    setIsSimulating(false)
    setActiveNodeIds([])
    setActiveEdgeIds([])
    setSimStatus('')
  }, [])

  const handleSimulate = useCallback(() => {
    if (isSimulating) {
      stopSimulation()
      return
    }

    if (!hasStartNode(nodes)) {
      alert('请先添加一个开始节点')
      return
    }
    if (!hasEndNode(nodes)) {
      alert('请先添加一个结束节点')
      return
    }

    const result = simulateExecution(nodes, edges)
    if (result.error) {
      alert(`模拟执行失败: ${result.error}`)
      return
    }

    setIsSimulating(true)
    setSimStatus('正在执行...')

    const path = result.path
    let step = 0

    const runStep = () => {
      if (step >= path.length) {
        setSimStatus('执行完成')
        simTimerRef.current = setTimeout(() => {
          stopSimulation()
        }, 1500)
        return
      }

      const item = path[step]
      if (item.type === 'node') {
        const node = getNodeById(nodes, item.nodeId)
        setActiveNodeIds((prev) => [...prev, item.nodeId])
        if (node) {
          setSimStatus(`当前节点: ${node.label}`)
        }
      } else if (item.type === 'edge') {
        setActiveEdgeIds((prev) => [...prev, item.edgeId])
      } else if (item.type === 'loop') {
        setSimStatus('检测到循环，已停止')
        simTimerRef.current = setTimeout(() => {
          stopSimulation()
        }, 1500)
        return
      } else if (item.type === 'dead-end') {
        setSimStatus('流程未到达结束节点')
        simTimerRef.current = setTimeout(() => {
          stopSimulation()
        }, 1500)
        return
      }

      step++
      simTimerRef.current = setTimeout(runStep, 600)
    }

    simTimerRef.current = setTimeout(runStep, 300)
  }, [isSimulating, nodes, edges, stopSimulation])

  return (
    <div className="wf-page">
      <header className="wf-header">
        <div className="wf-header-left">
          <button
            type="button"
            className="wf-btn wf-btn-back"
            onClick={() => navigate('/')}
          >
            ← 返回
          </button>
          <h1 className="wf-title">流程编排器</h1>
        </div>
        <div className="wf-header-actions">
          <button
            type="button"
            className={`wf-btn ${isSimulating ? 'wf-btn-primary' : ''}`}
            onClick={handleSimulate}
          >
            {isSimulating ? '⏹ 停止模拟' : '▶ 模拟执行'}
          </button>
          <button
            type="button"
            className="wf-btn"
            onClick={handleImportClick}
          >
            ⬆ 导入 JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button
            type="button"
            className="wf-btn"
            onClick={handleExport}
          >
            ⬇ 导出 JSON
          </button>
          <button
            type="button"
            className="wf-btn wf-btn-danger"
            onClick={handleClear}
          >
            🗑 清空
          </button>
        </div>
      </header>

      <div className="wf-main">
        <NodePanel />

        <div style={{ position: 'relative' }}>
          {isSimulating && (
            <div className="wf-sim-status">
              <span className="wf-sim-dot" />
              {simStatus}
            </div>
          )}
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            activeNodeIds={activeNodeIds}
            activeEdgeIds={activeEdgeIds}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onSelectNode={setSelectedNodeId}
            isSimulating={isSimulating}
          />
        </div>

        <PropertyPanel
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
        />
      </div>
    </div>
  )
}

export default WorkflowPage
