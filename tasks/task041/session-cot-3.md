让我先分析问题并创建修复计划：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先读取当前代码以确保准确修改：








































        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
现在我理解了两个问题，开始修复。首先在 skuCore.js 中添加清理图片历史的纯函数：





































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
现在修复 `getImagesForSelectionWithFallback` - 它不应该显示已删除组的图片（防御性修复），然后修复组件逻辑：











































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
现在更新组件逻辑，修复两个问题：













































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在更新 `handleGroupsChange`（清理删除组/值的图片缓存）和 `handleSelectionChange`（清空选择时清空图片）：















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在更新 `handleSelectionChange` - 当 `newSelection` 为空时同时清空 imageHistory：

















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在读取测试文件，为新修复添加单元测试：



















































        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
现在添加新的单元测试：





















































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          
现在在测试文件末尾添加新的测试用例：























































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          
我发现测试代码有语法错误，缺少 `.toEqual([])` 部分，让我修复：


























































        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在运行测试、lint 和启动 dev server：




























































        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/sku-selector/skuCore.test.js 2>&1 undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/sku-selector/index.jsx src/pages/sku-selector/skuCore.js 2>&1 undefined
          
所有 84 个测试通过，ESLint 0 错误！现在启动 dev server 验证页面：





























































        
            
toolName: run_command
            
status: running
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm run dev undefined
          
Dev server 启动成功，运行在 http://localhost:5174/。让我打开预览：





























































        
            
toolName: open_preview
            
status: success
          
预览
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复完成！

## ✅ 验证结果

- **单元测试**：84 个测试全部通过（新增 8 个测试覆盖本轮修复）
- **ESLint**：sku-selector 相关文件 0 错误 0 警告
- **Dev Server**：正常启动，页面可访问

---

## 🔧 修复详情

### 问题 1：删除规格组时 imageHistory 中关联图片未同步清理

**修复方案**（双层保障）：

**a) 状态层主动清理** — 在 [handleGroupsChange](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx#L441-L445) 中，每次 groups 变化时调用 `cleanImageHistory(newGroups, prev)` 同步清理 imageHistory，移除所有已删除组/值对应的图片记录。

**b) 渲染层防御性过滤** — 在 [getImagesForSelectionWithFallback](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js#L321-L354) 中，移除了原来会把不在当前 groups 中的历史图片也加进来的逻辑，确保预览区只显示当前存在的规格组的图片。

**c) 新增纯函数** — 在 [cleanImageHistory](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js#L356-L387) 中实现：基于当前 groups 的 groupId + valueId 白名单过滤，支持删除规格组、删除规格值、混合无效条目等多种边界情况。

---

### 问题 2：点击"清空选择"按钮后图片缓存未清空

**修复**：在 [handleSelectionChange](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx#L451-L484) 开头增加判断——当 `newSelection` 为空对象（`Object.keys(newSelection).length === 0`）时，直接调用 `setImageHistory([])` 清空图片缓存，并提前 return，使预览区回到"暂无商品图片"的占位状态。

---

## 📝 新增单元测试（共 8 个）

| 测试组 | 测试用例 |
|--------|---------|
| `cleanImageHistory` | 空 groups → 返回空数组 |
| `cleanImageHistory` | 空 imageHistory → 返回空数组 |
| `cleanImageHistory` | 保留存在且有效的图片记录 |
| `cleanImageHistory` | 删除已不存在的规格组图片 |
| `cleanImageHistory` | 删除规格组内已删除值的图片 |
| `cleanImageHistory` | 处理 null/undefined/残缺对象等混合情况 |
| `cleanImageHistory` | 非数组输入返回空数组 |
| `getImagesForSelectionWithFallback` | 不返回已删除组的历史图片 |

---

## 📁 修改的文件

- [skuCore.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js) — 新增 `cleanImageHistory` 纯函数，修复 `getImagesForSelectionWithFallback` 的防御性逻辑
- [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx) — `handleGroupsChange` 增加图片缓存清理，`handleSelectionChange` 清空选择时同步清空图片
- [skuCore.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js) — 新增 8 个单元测试