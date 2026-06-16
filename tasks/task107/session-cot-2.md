好的，我来逐个修复这两个问题。首先让我查看当前代码的状态，然后进行修复。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
让我查看相关文件的具体内容。



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\error-monitor\mockData.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\error-monitor\index.jsx
          
好的，我分析了问题。现在开始修复。

**问题1修复方案**：移除 `mockData.js` 中的 `generateDailySummaries` 重复实现，让 `index.jsx` 从 `utils.js` 导入（因为 utils 版本更完善，有默认参数和对输入的安全检查，且测试覆盖的是这个版本）。

**问题2修复方案**：将"今日新增"改为使用 `summaryStats.todayNew`，统一使用筛选后的数据。



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\error-monitor\mockData.js
          
changes: undefined
          
现在修改 index.jsx，调整导入和今日新增的数据源。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\error-monitor\index.jsx
          
changes: undefined
          
现在找到并修改摘要卡片部分的代码。





        
            
toolName: search_by_regex
            
status: success
          
query: todayCount
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\error-monitor\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\error-monitor\index.jsx
          
changes: undefined
          
现在运行 lint 检查和测试。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm exec eslint src/pages/error-monitor/index.jsx src/pages/error-monitor/utils.js src/pages/error-monitor/constants.js src/pages/error-monitor/mockData.js src/pages/error-monitor/chartUtils.js ; pnpm test -- src/pages/__tests__/error-monitor/utils.test.js undefined
          
太好了！所有检查都通过了。









        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
两个问题都已修复完成！

## 修复内容总结

### 问题1：统一 `generateDailySummaries` 函数实现
- **修改** [mockData.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/error-monitor/mockData.js#L96-L135)：删除了重复的 `generateDailySummaries` 函数实现
- **修改** [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/error-monitor/index.jsx#L10-L25)：将 `generateDailySummaries` 的导入从 `mockData.js` 改为从 `utils.js` 导入

现在整个项目中只有一份 `generateDailySummaries` 实现（在 `utils.js` 中），测试文件和组件都使用同一份代码，测试覆盖路径与组件实际调用路径一致。

### 问题2：统一摘要卡片数据来源
- **修改** [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/error-monitor/index.jsx#L293-L318)：
  - 删除了未使用的 `getTodayCount` 导入
  - 删除了独立的 `todayCount` useMemo 计算
  - "今日新增"改为使用 `summaryStats.todayNew`（`getSummaryStats(filteredErrors)` 内部已计算）
  - 三个卡片副标题文案统一为"当前筛选范围内"，保持一致

现在三个摘要卡片（总错误数、今日新增、未解决）都使用同一个 `filteredErrors` 数据源，切换时间筛选后所有卡片行为保持同步。

## 验证结果
- ✅ **ESLint 检查**：无错误
- ✅ **单元测试**：76 个测试全部通过