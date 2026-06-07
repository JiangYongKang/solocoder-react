我来逐一修复这 8 个问题。先创建任务列表。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
先读取所有需要修改的文件。






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\components\StepIndicator.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\utils\validation.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\components\Step1BasicInfo.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\utils\storage.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wizard\validation.test.js
          
现在我清楚所有问题了。开始逐一修复。

**修复 1：步骤指示器连接线颜色** — 正确逻辑是"走完的路才亮"，即 `step-completed` 内部的连接线才高亮。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.css
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
**修复 2-6**：同时处理地址校验、手机号输入、useState 惰性初始化、currentStep 范围校验、清理死代码。










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\utils\validation.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\components\Step1BasicInfo.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\utils\storage.js
          
changes: undefined
          
注意到 Wizard.jsx 里 `loadDraft()` 还是在两个 useState 惰性初始化里各调了一次，让我优化成只调用一次。然后更新测试文件。












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wizard\Wizard.jsx
          
changes: undefined
          
现在修复测试文件 — 补充 validateStep 的 step 1/2 测试，添加 validateAddress 空白字符测试，同时更新 storage 测试（移除死代码测试、添加 clampStep 测试）。先读取现有测试内容。





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wizard\validation.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wizard\storage.test.js
          
更新两个测试文件。













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wizard\validation.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wizard\validation.test.js
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wizard\storage.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
先运行 wizard 测试确认全部通过。

















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm vitest --run src/pages/__tests__/wizard/ undefined
          
58 个测试全部通过（从 46 增加到 58）。现在启动 dev 服务器验证视觉效果，同时跑一下 lint。



















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm eslint src/pages/wizard src/pages/__tests__/wizard undefined
          

        
            
toolName: run_command
            
status: running
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm dev undefined
          
Lint 通过，Dev 服务器已启动在 5175 端口。让我打开预览。



















        
            
toolName: open_preview
            
status: success
          
预览
          

        
            
toolName: check_command_status
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
全部 8 个问题已修复完成。以下是改动详情：

## 修复内容总结

### 1. 步骤指示器连接线颜色 — [Wizard.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/Wizard.css#L92-L94)

旧逻辑用了 `.step-completed ~ .step-item .step-line`（已完成步骤**后面的**连接线）和 `.step-active .step-line`（当前步骤的连接线），导致"走完的路灰、没走的路亮"。

改为 `.step-completed .step-line`：只有已完成步骤**自身的**连接线才高亮，符合"走完的路才亮"的预期。

### 2. validateAddress 空白字符漏判 — [validation.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/utils/validation.js#L48-L60)

新增 trim 后的长度为 0 的判断：

```js
const trimmed = address.trim()
if (trimmed.length === 0) {
  return { valid: false, message: '请输入详细地址' }
}
```

### 3. 手机号输入框 maxLength 与 replace 冲突 — [Step1BasicInfo.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/components/Step1BasicInfo.jsx#L33-L40)

移除 `maxLength={11}`，改为 `inputMode="numeric"` 提示数字键盘。`onChange` 中 `replace(/\D/g, '')` 已经做了纯数字过滤，粘贴 `"138-8000-1234"` 时先完整接收再清洗成 `"13880001234"`，11 位完整保留。校验层本身也要求 11 位，无需在输入层截断。

### 4. loadDraft 移到 useState 惰性初始化 — [Wizard.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/Wizard.jsx#L22-L29)

从组件顶层 `const initialDraft = loadDraft()`（每次重渲染都读 + parse）改成 `useState(() => loadDraft().currentStep)`，只在首次挂载时读一次 localStorage。

### 5. currentStep 越界范围校验 — [storage.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/utils/storage.js#L49-L52)

新增 `clampStep(step)` 工具函数，将非法值钳制到 `[0, TOTAL_STEPS-1]` 范围（即 `0~3`），`mergeWithDefaults` 改用它：

```js
export function clampStep(step) {
  if (typeof step !== 'number' || Number.isNaN(step)) return 0
  return Math.max(0, Math.min(3, Math.floor(step)))
}
```

### 6. 清理死代码 — [storage.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wizard/utils/storage.js)

移除了无人调用的 `updateDraftStep` 和 `updateDraftData` 两个导出函数，测试文件中对应的测试也同步删除。

### 7. 补充 validateStep 测试覆盖 — [validation.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/wizard/validation.test.js#L235-L290)

新增 step 0/1/2/3 的合法 + 非法数据测试共 7 个用例（原 2 个 → 现 7 个），validateAddress 也新增了空白字符的测试。

---

### 验证结果

- ✅ **58 个 wizard 单元测试全部通过**（从 46 增至 58）
- ✅ **wizard 相关文件 eslint 零错误**
- ✅ **Dev 服务器运行正常**，页面无运行时错误，预览已打开 http://localhost:5175/wizard