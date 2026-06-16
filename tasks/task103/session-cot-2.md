好的，我来逐一修复这 5 个问题。先创建任务清单：
        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先读取相关文件了解现状：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\constants.js
          
继续读取其他相关文件：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\DevicePanel.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\index.jsx
          
现在开始逐一修复。先读取 PropertyPanel 的当前代码，然后开始第一轮修复：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\PropertyPanel.jsx
          
好的，开始修复。首先修改常量文件，添加连线曲线类型：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\constants.js
          
changes: undefined
          
现在修改 networkTopologyCore.js，添加曲线样式支持并修复贝塞尔控制点方向自适应：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          
changes: undefined
          
现在修复 `buildBezierPath` 控制点方向自适应，并更新 `getLinkPath` 支持曲线/直线切换：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          
changes: undefined
          
现在更新 `importFromJson` 增加对 `curveStyle` 的校验：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          
changes: undefined
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\networkTopologyCore.js
          
changes: undefined
          
第一个问题核心逻辑修复完成。现在创建通用形状组件，消除重复代码：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
创建通用形状组件 `DeviceShape.jsx`：







        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\DeviceShape.jsx
          
changes: undefined
          
现在更新 `DevicePanel.jsx` 使用通用形状组件：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\DevicePanel.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\DevicePanel.jsx
          
changes: undefined
          
现在更新 SVG 中 DeviceShape 的使用方式，因为设备面板图标是 48x48 的：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\DevicePanel.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\DevicePanel.jsx
          
changes: undefined
          
现在更新 `TopologyCanvas.jsx`，同时完成多个修复：使用通用形状组件、添加内容组类名、修复连线创建。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
修改 TopologyCanvas.jsx，先更新导入：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          
changes: undefined
          
现在删除原有的 NodeShape 函数，并替换使用：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          
changes: undefined
          
现在更新节点渲染部分，用 `DeviceShape` 替换 `NodeShape`，并给内容组加类名，同时修复 handlePortMouseUp：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          
给变换 g 元素加类名 `nt-canvas-content`：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          
changes: undefined
          
现在找到节点渲染位置并替换 `NodeShape` 为 `DeviceShape`：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          
changes: undefined
          
现在修复 `handlePortMouseUp` 使用 `createLink` 函数：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\TopologyCanvas.jsx
          
changes: undefined
          
现在更新 index.jsx 的 PNG 导出选择器，使用类名选择器：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\index.jsx
          
changes: undefined
          
现在更新 PropertyPanel，添加曲线类型切换选项：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\PropertyPanel.jsx
          
changes: undefined
          
找到线型切换部分，在其后添加曲线类型切换：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\PropertyPanel.jsx
          
在"线型"之后添加"连线样式"切换：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\network-topology\PropertyPanel.jsx
          
changes: undefined
          
现在运行测试看看现有测试是否通过，以及需要更新哪些：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test -- src/pages/__tests__/network-topology/ 2>&1 undefined
          
88 个测试全部通过！现在补充一些新功能的测试用例，并运行 lint 检查：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
让我读取测试文件中相关部分，准备添加新测试：




        
            
toolName: search_by_regex
            
status: success
          
