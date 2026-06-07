toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先读取相关文件确认当前状态，然后一次性改完。









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\components\Step1BasicInfo.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.jsx
          
三个问题一起修复。

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.css
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\components\Step1BasicInfo.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
运行测试确认所有改动不破坏已有测试。
















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm vitest --run src/pages/__tests__/wizard/ undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
全部 4 处修改已完成，58 个 wizard 测试继续全部通过。

## 修复内容

### 1. 当前步骤连接线也高亮 — [Wizard.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/Wizard.css#L92-L94)

```css
.step-completed .step-line,
.step-active .step-line {
  background: var(--accent-border);
}
```

已完成步骤 + 当前步骤的连接线都显示强调色，实现"走完的路亮、正在走的路也亮"。

### 2. 手机号加回 maxLength={11} — [Step1BasicInfo.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/components/Step1BasicInfo.jsx#L33-L41)

`maxLength={11}` 管长度上限，`replace(/\D/g, '')` 管数字格式清洗，两者各司其职不冲突。粘贴超长纯数字也会被浏览器在输入层截到 11 位。

### 3. loadDraft 只调用一次 — [Wizard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/Wizard.jsx#L22-L24)

```js
const [initialDraft] = useState(() => loadDraft())
const [currentStep, setCurrentStep] = useState(initialDraft.currentStep)
const [formData, setFormData] = useState(initialDraft.data)
```

用一个惰性初始化的 `useState` 缓存草稿对象，`currentStep` 和 `formData` 直接从缓存读取，localStorage 只读一次、JSON 只 parse 一次。

### ✅ 测试结果：58 passed (58)