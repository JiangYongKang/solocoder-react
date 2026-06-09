我来逐一修复这些问题。先创建任务列表：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先读取当前核心逻辑和组件文件：



        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
现在读取组件文件：




        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
现在我来逐一修复所有问题。首先修复核心逻辑文件中的问题：





**修复 1：`getDisabledValues` 在无选择时不应禁用任何按钮**

**修复 2：新增 `getImagesForSelectionWithFallback` 纯函数，支持按组保留上一张有效图片**

**修复 3：`syncSkuList` 需要将空字符串统一转为数字 0**

**修复 4：新增 `getGroupsStructureSignature` 用于仅检测结构变化（不包含名称）**


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
现在修复 `updateSku`、批量设置函数，并添加 `getGroupsStructureSignature`、修复 `getDisabledValues`、添加图片 fallback 逻辑：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
现在修复 `getDisabledValues`，无选择时不应禁用任何按钮：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
现在添加 `getGroupsStructureSignature` 和改进图片选择逻辑（带 fallback）：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
现在更新组件文件 [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx) 来应用这些修复：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在修改组件文件，应用所有修复：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在简化 SkuListPanel 的处理器（核心函数已处理规范化）：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在修复 PreviewPanel 组件，使用带 fallback 的图片选择，并修复图片展示布局：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在修复 PreviewPanel 中的图片展示布局，不再重叠：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在修复主页面中仅修改名称时重置选择的问题：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
让我修正初始值，使用正确的初始 groups 签名：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在修复 CSS 中的图片布局，不再使用绝对定位重叠：










        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/sku-selector.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/sku-selector.css
          
现在修复图片展示的 CSS，不再重叠：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/sku-selector.css
          
changes: undefined
          
现在还需要在结构变化时清理失效的选择（被删除的规格组或值）：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在补充单元测试，覆盖修复的边界场景：














        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先读取现有测试文件，然后追加新的测试：









        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
现在更新测试文件，添加新的 import 和测试用例：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          
现在在文件末尾追加新的测试用例：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          
现在运行测试和 lint 验证所有修复：
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/sku-selector/skuCore.test.js 2>&1 undefined
          
有 2 个测试失败，让我修复它们。第一个是旧测试调用签名不匹配，第二个是 fallback 逻辑对于空 groups 数组的处理：





        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
先修复核心逻辑中的 fallback 问题，然后修复旧测试：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
现在修复旧测试中的签名问题：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          
再检查一下是否还有其他调用签名问题，并重新运行测试：












        
            
toolName: search_by_regex
            
status: success
          
