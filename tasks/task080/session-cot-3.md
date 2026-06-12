让我先读取当前 DataEditorPanel 的实现和它的使用方式：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
我先检查一下当前的 index.jsx：DataEditorPanel 是否使用了 key prop，以及它的完整实现。



        
            
toolName: search_by_regex
            
status: success
          
query: DataEditorPanel
          
让我读取 DataEditorPanel 的完整实现和它的调用点：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
现在看看 DataEditorPanel 的调用点，确认是否有 key：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
找到了！第600行确实有 `key` prop 导致重挂载。现在我需要：
1. 移除 key prop
2. 在 DataEditorPanel 中使用 useEffect 监听 groups 变化并同步 editData
3. 需要确保不会在用户正在编辑时因为父组件 groups 更新而被覆盖（只在 groups 引用或结构变化时同步，而不是每次值变化时）

让我读取 import 语句，确认 useEffect 是否已经导入：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
好的，`useEffect` 已经导入了。现在我需要设计一个不会覆盖用户输入的同步策略：

策略：
- 当 groups 的 **结构**（添加/删除组、组 ID 变化、steps 变化）改变时才同步到 editData，而不是每次 values 改变就同步。
- 使用 JSON.stringify(groups.map(...)) 只比较每个组的 id 数组和 steps，不对 data

但更简单的方法是：比较**只有当 editData 的键与 groups 键不匹配时（即增加/删除了组，或组id变化）才同步。如果只是组内 data 值变化，不同步（用户正在编辑的是内部 data，editData 已经被用户自己更新了）。

不过更安全的做法是：

- 跟踪 groups 的**"签名"**（组 ID 列表 + 组内步骤 ID 列表）
- 当签名变化时（意味着组或步骤被添加/删除/重排），才用 groups.data 覆盖 editData
- 当只是组内 data 的 值 变化（因为用户触发了 onGroupDataChange，这也会更新父级，因此 editData 已被用户 handleValueChange 先更新，然后 parent，是 editData，不会被我们。因此在 user

让我实现这个：










        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
          
我应该使用更小、更精确的编辑来避免匹配失败。让我分步进行。首先，在 DataEditorPanel 中添加 useEffect：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
changes: undefined
          
好的，现在我还需要修复 handleValueChange 中使用 stale `editData` 和 `errors` 的问题。因为用户正在编辑时，editData 是最新值，应该使用 functional state update：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
changes: undefined
          
但是，这个 useEffect 里引用了 `editData`，但 `editData` 不在依赖数组里，会导致警告/不正确。我需要使用 ref 来保存上一次的签名。让我重构为使用 ref 追踪结构签名：













        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
让我添加 useRef：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
changes: undefined
          
现在重构 useEffect 来使用 ref：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
changes: undefined
          
现在移除调用处的 key prop：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
现在让我找 DataEditorPanel 调用：








        
            
toolName: search_by_regex
            
status: success
          
query: DataEditorPanel
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\index.jsx
          
changes: undefined
          
现在更新待办，检查 375px CSS 布局：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在我需要检查 375px 布局。当前的 media query 只有 900px 断点，我需要添加 375px 的断点。让我看一下完整CSS的结构以了解所有元素：

先看 fa-layout、fa-page、fa-toolbar、fa-sidebar 等关键元素：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\funnel-analysis.css
          
让我看一下当前 @media 900px 的结尾（文件末尾）：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\funnel-analysis.css
          
让我看看 480px 下面是否还有更多内容：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\funnel-analysis.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\funnel-analysis.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\funnel-analysis.css
          
好的，我看到 480px 断点已经有了。我需要再添加 375px 断点。让我在文件末尾追加：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\funnel-analysis\funnel-analysis.css
          
changes: undefined
          
现在运行 lint 检查：













        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/funnel-analysis/ 2>&1 undefined
          
很好，lint 通过了。现在运行测试：













        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在先单独跑漏斗的测试，然后再跑全量：












        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/funnel-analysis/funnelAnalysisUtils.test.js 2>&1 undefined
          
太好了，174 个测试全部通过。现在运行全量测试：














        
            
toolName: run_command
            
status: success
          
command: pnpm run test 2>&1 undefined
          
全部 6657 个测试通过，0 个失败！现在更新待办：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有任务完成。以下是修复内容的详细总结：

## 修复内容总结

### 问题1：DataEditorPanel 输入失焦问题 ✅
**文件**：[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/funnel-analysis/index.jsx)

**问题原因**：父组件传递 `key={groups.map(g => g.id + JSON.stringify(g.data)).join('|')}`，导致每次用户输入一个字符后，父组件 groups.data 更新 → key 变化 → DataEditorPanel 完全卸载重建 → 输入框失焦。

**修复方案**：
1. **移除调用处的 key prop**（第620行）
2. **DataEditorPanel 内部使用 `useRef + useEffect`** 追踪结构签名（组ID列表 + 步骤ID列表），只有在**结构真正变化**（添加/删除组、添加/删除步骤、重排）时才用 `groups.data` 覆盖 `editData`；如果只是值变化（用户正在输入），则跳过同步，保留用户正在编辑的中间状态。
3. **`handleValueChange` 使用 functional state update**，避免闭包捕获到陈旧的 `editData` 和 `errors`。

```
// 结构签名追踪
lastSyncRef.current = { groupIds, stepIds }
```

### 问题2：375px 移动端布局 ✅
**文件**：[funnel-analysis.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/funnel-analysis/funnel-analysis.css#L841-L1027)

新增 `@media (max-width: 375px)` 断点，对所有关键模块做紧凑化处理：
- 页面 padding 从 `16px 12px 40px` → `12px 10px 30px`
- 标题字号 `22px` → `20px`
- 日期输入框自适应宽度（`flex: 1; min-width: 0`）防止溢出
- 漏斗条形图高度从 `38px` → `34px`，最小宽度 `60px` → `50px`
- 组头纵向排列（`flex-direction: column`），操作按钮占满整行
- 数据表格输入框宽度 `64px` → `54px`，字号 `12px` → `11px`
- 所有间距（gap、padding、margin）均匀缩小，避免 375px 宽度下出现横向滚动

### 问题3：全量测试通过 ✅
- 漏斗分析专项：**174 tests passed**
- 全量项目：**6657 tests passed / 90 test files**（0 failed）
- ESLint：0 errors

**关键代码参考**：
- [DataEditorPanel 同步逻辑](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/funnel-analysis/index.jsx#L302-L349)
- [375px 响应式断点](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/funnel-analysis/funnel-analysis.css#L841-L1027)
- [补充的单元测试](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/funnel-analysis/funnelAnalysisUtils.test.js)