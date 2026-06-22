我来修复这两个问题。先查看相关文件：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\weekly-report\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\weekly-report\utils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\weekly-report\storage.test.js
          
让我完整查看两个测试文件的导入使用情况：






        
            
toolName: search_by_regex
            
status: success
          
query: beforeEach|vi\.
          

        
            
toolName: search_by_regex
            
status: success
          
query: beforeEach|vi\.
          
我找到了问题：
1. `handleTemplateChange` 只更新了 selectedTemplate 状态，没有联动更新 draft 内容
2. `utils.test.js` 导入了 `beforeEach` 但没有使用

让我修复这两个问题：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\weekly-report\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在修复测试文件的未使用导入：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\weekly-report\utils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在运行测试和构建验证修复：











        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/weekly-report/ ; pnpm build undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
两个问题都已修复完成！

## 修复内容

### 1. 模板切换联动填充编辑区

在 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/weekly-report/index.jsx#L110-L113) 的 `handleTemplateChange` 函数中，除了更新 `selectedTemplate` 状态，同时调用 `setDraft(getTemplateContent(templateId))` 来同步填充三栏内容：

```jsx
const handleTemplateChange = (templateId) => {
  setSelectedTemplate(templateId)
  setDraft(getTemplateContent(templateId))
}
```

### 2. 移除测试文件未使用的导入

从 [utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/weekly-report/utils.test.js#L1) 中移除了未使用的 `beforeEach`，只保留实际使用的 `vi`：

```js
// 修改前
import { describe, it, expect, beforeEach, vi } from 'vitest'

// 修改后
import { describe, it, expect, vi } from 'vitest'
```

### 验证结果

- ✅ **63 个单元测试全部通过
- ✅ **项目构建成功**