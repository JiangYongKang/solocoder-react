我来逐一修复这两个问题。首先读取相关代码确认当前状态：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: generateNextDataPoint|maxDrift
          

        
            
toolName: search_by_regex
            
status: success
          
query: export function confirmAlertRecords|export function resolveAlertRecords
          
好的，确认了问题位置。现在逐一修复：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
changes: undefined
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
现在修复第二个问题，移除两个函数内部的 saveAlertRecords 调用：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\device-monitor\deviceUtils.js
          
changes: undefined
          
两个代码问题都已修复。现在运行测试验证所有测试通过：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test --reporter=verbose src/pages/__tests__/device-monitor/ undefined
          
所有 133 个测试全部通过！让我更新任务状态：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复完成，133 个测试全部通过。以下是修改摘要：

## 修复内容

### 1. 清理 `generateNextDataPoint` 中未使用的 `maxDrift` 变量
在 [deviceUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/device-monitor/deviceUtils.js#L280-L287) 中删除了声明但未使用的 `const maxDrift = rangeSpan * 0.4`，消除了废弃变量。

### 2. 移除 `confirmAlertRecords` 和 `resolveAlertRecords` 内部的持久化调用
在 [deviceUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/device-monitor/deviceUtils.js#L615-L644) 中移除了两个函数内部的 `saveAlertRecords(updated)` 调用，使其恢复为纯函数。持久化仍由 [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/device-monitor/index.jsx#L68-L70) 中的 `useEffect` 在 `alertRecords` 状态变更时统一完成，避免了重复写入和副作用。

### 3. 测试验证
运行 `pnpm run test`，2 个测试文件共 **133 个测试全部通过** ✅