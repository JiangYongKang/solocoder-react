我来逐一修复这三个问题。先读取相关文件的最新内容。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\DanmakuArea.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\LiveWidgets.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\index.jsx
          
先修复问题 1：弹幕组件的定时器清理。同时也清理 LiveWidgets 中类似的问题。




        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\DanmakuArea.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复问题 2：购物袋组件商品切换时状态丢失。改用按商品保存的选择状态，组件不再被强制重建。







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\ShoppingBag.jsx
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\ShoppingBag.jsx
          
changes: undefined
          
现在移除 index.jsx 中 ShoppingBag 的强制重建 key：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
现在修复问题 3：点赞爱心飘心位置偏移。同时顺便清理 LiveWidgets 中的定时器内存泄漏和 setState 警告。








        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\LiveWidgets.jsx
          
changes: undefined
          
发现 OnlineCounter 里还有个逻辑 bug：先赋值了 prevValue=next 再比较导致一直是 false。修复它：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\LiveWidgets.jsx
          
changes: undefined
          
现在运行 lint 和测试验证修复：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/live-stream/ src/pages/__tests__/live-stream/ ; echo "---TEST---" ; npx vitest run src/pages/__tests__/live-stream/utils.test.js undefined
          
修复最后一个 React hooks 依赖警告：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\LiveWidgets.jsx
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/live-stream/ src/pages/__tests__/live-stream/ ; echo "---TEST---" ; npx vitest run src/pages/__tests__/live-stream/utils.test.js ; echo "---BUILD---" ; npx vite build 2>&1 | Select-Object -Last 15 undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## ✅ 三个问题全部修复并通过验证

**验证结果**：ESLint 0 errors / 0 warnings · 63 单元测试通过 · Vite 构建成功 ✓

---

### 问题 1：弹幕组件定时器内存泄漏

**修复文件**：[DanmakuArea.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/live-stream/DanmakuArea.jsx)

**问题**：初始弹幕加载的 6 个 `setTimeout`、`addDanmaku` 内部清理滚动弹幕的定时器、以及 3 个 `setInterval` 均未在组件卸载时清理。

**修复方案**：
- 新增 `timersRef` 统一跟踪所有定时器 ID
- 新增 `registerTimer()` 函数注册定时器
- 组件卸载时（useEffect cleanup）一次性 `clearAllTimers`
- 同时清理 `setTimeout` 和 `setInterval`（两种类型都用 `clearTimeout`/`clearInterval` 双保险）

---

### 问题 2：购物袋组件商品切换时状态丢失

**修复文件**：
- [ShoppingBag.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/live-stream/ShoppingBag.jsx)
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/live-stream/index.jsx#L96-L103)

**问题**：通过 `key={currentProduct?.id}` 强制重建组件，导致用户正在浏览的规格选择和数量输入被清空。

**修复方案**：
- **移除** `index.jsx` 中 ShoppingBag 的 `key` 属性，组件不再强制重建
- **新增** `perProductRef = useRef(new Map())`，按 `productId` 保存每个商品独立的 `{selectedSpecs, addQuantity}`
- `useEffect` 监听 `currentProduct` 变化时，从缓存中恢复该商品之前的选择（若存在），否则初始化默认值
- `handleSpecChange`、`handleSetAddQty`、`handleAddCurrent` 每次修改时同步更新当前商品的缓存
- 用户切回之前浏览过的商品时，能看到自己选过的规格和数量

---

### 问题 3：点赞爱心飘心位置坐标偏移

**修复文件**：[LiveWidgets.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/live-stream/LiveWidgets.jsx#L57-L71)

**问题**：原代码用按钮的 `offsetParent`（即 `.ls-like-container`）做坐标参考系，但爱心元素实际是 `position: absolute` 定位在 `.ls-hearts-layer` 内的（该层有 `inset: -300px -100px 0 -100px`，比外层容器大很多），两个坐标系不一致导致起点偏移。

**修复方案**：
- 新增 `heartsLayerRef`（爱心层）和 `btnRef`（按钮）两个 DOM ref
- `handleClick` 时：
  - 取 `heartsLayerRect = heartsLayerRef.getBoundingClientRect()`
  - 取 `btnRect = btnRef.getBoundingClientRect()`
  - 计算按钮中心 → 相对爱心层左上角的坐标：`x = centerX - layerRect.left`，`y = centerY - layerRect.top`
- 这样 `.ls-heart-float { left/top }` 的值与实际定位参考系完全一致

**额外修复的问题**：
- 顺手清理了 `LiveWidgets.jsx` 中所有定时器的内存泄漏（LikeButton 的 `heartTimersRef`、OnlineCounter 的 `timersRef`）
- 修复了 `OnlineCounter` 中 `next >= prevValue` 比较顺序的逻辑 bug（先赋值再比较导致恒为 false）
- 修复了 React Hooks `exhaustive-deps` 警告（将 `prevValue` 移入 `useRef`）