query: syncSkuList\(
          
第 270 行仍有 3 个参数，需要修复：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          
现在再次运行测试和 lint：


















        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/sku-selector/skuCore.test.js 2>&1 undefined
          
全部 76 个测试通过！现在运行 lint：












        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm run lint 2>&1 | tail -60 undefined
          
有 4 个 ESLint 错误在我们的代码中，让我逐一修复：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先读取当前 index.jsx 的关键部分，确认行号和上下文：











        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
现在修复所有 4 个 ESLint 错误：

**修复 1**：移除 SkuListPanel 中未使用的 `groups` 参数

**修复 2 & 3**：将 useEffect 中的 setState 重构为同步计算 + ref 模式

**修复 4**：修复 useCallback 依赖问题





        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
我需要进行较大的重构来解决所有 ESLint 问题。让我重写主组件：












        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
现在让我重写整个 index.jsx 来修复所有 ESLint 问题：














        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
我发现了几个问题：空的 `imageHistoryRef_reset()` 函数、在 useMemo 中执行副作用、用 setState 清理 selection。让我用更好的方式重构：
















        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在移除未使用的 import `getGroupsStructureSignature`，然后运行 lint 和测试：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在运行 lint 和测试：

























        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm run lint 2>&1 | grep -E "(sku-selector|✖|problems)" | head -30 undefined
          
让我检查 sku-selector 相关文件的具体 lint 错误：

















        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/sku-selector/index.jsx src/pages/sku-selector/skuCore.js 2>&1 undefined
          
有 5 个专门针对我们代码的 ESLint 错误。让我修复它们：

1-4. 不能在渲染期间（useMemo 中）访问/修改 ref
5. useMemo 的第一个参数需要是内联函数

让我重构，将 imageHistory 移到父组件，在事件处理器中更新：


























        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在运行 ESLint 检查我们的文件并运行测试：

































        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/sku-selector/index.jsx src/pages/sku-selector/skuCore.js 2>&1 undefined
          
只剩最后一个 ESLint 错误！我只需要移除 useMemo，改用 useState 的惰性初始化函数：
























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在运行最终的 ESLint 和测试验证：
































        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/sku-selector/index.jsx src/pages/sku-selector/skuCore.js 2>&1 undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/sku-selector/skuCore.test.js 2>&1 undefined
          
全部通过！ESLint 对我们的文件 0 错误 0 警告，所有 76 个测试通过。让我再用 GetDiagnostics 确认一下：

































        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
所有诊断都没有问题。让我完成最后的任务：

































        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有问题已修复完成！以下是修复总结：

## ✅ 验证结果

- **ESLint**：sku-selector 相关文件 **0 错误 0 警告**
- **单元测试**：**76 个测试全部通过**（其中新增 21 个测试覆盖修复场景）

---

## 🔧 修复详情

### 问题 1：初始状态下所有规格值按钮被禁用

**修复**：在 [getDisabledValues](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js#L256-L296) 中增加前置检查——当 `selection` 为空（没有任何实际选中项）时，直接返回空对象 `{}`，不做任何禁用处理。

```javascript
const hasAnySelection = Object.values(selection).some((v) => v != null)
if (!hasAnySelection) return {}
```

---

### 问题 2：图片重叠显示 + 切换到无图规格时图片消失

**修复分两部分**：

**a) 布局修复**：更新 [sku-selector.css](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/sku-selector.css#L372-L405)，将原来 `position: absolute` 的重叠布局改为 flex-wrap 网格布局，每张图片下方显示规格标签。

**b) 图片保留逻辑**：新增 [getImagesForSelectionWithFallback](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js#L321-L361) 纯函数，按组维度维护历史图片——当用户切换到未上传图片的规格值时，自动 fallback 到该组上一张有效图片。在父组件 `handleSelectionChange` 事件处理器中同步更新 `imageHistory` 状态。

---

### 问题 3：stock/price 清空后变为空字符串 `''`

**修复**：在 [skuCore.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js#L138-L148) 新增内部 `normalizeStock` / `normalizePrice` 规范化函数，在 `updateSku`、`batchSetStock`、`batchSetPrice`、`syncSkuList`、`generateSkuList` 所有写入路径统一调用，确保 `''`、`null`、`undefined` 一律转为数字 `0`。

---

### 问题 4：仅修改名称时重置已选规格

**修复**：

1. 移除了原 `useEffect(() => setSelection({}), [groups])` 的整体重置逻辑
2. 新增 [validSelection](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx#L411-L420) 派生值（useMemo），每次渲染时自动过滤掉已被删除的组/值对应的选择项，保留仍有效的选择
3. 将 `groups` 和 `skus` 合并为单一 `pageData` 状态，在 `handleGroupsChange` 中原子化更新，避免了 `useEffect` 中调用 `setState`

这样仅修改名称时（ID 不变），`validSelection` 输出不变，用户选择完全保留。

---

## 📁 修改的文件

| 文件 | 变更 |
|------|------|
| [skuCore.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js) | 新增 `normalizeStock/Price`、`getImagesForSelectionWithFallback`、`getGroupsStructureSignature`；修复 `getDisabledValues`、`updateSku`、`batchSetStock/Price`、`syncSkuList` |
| [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx) | 重构状态管理，移除 useEffect 中的 setState，将图片历史上提至父组件，新增 `validSelection` 派生值 |
| [sku-selector.css](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/sku-selector.css) | 图片布局从重叠改为 flex-wrap 网格 |
| [skuCore.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js) | 新增 21 个测试用例覆盖 4 类修复边界场景 |