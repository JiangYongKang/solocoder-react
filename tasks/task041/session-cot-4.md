让我先创建任务计划并执行清理工作：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
先读取 skuCore.js 中 `getGroupsStructureSignature` 的位置：







        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: export function getGroupsStructureSignature
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
现在从 skuCore.js 中删除该函数：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在从测试文件中移除导入和测试用例：












        
            
toolName: search_by_regex
            
status: success
          
query: getGroupsStructureSignature|describe\('getGroupsStructureSignature'
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
先移除测试文件中的导入：














        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          
现在移除整个 describe 测试块：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在运行测试和 lint 验证：















        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/sku-selector/skuCore.test.js 2>&1 undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/sku-selector/index.jsx src/pages/sku-selector/skuCore.js 2>&1 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有清理工作完成！

## ✅ 验证结果

- **单元测试**：79 个测试全部通过（从 84 个减少 5 个被删除的废弃测试）
- **ESLint**：sku-selector 相关文件 **0 错误 0 警告**

---

## 🧹 清理内容

### 1. [skuCore.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js)
- 删除了未使用的 `getGroupsStructureSignature` 函数定义和导出（原第 382-394 行，共 13 行）

### 2. [skuCore.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js)
- 从导入列表中移除了 `getGroupsStructureSignature`
- 删除了整个 `describe('getGroupsStructureSignature', ...)` 测试块（5 个测试用例，共 57 行）