好的，我来逐一修复这 6 个问题。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先重新阅读一下需要修改的文件，确保拿到最新内容：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\org-chart\index.jsx
          
好的，现在让我逐一修复所有问题。我先修复 index.jsx 中的多个问题（同级拖拽排序、导出PNG可见区域、handleChangeNodeType死代码、删除确认文案区分节点类型），然后修复测试文件。

首先，更新 index.jsx 中的 imports，加入 `reorderSiblings`：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\org-chart\index.jsx
          
changes: undefined
          
现在修复问题 3（handleChangeNodeType 死代码）：让 PropertyPanel 的 handleTypeChange 调用 onTypeChange，然后在父组件传递 handleChangeNodeType。先修改 PropertyPanel：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\org-chart\index.jsx
          
changes: undefined
          
现在修复 PropertyPanel 的调用处，传入 onTypeChange：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\org-chart\index.jsx
          
changes: undefined
          
现在修复问题 5（删除确认对话框文案区分节点类型）：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\org-chart\index.jsx
          
changes: undefined
          
现在修复问题 1（同级节点拖拽重新排序）和问题 2（导出 PNG 可见区域）：

先修复 handleNodeDrop，让同级节点拖拽时调用 reorderSiblings：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\org-chart\index.jsx
          
changes: undefined
          
现在修复问题 2（导出 PNG 只导出当前可见区域）。我需要根据当前的 pan 和 zoom 来计算可见区域并只导出该部分：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\org-chart\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在修复测试文件。首先，我需要先看一下 orgChartCore.js 的 updateNode 函数，确认它是否真的保护了 id，然后修复测试。另外，还需要检查 updateNode 是否保护 id 字段——看一下：

让我检查 orgChartCore.js 的 updateNode 函数：





        
            
toolName: search_by_regex
            
status: success
          
query: export function updateNode
          
很好，updateNode 确实通过 allowedKeys 保护了 id（还有 children 等字段不在 allowedKeys 中）。现在修复测试——测试中已经有一个关于 children 的断言，但 children 也不在 allowedKeys 里，所以之前的测试用 children 做验证其实是错的（因为 `node.children` 不是 `allowedKeys`，所以 `node.children = []` 这个赋值根本没发生，但断言 `expect(node.children).toHaveLength(0)` 还是会通过，因为 person1 原本就没有 children）。

让我先看一下测试内容：






        
            
toolName: search_by_regex
            
status: success
          
query: 不应该修改不允许的字段
          
好的，现在我来修复这个测试，让它用更有意义的节点（比如 pos1，它有 children），同时增加对 id 的保护验证：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\org-chart\orgChartCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在运行所有测试：








        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
可以看到失败的 29 个失败的测试中：
- collaborative-doc (26 个)
- funnel-analysis (1)
- modal-generator (1)
- sticky-notes (1)

这些都是别的模块的问题，不是我改动的 org-chart 不在失败。让我单独运行 org-chart 的测试：</think_never_used_51bce0c785ca2f68081bfa7d91973934>这些失败是其他模块的测试问题，不是我们修改的。让我单独运行 org-chart 相关的测试：








        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/org-chart/ undefined
          
org-chart 的 77 个测试全部通过！其他失败的测试是别的模块的问题，与我们的修改无关。让我再运行 lint 和 build 确认代码没有问题：








        
            
toolName: run_command
            
status: success
          
command: npm run lint ; npm run build undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有 6 个问题已全部修复！以下是详细修改内容：

## ✅ 修复总结

### 1. 同级节点拖拽重新排序功能
在 [index.jsx#L540-L573](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/org-chart/index.jsx#L540-L573) 中修改了 `handleNodeDrop`：
- 引入 `reorderSiblings` 核心函数
- 增加判断 `isSameParent` 和 `isRootLevel`，当源节点和目标节点拥有相同父节点时，调用 `reorderSiblings` 将源节点插入到目标节点位置
- 非同父节点时仍保持原有 `moveNode(..., 'child')` 行为（改变父子关系）

### 2. 导出 PNG 只导出当前可见区域
在 [index.jsx#L458-L511](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/org-chart/index.jsx#L458-L511) 中完全重写了 `handleExportPng`：
- 基于当前 `pan.x/pan.y/zoom` 和容器尺寸计算 SVG 的 `viewBox`（`viewBoxX = -pan.x/zoom` 等）
- 克隆 SVG 时保留 `.org-canvas-g` 的 transform，直接应用 viewBox 裁剪
- 导出的图片宽高等于容器宽高，确保只导出用户当前看到的区域

### 3. handleChangeNodeType 死代码修复
- [index.jsx#L154-L163](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/org-chart/index.jsx#L154-L163) — `PropertyPanel` 组件新增 `onTypeChange` prop，`handleTypeChange` 改为调用 `onTypeChange`
- [index.jsx#L851-L860](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/org-chart/index.jsx#L851-L860) — 父组件传入 `onTypeChange={handleChangeNodeType}`，消除死代码

### 4. 测试中 node.id 保护验证
在 [orgChartCore.test.js#L403-L411](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/org-chart/orgChartCore.test.js#L403-L411) 中：
- 改用有 children 的 `pos1` 节点做测试（原 person1 本身 children=[] 无法验证保护）
- 新增 `expect(node.id).toBe('pos1')` 验证 id 不被篡改
- 新增 `expect(node.children).toHaveLength(2)` 验证 children 不被清空
- 新增 `expect(hackedNode).toBeNull()` 验证找不到篡改后的 id

### 5. 删除确认对话框文案区分节点类型
在 [index.jsx#L372-L396](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/org-chart/index.jsx#L372-L396) 中：
- 使用 `NODE_TYPE_LABELS[node.type]` 动态获取类型名称（部门/职位/人员）
- 文案变为：`"该{部门/职位/人员}下包含 X 个子节点，确认删除？"`

### 6. 测试验证
```
✓ org-chart 测试：77 / 77 全部通过
✓ 构建成功（build exit code 0）
```

（注：`pnpm run test` 中失败的 29 个测试来自 collaborative-doc、funnel-analysis、modal-generator、sticky-notes 等其他模块，与本次修复无关）