query: describe\(
          
读取相关测试段落，准备添加新测试：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
现在添加新的测试用例。先添加曲线样式常量测试，再更新 createLink 测试，添加路径和导入测试：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
添加曲线样式常量测试：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
更新 createLink 测试，添加 curveStyle 默认值断言：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
添加更多路径和 curveStyle 相关测试：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
现在添加 getLinkPath curveStyle 测试和 importFromJson curveStyle 校验测试：













        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
添加 getLinkPath curveStyle 相关测试：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
现在添加 importFromJson curveStyle 校验测试：









        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\network-topology\networkTopologyCore.test.js
          
changes: undefined
          
现在运行测试和 lint 验证：


















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm test -- src/pages/__tests__/network-topology/ 2>&1 undefined
          
96 个测试全部通过！现在运行 lint 检查：















        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm eslint src/pages/network-topology/constants.js src/pages/network-topology/networkTopologyCore.js src/pages/network-topology/DeviceShape.jsx src/pages/network-topology/DevicePanel.jsx src/pages/network-topology/TopologyCanvas.jsx src/pages/network-topology/PropertyPanel.jsx src/pages/network-topology/index.jsx src/pages/__tests__/network-topology/networkTopologyCore.test.js 2>&1 undefined
          
所有测试和 lint 都通过了！更新任务状态：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
所有 5 个问题已修复完成！以下是详细的修改总结：

## 修复内容

### 1. 贝塞尔曲线控制点方向自适应 + 直线/曲线切换
- **`constants.js`**：新增 `LINE_CURVE_STYLES`（`bezier` / `straight`）和 `LINE_CURVE_STYLE_LABELS` 常量
- **`networkTopologyCore.js`**：
  - `buildBezierPath` 新增 `fromPort`/`toPort` 参数，根据端口方向（top/bottom/left/right）自动决定控制点是水平偏移还是垂直偏移，上下连接时控制点沿 Y 轴延伸，斜向连接时曲线自然
  - `getLinkPath` 根据 `link.curveStyle` 自动选择 `buildBezierPath` 或 `buildDirectPath`
  - `createLink` 默认设置 `curveStyle: LINE_CURVE_STYLES.BEZIER`
  - `importFromJson` 增加 `curveStyle` 字段校验
- **`PropertyPanel.jsx`**：新增"连线样式"切换组（曲线 / 直线）

### 2. SVG 内容组类名 + PNG 导出选择器修复
- **`TopologyCanvas.jsx`**：变换组 `<g>` 添加 `className="nt-canvas-content"`
- **`index.jsx`**：`handleExportPng` 中 `querySelector('g > g')` 改为 `querySelector('.nt-canvas-content')`，不再依赖 DOM 层级

### 3. 提取通用形状渲染组件
- **新建 `DeviceShape.jsx`**：通用形状组件，支持 `type`、`x`、`y`、`width`、`height`、`strokeColor`、`strokeWidth` 等参数，统一实现 6 种形状（矩形/圆形/方形/六边形/菱形/云朵）的 SVG 渲染
- **`DevicePanel.jsx`** 和 **`TopologyCanvas.jsx`**：删除各自的 `DeviceShape`/`NodeShape` 重复实现，改用通用组件

### 4. 统一使用 `createLink` 创建连线
- **`TopologyCanvas.jsx`** 的 `handlePortMouseUp`：删除内联构造 link 的代码（Date.now + Math.random），改用 `createLink(fromNodeId, fromPort, toNodeId, toPort)`，保证连线 ID 格式与其他地方一致

### 5. 测试结果
- **96 个测试用例全部通过**（新增 8 个：曲线样式常量、createLink 默认 curveStyle、贝塞尔水平/垂直控制点方向、curveStyle 路径切换、导入 curveStyle 校验等）
- **Lint 检查：0 错误**

## 文件清单

| 文件 | 修改类型 |
|---|---|
| [constants.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-topology/constants.js) | 新增曲线样式常量 |
| [networkTopologyCore.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-topology/networkTopologyCore.js) | 贝塞尔方向自适应 + 曲线切换逻辑 |
| [DeviceShape.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-topology/DeviceShape.jsx) | 新增通用形状组件 |
| [DevicePanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-topology/DevicePanel.jsx) | 改用通用形状组件 |
| [TopologyCanvas.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-topology/TopologyCanvas.jsx) | 改用通用组件 + 类名 + createLink |
| [PropertyPanel.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-topology/PropertyPanel.jsx) | 新增连线样式切换 |
| [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/network-topology/index.jsx) | PNG 导出选择器修复 |
| [networkTopologyCore.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/network-topology/networkTopologyCore.test.js) | 新增 8 个测试用例 |