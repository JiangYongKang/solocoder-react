让我来逐一修复这些问题。首先创建任务列表：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
好的，让我开始逐一修复这些问题。首先读取相关文件的当前内容。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先读取相关的代码片段：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\networkInterceptorUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\networkInterceptorUtils.js
          
让我先找到 Mock 编辑器和日志区域的代码：










        
            
toolName: search_by_regex
            
status: success
          
query: Mock 数据编辑器
          

        
            
toolName: search_by_regex
            
status: success
          
query: logContainerRef|请求日志时间线
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
现在我开始修复问题。首先，我将用一个更完善的 JSON 编辑器组件来统一替换原来的 Mock 数据编辑器，支持左右分栏两侧都可编辑，并且显示行号和错误行高亮。然后修复其他问题。




        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
好的，我会同时修复几个问题。首先，先更新工具函数：增强 `getJsonErrorLine` 并修复 `sortRulesByPriority`，然后创建带错误行高亮的 JSON 编辑器。






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\networkInterceptorUtils.js
          
好的，现在开始逐一修复。先增强工具函数：

**1. 增强 `getJsonErrorLine` 和修复 `sortRulesByPriority`**：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\networkInterceptorUtils.js
          
changes: undefined
          
现在增强 `getJsonErrorLine` 函数，让它能处理 V8 的 position 错误格式：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\networkInterceptorUtils.js
          
changes: undefined
          
现在更新 CSS，添加 JSON 编辑器带行号和错误高亮的样式：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在添加 CSS 样式（带行号、错误行高亮的 JSON 编辑器）：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          
好的，现在添加样式，创建带行号和错误行高亮的 JSON 编辑器样式，并修复日志自动滚动：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\network-interceptor.css
          
changes: undefined
          
现在在主页面中添加 JSON 编辑器组件并更新 Mock 编辑器、添加日志自动滚动。先更新导入和添加编辑器组件：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
现在更新导入，添加 getJsonErrorLine：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          
现在创建 JSON 编辑器组件，带行号和错误行高亮，插入到 Toast 组件之前：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          
现在替换 Mock 数据编辑器的左右两栏，都使用带行号的编辑器，并显示具体错误行号：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在添加日志自动滚动功能。当日志变化时，自动滚动到最顶部（因为最新的在上面，或者滚动到最新的那一条）。让我找到合适的位置加 useEffect：












        
            
toolName: search_by_regex
            
status: success
          
query: const filteredLogs = useMemo
          
在 filteredLogs 之后加一个 useEffect 来自动滚动：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在运行测试，确保全部通过：










        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm test -- src/pages/__tests__/network-interceptor/ undefined
          
太好了！所有 97 个测试通过。现在让我运行 lint 检查，确保没有新的问题：












        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm eslint src/pages/network-interceptor/ src/pages/__tests__/network-interceptor/ undefined
          
修复未使用的参数：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-interceptor\index.jsx
          
changes: undefined
          
现在再次运行 lint 和测试：













        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; pnpm eslint src/pages/network-interceptor/ src/pages/__tests__/network-interceptor/ ; pnpm test -- src/pages/__tests__/network-interceptor/ undefined
          
太好了！lint 检查通过，所有 97 个测试都通过了。现在让我完成任务状态：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题修复完成！以下是修复的内容总结：

---

## 🔧 修复总结

### 问题 1：Mock 编辑器左侧改为可编辑
**修改文件**: [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/index.jsx#L1224-L1271)

- 新建 `JsonEditorWithLineNumbers` 组件，用于统一处理带行号的 JSON 编辑
- 左侧「原始响应数据」从只读的 `<pre>` 标签改为可编辑的 textarea，与右侧交互一致
- 用户现在可以直接修改左侧原始响应，模拟不同服务器返回场景

---

### 问题 2：JSON 错误行号定位和高亮
**修改文件**: 
- [networkInterceptorUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/networkInterceptorUtils.js#L201-L222) — 增强 `getJsonErrorLine`
- [network-interceptor.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/network-interceptor.css#L403-L499) — 添加错误高亮样式
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/index.jsx#L42-L93) — JsonEditorWithLineNumbers 组件

**增强 getJsonErrorLine**：
- 同时支持 `line N`（Firefox）和 `position N`（V8/Chrome）两种错误消息格式
- 对 position 格式：从 position 反推行号

**可视化错误展示**（3 重提示）：
1. 🔴 **标签提示**：在工具栏右侧显示 `JSON 错误（第 N 行）`
2. 🔴 **行号栏高亮**：第 N 行的行号背景改为红色半透明 + 加粗
3. 🔴 **编辑区红色背景条**：错误行对应的 textarea 区域有红色背景条 + 左侧红色竖条

---

### 问题 3：日志自动滚动到最新条目
**修改文件**: [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/index.jsx#L696-L700)

添加 useEffect 监听 `logs.length` 和 `filteredLogs.length`：
```jsx
useEffect(() => {
  if (logContainerRef.current) {
    logContainerRef.current.scrollTop = 0
  }
}, [logs.length, filteredLogs.length])
```

因为列表按时间倒序排列（最新在最上面），所以滚动到 `scrollTop = 0` 即最新条目。

---

### 问题 4：修复 sortRulesByPriority 语义
**修改文件**: [networkInterceptorUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-interceptor/networkInterceptorUtils.js#L137-L148)

原函数只是浅拷贝，没有排序逻辑。现在实现真正的优先级排序：
1. **启用的规则优先**：`enabled: true` 排在 `enabled: false` 之前
2. **按 priority 字段排序**：如果规则有 `priority` 数字字段，按从小到大排序
3. **保持稳定排序**：同组内保持原有相对顺序（数组 index 越小越靠前）

```javascript
return [...rules].sort((a, b) => {
  if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
  if (typeof a.priority === 'number' && typeof b.priority === 'number') {
    return a.priority - b.priority
  }
  return 0
})
```

---

### 问题 5：验证通过 ✅
- **单元测试**: 97 passed (97) ✅
- **Lint 检查**: 0 errors ✅