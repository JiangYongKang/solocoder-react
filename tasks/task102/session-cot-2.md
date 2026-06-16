我来修复这三个问题。让我先读取相关文件，然后逐一修复。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\resumeTemplatesCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\TemplateSelector.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\ModuleEditor.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\index.jsx
          
现在让我逐一修复这三个问题。

**问题 1：修复 setRating 评分 0 处理逻辑**


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\resumeTemplatesCore.js
          
现在开始修复。首先修复 **问题 1：setRating 评分 0 处理逻辑**：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\resumeTemplatesCore.js
          
changes: undefined
          
现在需要更新测试文件以匹配新的行为。让我先读取测试文件的相关部分：




        
            
toolName: search_by_regex
            
status: success
          
query: describe\('setRating'
          
我需要更新测试文件以匹配新的 setRating 行为。让我读取完整的相关测试部分：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\resume-templates\resumeTemplatesCore.test.js
          
现在更新测试用例，匹配新的 setRating 行为：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\resume-templates\resumeTemplatesCore.test.js
          
changes: undefined
          
现在修复 **问题 2：ModuleEditor 使用 reorderModules 函数**：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\ModuleEditor.jsx
          
现在修改 ModuleEditor.jsx，使用 reorderModules 替换 arrayMove：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\ModuleEditor.jsx
          
changes: undefined
          
现在修改 handleDragEnd 函数：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\ModuleEditor.jsx
          
changes: undefined
          
现在修复 **问题 3：index.jsx 定时器清理问题**：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修改 index.jsx，添加定时器清理逻辑：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\resume-templates\index.jsx
          
changes: undefined
          
三个问题都已修复。现在重新运行测试验证：



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- --reporter=verbose src/pages/__tests__/resume-templates/ undefined
          
所有 101 个测试全部通过！让我更新任务状态：




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已成功修复！以下是修复详情：

## 🔧 修复内容

### 问题 1：setRating 评分 0 处理逻辑对齐
**文件**: [resumeTemplatesCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/resume-templates/resumeTemplatesCore.js#L250-L262)

修改 `setRating` 函数，当评分 ≤ 0 时删除该评分（从对象中移除 key），而不是钳位到 1。这样：
- StarRating 组件点击已选星星传递 0 → 正确删除评分
- localStorage 中不再保存评分为 1 的无效数据
- 视觉显示与实际存储状态一致

**测试更新**: [resumeTemplatesCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/resume-templates/resumeTemplatesCore.test.js#L443-L486)

新增 6 个测试用例覆盖评分删除场景，测试总数从 96 增加到 **101 个**。

---

### 问题 2：ModuleEditor 拖拽排序使用 reorderModules
**文件**: [ModuleEditor.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/resume-templates/ModuleEditor.jsx#L1-L17, L96-L103)

- 移除 `@dnd-kit/sortable` 的 `arrayMove` 导入
- 新增从 `resumeTemplatesCore.js` 导入 `reorderModules`
- `handleDragEnd` 函数现在使用 `reorderModules(modules, oldIndex, newIndex)` 完成排序

这样确保生产路径使用经过完整测试的 `reorderModules` 纯函数，保持代码一致性。

---

### 问题 3：index.jsx 定时器清理
**文件**: [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/resume-templates/index.jsx#L1-L71)

- 导入 `useRef` Hook
- 使用 `transitionTimerRef` 和 `innerTimerRef` 保存定时器 ID
- 切换模板前先清除已有定时器，防止快速切换时的竞态条件
- 添加 `useEffect` cleanup 函数，在组件卸载时清理所有定时器

避免了快速切换页面时可能出现的 React 状态更新警告：
> Warning: Can't perform a React state update on an unmounted component.

---

## ✅ 验证结果

运行 `pnpm test src/pages/__tests__/resume-templates/`：

```
Test Files  2 passed (2)
      Tests  101 passed (101)
   Duration  344ms
```

**所有 101 个测试全部通过！**