const PreviewArea = () => {
  const tableData = [
    { id: 1, name: '张三', role: '管理员', status: '正常', created: '2024-01-15' },
    { id: 2, name: '李四', role: '编辑', status: '正常', created: '2024-02-20' },
    { id: 3, name: '王五', role: '访客', status: '禁用', created: '2024-03-10' },
  ]

  return (
    <section className="te-preview">
      <div className="te-preview-header">
        <h2 className="te-panel-title">实时预览</h2>
        <span className="te-preview-subtitle">所有样式由左侧控件驱动</span>
      </div>

      <div className="te-preview-section">
        <h3 className="te-preview-section-title">按钮</h3>
        <div className="te-button-row">
          <button type="button" className="te-btn te-btn-primary">主要按钮</button>
          <button type="button" className="te-btn te-btn-secondary">次要按钮</button>
          <button type="button" className="te-btn te-btn-success">成功</button>
          <button type="button" className="te-btn te-btn-warning">警告</button>
          <button type="button" className="te-btn te-btn-error">错误</button>
          <button type="button" className="te-btn te-btn-outline">轮廓按钮</button>
          <button type="button" className="te-btn te-btn-ghost">幽灵按钮</button>
          <button type="button" className="te-btn te-btn-primary" disabled>禁用按钮</button>
        </div>
      </div>

      <div className="te-preview-section">
        <h3 className="te-preview-section-title">输入控件</h3>
        <div className="te-form-grid">
          <div className="te-form-item">
            <label className="te-form-label">用户名</label>
            <input type="text" className="te-input" placeholder="请输入用户名" defaultValue="admin" />
          </div>
          <div className="te-form-item">
            <label className="te-form-label">邮箱</label>
            <input type="email" className="te-input" placeholder="请输入邮箱" />
          </div>
          <div className="te-form-item">
            <label className="te-form-label">角色选择</label>
            <select className="te-select">
              <option>管理员</option>
              <option>编辑</option>
              <option>访客</option>
            </select>
          </div>
          <div className="te-form-item te-form-item-full">
            <label className="te-form-label">个人简介</label>
            <textarea className="te-textarea" rows="3" placeholder="请输入个人简介..." defaultValue="这是一段示例文本，用于展示文本域的样式效果。" />
          </div>
          <div className="te-form-item">
            <label className="te-checkbox">
              <input type="checkbox" defaultChecked />
              <span>记住登录状态</span>
            </label>
          </div>
          <div className="te-form-item">
            <label className="te-radio">
              <input type="radio" name="gender" defaultChecked />
              <span>男</span>
            </label>
            <label className="te-radio">
              <input type="radio" name="gender" />
              <span>女</span>
            </label>
          </div>
        </div>
      </div>

      <div className="te-preview-section">
        <h3 className="te-preview-section-title">提示信息</h3>
        <div className="te-alert-group">
          <div className="te-alert te-alert-info">
            <strong>信息：</strong>这是一条普通的信息提示。
          </div>
          <div className="te-alert te-alert-success">
            <strong>成功：</strong>操作已成功完成！
          </div>
          <div className="te-alert te-alert-warning">
            <strong>警告：</strong>请注意，此操作不可撤销。
          </div>
          <div className="te-alert te-alert-error">
            <strong>错误：</strong>发生了一个错误，请稍后重试。
          </div>
        </div>
      </div>

      <div className="te-preview-section">
        <h3 className="te-preview-section-title">卡片</h3>
        <div className="te-card-grid">
          <div className="te-card">
            <div className="te-card-header">
              <h4 className="te-card-title">基础卡片</h4>
            </div>
            <div className="te-card-body">
              <p>这是一个基础卡片的内容区域，可以放置任意内容。卡片使用表面色背景和边框色边框。</p>
            </div>
          </div>
          <div className="te-card te-card-accent">
            <div className="te-card-header">
              <h4 className="te-card-title">强调卡片</h4>
            </div>
            <div className="te-card-body">
              <p>强调卡片使用主色调作为边框强调，用于突出显示重要信息。</p>
            </div>
            <div className="te-card-footer">
              <button type="button" className="te-btn te-btn-primary te-btn-sm">了解更多</button>
            </div>
          </div>
          <div className="te-card">
            <div className="te-card-avatar" style={{ background: 'var(--te-accent)' }}>A</div>
            <div className="te-card-body">
              <h4 className="te-card-title">带头像卡片</h4>
              <p className="te-card-meta">2024年1月发布</p>
              <p>卡片支持多种布局形式，包括带头像、标签等变体。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="te-preview-section">
        <h3 className="te-preview-section-title">数据表格</h3>
        <div className="te-table-wrap">
          <table className="te-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>角色</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.role}</td>
                  <td>
                    <span className={`te-badge ${row.status === '正常' ? 'te-badge-success' : 'te-badge-error'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="te-preview-section">
        <h3 className="te-preview-section-title">排版</h3>
        <div className="te-typography-demo">
          <h1>一级标题 H1</h1>
          <h2>二级标题 H2</h2>
          <h3>三级标题 H3</h3>
          <p>
            这是正文段落文字。段落间距由左侧的"段落间距"滑块控制，行高由"行高"滑块控制，
            字体大小由"字体大小"滑块控制。你可以通过调整这些参数来获得最佳的阅读体验。
          </p>
          <p>
            这是另一段正文。<strong>加粗文字</strong>、<em>斜体文字</em>、
            <code>inline code</code> 以及 <a href="#" className="te-link">链接文字</a> 都有各自的样式。
          </p>
          <blockquote className="te-blockquote">
            这是一段引用文字，用于展示引用块的样式效果。引用通常用于强调重要的观点或摘录。
          </blockquote>
        </div>
      </div>
    </section>
  )
}

export default PreviewArea
