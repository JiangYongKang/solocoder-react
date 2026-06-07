让我逐一修复这 6 个问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先看一下当前核心逻辑和相关组件的实现：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormField.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormField.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormCanvas.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\PropertyPanel.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\form-builder.css
          
现在我清楚所有 6 个问题了。让我逐一修复。先修复核心逻辑（问题 1 和 3）：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在修复问题 4 - 数字输入框的 placeholder 属性：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\PropertyPanel.jsx
          
changes: undefined
          
现在修复问题 2 - 字段间放置指示线，以及问题 5 - 375px 响应式样式。先更新 FormCanvas.jsx：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\FormCanvas.jsx
          
changes: undefined
          
现在更新 CSS - 添加放置指示线样式和 375px 响应式断点：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\form-builder.css
          

        
            
toolName: search_by_regex
            
status: success
          
query: \.fb-field-container
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\form-builder.css
          
changes: undefined
          
现在在 CSS 文件末尾添加 375px 超窄屏响应式样式，并确保字段之间有间距：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\form-builder.css
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\form-builder.css
          
changes: undefined
          
现在在 CSS 文件末尾添加 375px 超窄屏断点样式：













        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\form-builder.css
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\form-builder.css
          
changes: undefined
          
现在需要更新单元测试来匹配修改后的行为。让我先更新测试：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          
我发现用全局计数器有个问题——测试中手动创建的选项不会被计数器识别。让我改为扫描现有选项值找到最大编号后再递增，这样无论选项如何创建都不会重复：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\form-builder\formBuilderCore.js
          
changes: undefined
          
现在更新单元测试——修复 required 字段的断言并添加删除后添加不重复的测试：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\form-builder\formBuilderCore.test.js
          
changes: undefined
          
先检查 lint 然后运行测试：










        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/form-builder/ src/pages/__tests__/form-builder/ undefined
          
Lint 通过了！现在运行 pnpm run test：















        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
全部 445 个测试通过（12 个测试文件）！让我再验证下构建：











        
            
toolName: run_command
            
status: success
          
command: pnpm run build undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
全部 6 个问题已修复完成！以下是每个问题的修复详情：

## 🔧 修复内容

### 1. addOption 编号重复 ✅
**文件**: [formBuilderCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/formBuilderCore.js#L31-L46)

新增 `getNextOptionIndex()` 函数，扫描现有选项值中 `optionN` 的最大数字后缀，在此基础上 +1。删除第二个选项后再添加不会再出现重复的 `option3`。

```js
function getNextOptionIndex(options) {
  let max = 0
  options.forEach((opt) => {
    const match = opt.value.match(/^option(\d+)$/)
    if (match) max = Math.max(max, Number(match[1]))
  })
  return max + 1
}
```

### 2. 字段间放置指示线 ✅
**文件**: [FormCanvas.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/FormCanvas.jsx#L15)

新增 `dragOverIndex` state，拖拽经过字段时根据鼠标在字段上/下半部分，高亮对应位置的紫色指示线。支持：
- 第一个字段之前
- 任意两个字段之间
- 最后一个字段之后

**文件**: [form-builder.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/form-builder.css#L190-L204)

```css
.fb-drop-indicator-active {
  height: 4px;
  border-top: 3px solid var(--accent);
  box-shadow: 0 0 8px var(--accent-bg);
}
```

### 3. JSON Schema required 一致性 ✅
**文件**: [formBuilderCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/formBuilderCore.js#L174-L199)

统一规则：**无必填字段时一律不输出 `required` 键**。空画布、无必填字段两种场景现在行为一致。

### 4. 数字输入框 placeholder ✅
**文件**: [PropertyPanel.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/PropertyPanel.jsx#L73-L83)

将条件从 `!isNumber && type !== SWITCH` 改为 `type !== SWITCH`，数字输入框现在也能正常配置 placeholder。

### 5. 375px 超窄屏适配 ✅
**文件**: [form-builder.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/form-builder/form-builder.css#L494-L591)

新增 `@media (max-width: 375px)` 断点：
- 三栏堆叠为单栏
- 面板内边距缩至 12px
- 标题字号降至 14-16px
- 按钮、输入框、选项编辑器均缩小
- 字段面板和画布不再挤压错乱

### 6. 测试验证 ✅

```
Test Files  12 passed (12)
Tests       445 passed (445)
```

所有已有测试全部通过，同时新增了 3 个测试用例覆盖本次修复：
- 删除后再添加选项不重复
- 自定义值的选项后添加默认编号正确
- 无必填字段时 `required` 字段被省略