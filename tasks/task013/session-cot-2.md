让我先检查当前文件的实际状态，然后逐一修复这些问题。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\mapUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\MapCanvas.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\index.jsx
          
好的，我确认了所有问题。现在逐一修复：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
**问题 1**：修复 App.jsx，添加 map-area 路由和任务卡片：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
**问题 2**：修复聚类算法，使用连通分量（BFS）识别链式分布：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\mapUtils.js
          
changes: undefined
          
**问题 3**：修复拖拽后首次单击被吞。改用 ref 同步跟踪拖拽状态，并加入位移阈值：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\MapCanvas.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\MapCanvas.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\MapCanvas.jsx
          
changes: undefined
          
**问题 4**：修复路线规划的不确定性，使用确定性算法：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\mapUtils.js
          
changes: undefined
          
**问题 5**：修复搜索无匹配时不随机添加标记，改为提示无结果。需要修改 index.jsx 和 SearchBar.jsx：



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
先修改 index.jsx 去掉随机添加逻辑：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\index.jsx
          
changes: undefined
          
现在修改 SearchBar 传递 hasPresets 参数，并在页面中显示无结果提示：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\SearchBar.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\SearchBar.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\SearchBar.jsx
          
changes: undefined
          
现在在 CSS 中添加无结果提示样式，并在页面中添加 toast 提示：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\map-area.css
          

        
            
toolName: search_by_regex
            
status: success
          
query: \.map-search-suggestion-cat
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\map-area.css
          
changes: undefined
          
现在在 index.jsx 中添加 toast 显示：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\index.jsx
          
changes: undefined
          
**问题 6**：检查并优化 375px 响应式布局。让我查看现有 CSS 并进行优化：




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: @media
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\map-area.css
          
让我优化 375px 移动端断点的布局，确保在小屏幕下不崩坏：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\map-area\map-area.css
          
changes: undefined
          
**问题 7**：更新和补充单元测试，覆盖修复的逻辑：




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\map-area\mapUtils.test.js
          
现在补充针对修复功能的新测试用例：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\map-area\mapUtils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\map-area\mapUtils.test.js
          
changes: undefined
          
**问题 8**：现在运行所有测试，确保全部通过：




















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test -- src/pages/__tests__/map-area/mapUtils.test.js undefined
          
两个测试需要调整。第一个测试的标记点之间通过链式关系仍然连通；第二个测试应该直接比较结果数组是否不同，而不是用坐标近似判断。让我修复这两个测试：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\map-area\mapUtils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\map-area\mapUtils.test.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test -- src/pages/__tests__/map-area/mapUtils.test.js undefined
          
所有 **54 个测试全部通过**！现在做最后的 lint 和诊断检查：













        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/map-area src/pages/__tests__/map-area undefined
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
所有 8 个问题已全部修复完成！以下是详细修复说明：

---

## 修复清单

### 1. App.jsx 路由注册 ✅
**修改文件**：[App.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/App.jsx#L21-L21)
- 新增 `import MapAreaPage from '@/pages/map-area/index.jsx'`
- TASKS 列表新增 id:18「交互式地图」卡片
- Routes 中新增 `<Route path="/map-area" element={<MapAreaPage />} />`

---

### 2. 聚类算法 - 链式分布识别 ✅
**修改文件**：[mapUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/map-area/mapUtils.js#L29-L91)

原算法以每组第一个点为基准判断距离，A→B→C 链式分布时 C 可能漏判。

**修复方案**：使用 **BFS 连通分量算法**
1. 先构建邻接表（两点距离 ≤ 阈值则连边）
2. 通过 BFS 遍历找出所有连通分量
3. 每个连通分量若点数 ≥ 3 则形成聚合

这样即使 A 与 C 距离超过阈值，只要通过 B 连通，三者就会被识别为同一簇。

---

### 3. 拖拽后首次单击被吞 ✅
**修改文件**：[MapCanvas.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/map-area/MapCanvas.jsx#L18-L98)

根本原因：`setIsDragging(false)` 是异步 state 更新，click 事件紧随其后触发时读取到的是旧值 `true`。

**修复方案**：
- 新增 `isDraggingRef`（useRef）同步跟踪拖拽状态
- 新增 `didMoveRef` 记录是否实际产生了位移（阈值 3px）
- `handleClick` 改用 `didMoveRef.current` 判断，只要鼠标按下和抬起之间位移 ≤ 3px 就视为有效点击

---

### 4. 路线规划结果不确定性 ✅
**修改文件**：[mapUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/map-area/mapUtils.js#L98-L133)

原代码使用 `Math.random()` 导致每次路径不同。

**修复方案**：使用基于起终点坐标的**确定性偏移算法**
- 计算路径方向向量的垂直方向
- 根据起终点坐标值计算一个伪随机种子（hash），用来决定偏移方向（正或负）
- 路径中间点基于垂直方向偏移，偏移量与路径长度成正比（上限 40 单位）

这样相同起终点每次生成完全相同的路径，不同起终点产生不同形状。

---

### 5. 搜索无匹配改为提示无结果 ✅
**修改文件**：
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/map-area/index.jsx#L111-L149) — 移除随机添加逻辑，改为 Toast 提示
- [SearchBar.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/map-area/SearchBar.jsx#L32-L79) — 下拉列表显示"未找到匹配的地点"
- [map-area.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/map-area/map-area.css#L149-L180) — 新增 `.map-search-no-result` 和 `.map-toast` 样式

现在无匹配时：
- 输入框下拉直接提示「未找到匹配的地点，请尝试其他关键字」
- 回车搜索后顶部显示 Toast 提示，2.5 秒后自动消失

---

### 6. 375px 移动端响应式优化 ✅
**修改文件**：[map-area.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/map-area/map-area.css#L616-L688)

新增 `@media (max-width: 480px)` 断点，针对 375px 宽度优化：
- 头部内边距、标题字号、返回按钮缩小
- 工具栏改为横向滚动（`overflow-x: auto`），按钮不换行压缩
- Toast 和 Banner 取消居中 transform，改用左右 12px 边距避免超宽
- 搜索框输入和按钮的字号、内边距减小
- 标记点卡片和路线面板左右边距从 12px 缩到 8px

---

### 7. 单元测试补充 ✅
**修改文件**：[mapUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/map-area/mapUtils.test.js)

新增 4 个测试用例：
- `should cluster markers with chain distribution` — 验证链式（A-B-C-D）分布标记点能聚合成同一簇
- `should keep separate chains as distinct clusters` — 验证两条独立链互不干扰
- `should produce deterministic output for the same inputs` — 验证相同起终点生成相同路径（连续调用 3 次结果完全一致）
- `should produce different outputs for different endpoints` — 验证不同起终点生成不同路径

---

### 8. 最终验证结果 ✅
| 检查项 | 结果 |
|--------|------|
| 单元测试 | **54/54 通过** ✅ |
| ESLint（map-area 目录） | **0 错误 0 警告** ✅ |
| TypeScript 诊断 | **0 问题** ✅ |

可以用 `pnpm run dev` 启动开发服务器，在首页点击「18: 交互式地图」卡片进行手动验证。