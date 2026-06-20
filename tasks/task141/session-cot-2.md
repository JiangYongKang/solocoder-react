先读取相关文件定位问题：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\GridCanvas.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\ConfigPanel.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\gridGeneratorCore.js
          
问题已定位。现在逐一修复：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
修复问题 1：GridCanvas 行线编号显示





        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\GridCanvas.jsx
          
          
需要重写行线编号部分。让我直接替换：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\GridCanvas.jsx
          
changes: undefined
          
现在把行序号改为网格线编号（1 到 rows+1）。需要重新设计行线的布局方式：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\GridCanvas.jsx
          
changes: undefined
          
这个 gridTemplateRows 构造方式太复杂，参考列线的实现方式重新写：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\GridCanvas.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
修复问题 2：调整 CSS 输出顺序，先输出 grid-area，再输出 span（后者覆盖前者的位置设置）：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\gridGeneratorCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
修复问题 3：统一设置输入框的 step 根据尺寸模式动态设置：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\grid-generator\ConfigPanel.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
读取现有测试文件末尾，添加新测试：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grid-generator\gridGeneratorCore.test.js
          
在现有测试文件末尾添加补充测试：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\grid-generator\gridGeneratorCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/grid-generator/ undefined
          
所有 104 个测试通过！






        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
## ✅ 三个问题已全部修复，测试全部通过

### 🔧 修复内容

| 问题 | 修复文件 | 说明 |
|------|----------|------|
| **1. 行线编号错误** | [GridCanvas.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grid-generator/GridCanvas.jsx#L201-L220) | 删除空内容的 rowLines 映射块，改用 `getGridLineNumbers(rows)` 返回 `[1..rows+1]`，布局方式与列线一致（`gridTemplateRows: 0 + 行高配置`） |
| **2. grid-area 覆盖 span** | [gridGeneratorCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grid-generator/gridGeneratorCore.js#L376-L402) | 调整 `generateChildrenCSS` 输出顺序：**先输出 grid-area，再输出 grid-column/grid-row**，后者覆盖前者的位置设置，保留 span 效果 |
| **3. 无效 step 参数** | [ConfigPanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/grid-generator/ConfigPanel.jsx#L55) | 统一设置输入框的 `step` 改为根据 `sizes[0].mode` 动态设置：FR 模式 `0.1`，其他模式 `1` |

### 🧪 补充单元测试（13 个新增）

在 [gridGeneratorCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/grid-generator/gridGeneratorCore.test.js) 中新增：

**Grid line helpers（4 个）：**
- `getGridLineNumbers` 边界：12 行返回 13 个编号（1-13）、1 行返回 2 个编号
- `getCellGridLines` 单格 span=1 场景

**generateChildrenCSS span+area 交互（6 个）：**
- grid-area 输出顺序在 grid-column 之前 ✓
- span 与 area 并存时 span 值保留 ✓
- 仅 area 无 span 时输出基础位置 ✓
- 仅颜色无 span/area 时不输出 grid 相关属性 ✓
- areaName 首尾空白正确 trim ✓
- 多单元格混合场景正确处理 ✓

### ✅ 验证结果

```
Tests  104 passed (104)  ✓
```

所有测试通过，无任何失败。