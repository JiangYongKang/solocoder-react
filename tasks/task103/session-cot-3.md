好的，我来修复这两个问题。先创建任务清单：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先读取相关文件：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          
现在补充 buildBezierPath 测试的 c2 控制点断言：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
现在修复 importFromJson 中的 curveStyle 校验逻辑，同时也修复 style 字段的同样问题：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          
changes: undefined
          
现在添加空字符串的测试用例：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
现在运行测试和 lint：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test -- src/pages/__tests__/network-topology/ 2>&1 undefined
          
99 个测试全部通过！现在运行 lint 检查：















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm eslint src/pages/network-topology/constants.js src/pages/network-topology/networkTopologyCore.js src/pages/network-topology/DeviceShape.jsx src/pages/network-topology/DevicePanel.jsx src/pages/network-topology/TopologyCanvas.jsx src/pages/network-topology/PropertyPanel.jsx src/pages/network-topology/index.jsx src/pages/__tests__/network-topology/networkTopologyCore.test.js 2>&1 undefined
          
修复 lint 错误 - 移除未使用的 `endStr` 变量：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
再次运行 lint 和测试验证：


















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm eslint src/pages/network-topology/constants.js src/pages/network-topology/networkTopologyCore.js src/pages/network-topology/DeviceShape.jsx src/pages/network-topology/DevicePanel.jsx src/pages/network-topology/TopologyCanvas.jsx src/pages/network-topology/PropertyPanel.jsx src/pages/network-topology/index.jsx src/pages/__tests__/network-topology/networkTopologyCore.test.js 2>&1 undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test -- src/pages/__tests__/network-topology/ 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
两个残留问题已全部修复完成！

## 修复内容

### 1. 补充 buildBezierPath 测试的 c2 控制点断言
**修改文件**：[networkTopologyCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/network-topology/networkTopologyCore.test.js#L506-L547)

- 水平端口测试：新增 `c2` 控制点断言，验证 `x < 300` 且 `y === 50`（向左水平延伸）
- 垂直端口测试：新增 `c2` 控制点断言，验证 `x === 150` 且 `y < 300`（向上垂直延伸）
- 新增测试用例 `buildBezierPath with opposite diagonal ports`：验证斜向连接时，c1 控制点水平向右（x>0, y=0），c2 控制点水平向左（x<300, y=300）

### 2. 修复 importFromJson 校验逻辑
**修改文件**：[networkTopologyCore.js](file:///c:/Users/vince\GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-topology/networkTopologyCore.js#L575-L580)

- 将 `link.style &&` 改为 `typeof link.style === 'string' &&`
- 将 `link.curveStyle &&` 改为 `typeof link.curveStyle === 'string' &&`
- 空字符串 `""` 会被正确识别为 string 类型，进入 includes 校验，从而被正确拒绝
- 同时修复了 style 字段同样的潜在问题

### 3. 新增测试用例
- `should reject link with empty string style`：验证 style 为空字符串时被拒绝
- `should reject link with empty string curveStyle`：验证 curveStyle 为空字符串时被拒绝

## 测试结果
```
Test Files  1 passed (1)
Tests       99 passed (99)  ✅
Lint        0 errors  ✅
```