import '@/App.css'

function App() {
  const tasks = [
    { id: 1, title: 'React', description: '用于构建用户界面的 JavaScript 库，采用组件化架构，让 UI 开发更高效。' },
    { id: 2, title: 'Vite', description: '下一代前端构建工具，基于原生 ES 模块，提供极速的开发服务器和构建能力。' },
    { id: 3, title: '组件化', description: '将 UI 拆分为独立、可复用的组件，每个组件管理自己的状态和样式。' },
    { id: 4, title: '热更新', description: '代码修改后即时反映到浏览器，无需手动刷新，大幅提升开发效率。' },
    { id: 5, title: '响应式', description: '一套界面适配不同屏幕尺寸，从桌面端到移动端都能提供良好体验。' },
    { id: 6, title: '高性能', description: '利用虚拟 DOM 和 diff 算法，最小化真实 DOM 操作，保证应用流畅运行。' },
  ]

  return (
    <div className="page">
      <h1 className="page-title">欢迎使用 Solocoder React</h1>
      <div className="task-grid">
        {tasks.map((task) => (
          <div className="task" key={task.id}>
            <h2 className="task-title">{task.id}: {task.title}</h2>
            <p className="task-desc">{task.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
