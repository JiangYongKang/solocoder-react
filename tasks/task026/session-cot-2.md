我来逐一修复这些问题。首先创建任务计划：


        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
先让我读取需要修改的文件的最新内容：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
让我读取所有需要修改的文件：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\ganttUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\TaskList.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\ContextMenu.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\index.jsx
          
让我继续读取 ganttUtils.js 的剩余部分：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\ganttUtils.js
          
好的，我已经阅读了所有相关文件。现在开始逐一修复问题。先从 #1 默认数据层级关系开始：

**问题 1：修复 getDefaultTasks 默认数据 - 设置合理的父子层级关系**
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\ganttUtils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
**问题 2：实现左右面板垂直滚动联动**

我需要修改 TaskList.jsx 暴露滚动容器 ref，Timeline.jsx 同样暴露滚动容器 ref，然后在 index.jsx 中做同步。

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\TaskList.jsx
          
changes: undefined
          
现在重构 TaskList 组件，使用 forwardRef 暴露滚动容器 ref，同时接入 validateTask 校验（同时解决问题 #3）：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\TaskList.jsx
          
changes: undefined
          
现在修改 TaskList 主组件，包装为 forwardRef 并传递校验参数：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\TaskList.jsx
          
changes: undefined
          
现在修改 Timeline.jsx - 暴露滚动 ref、实际使用 dateToPx/pxToDate、添加从右侧编辑进度的功能：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          
现在修改 Timeline.jsx 的拖拽逻辑使用 pxToDate，并在今日标记使用 dateToPx（问题 #5），同时添加进度编辑（问题 #4）和滚动容器 ref：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          
现在更新拖拽逻辑使用 pxToDate 计算鼠标位置对应的日期，更新今日线使用 dateToPx，并更新任务条添加进度拖拽手柄：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          
现在修改 renderGrid 使用 dateToPx，并更新 renderTaskBars 添加进度拖拽手柄，以及添加 scrollRef 到容器：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          
现在更新 renderTaskBars 添加进度拖拽手柄：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          
现在修改 Timeline 的 return 语句，添加 scrollRef 到滚动容器，并修正组件导出：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
现在更新 Timeline 的 return 和 export：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          
**问题 6：修复 ContextMenu 子菜单位定 - 统一使用 fixed 定位**









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\ContextMenu.jsx
          
changes: undefined
          
现在更新 index.jsx，添加滚动联动逻辑和 refs：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\index.jsx
          
changes: undefined
          
现在更新 index.jsx 的 JSX，将 refs 传递给组件：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\index.jsx
          
changes: undefined
          
现在更新 Timeline.jsx 的拖拽逻辑，实际使用 pxToDate 函数（问题 #5），将鼠标像素位置直接转换为日期：













        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          
我发现 move 模式的拖拽逻辑有个小 bug，需要修复。让我简化并确保 pxToDate 正确用于所有拖拽模式：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\Timeline.jsx
          
changes: undefined
          
现在更新 CSS，确保 context menu 的定位不会冲突：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\gantt-chart.css
          

        
            
toolName: search_by_regex
            
status: success
          
query: gantt-context-menu|gantt-dependency-submenu
          
更新 CSS，将 dependency-submenu 也改为支持 fixed 定位：












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\gantt-chart\gantt-chart.css
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在补充单元测试，覆盖新增的默认任务层级结构、dateToPx/pxToDate 往返转换、多级深度层级等：












        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\gantt-chart\ganttUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\gantt-chart\ganttUtils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\gantt-chart\ganttUtils.test.js
          
现在在测试文件末尾追加新的测试用例：














        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\gantt-chart\ganttUtils.test.js
          
changes: undefined
          
现在在文件末尾添加新的测试：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\gantt-chart\ganttUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
现在运行所有测试确保全部通过：

















        
            
toolName: run_command
            
status: success
          
command: pnpm run test src/pages/__tests__/gantt-chart/ganttUtils.test.js undefined
          
所有 92 个测试通过！现在运行构建验证和诊断检查：


















        
            
toolName: run_command
            
status: success
          
command: pnpm build 2>&1 | Select-Object -Last 10 undefined
          
构建成功！现在检查诊断确保没有代码问题：




















        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
所有文件均无诊断错误！让我完成最后的任务状态：





















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
所有问题已修复完成！以下是修复详情：

## ✅ 修复汇总

### 1. 默认任务数据层级关系
**文件**: [ganttUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/ganttUtils.js#L79-L203)

重构 `getDefaultTasks()` 函数，9 个任务现在具有清晰的 3 级层级结构：
- **第 1 级**（根任务）：项目启动与规划、技术方案设计、开发与测试
- **第 2 级**（子任务）：需求调研（隶属于启动）、前端/后端架构设计（隶属于设计）、前端开发/后端开发/集成测试（隶属于开发）
- 同时预置了合理的依赖关系链

### 2. 左右面板垂直滚动联动
**文件**: 
- [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/index.jsx#L33-L63)
- [TaskList.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/TaskList.jsx#L153-L165)
- [Timeline.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/Timeline.jsx#L28-L51)

- TaskList 和 Timeline 均通过 `forwardRef` + `useImperativeHandle` 暴露滚动控制接口
- 主页面监听两个面板的 scroll 事件，使用 `requestAnimationFrame` + `isSyncingScroll` 标志位避免循环触发
- 滚动任意一侧，另一侧自动同步对齐

### 3. TaskList 行内编辑接入校验
**文件**: [TaskList.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/TaskList.jsx#L4-L151)

`EditableCell` 组件新增：
- 接收 `field` 和 `currentTask` 参数
- 提交时调用 `validateTask()` 做字段级校验
- 校验失败时显示红色边框 + 悬浮错误提示，阻止提交
- 校验覆盖：任务名称非空、进度 0-100、日期格式、结束日期不早于开始日期

### 4. 进度双向同步（右侧可编辑）
**文件**: [Timeline.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/Timeline.jsx#L95-L118)

新增进度编辑功能：
- 进度填充区域和进度条末端手柄均可鼠标拖拽
- 横向拖动实时更新任务进度百分比，同步到左侧列表
- 任务条标签显示 "任务名 (XX%)"，一目了然
- 左侧修改进度 → 右侧填充同步；右侧拖拽 → 左侧数字同步 ✅ 真正的双向同步

### 5. dateToPx / pxToDate 实际使用
**文件**: [Timeline.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/Timeline.jsx)

- `dateToPx` 用于**今日线位置计算**（替换原 `diffDays * dayWidth` 手写计算）
- `pxToDate` 用于**拖拽逻辑**：将鼠标像素坐标实时转换为日期，驱动任务条的开始/结束时间计算
- 两个函数均在组件核心逻辑中被实际调用，不再是死代码

### 6. ContextMenu 子菜单统一 fixed 定位
**文件**: 
- [ContextMenu.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/ContextMenu.jsx)
- [gantt-chart.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/gantt-chart/gantt-chart.css#L536-L546)

- 主菜单和子菜单均使用 `position: fixed` 定位
- 子菜单位置通过 `getBoundingClientRect()` 实时计算（基于主菜单 DOM 实际渲染坐标），与滚动位置无关
- CSS 中移除了 `position: absolute` 和 `left: 100%` 等绝对定位属性

### 7. 补充单元测试
**文件**: [ganttUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/gantt-chart/ganttUtils.test.js#L542-L813)

新增 5 个测试套件、33+ 测试用例：
- **默认任务层级**：7 个用例（父子关系、引用完整性、可见性、数据校验）
- **dateToPx/pxToDate 往返**：8 个用例（3 种缩放级别、边界值、常量一致性）
- **多级深度层级**：9 个用例（4 层嵌套、展开折叠、递归删除、索引计算）
- **字段级校验**：9 个用例（各字段错误、多错误、边界值）
- **缩放级别位置计算**：3 个用例

### 8. 验证结果
- ✅ **单元测试**: 92 个全部通过（原 59 + 新增 33）
- ✅ **构建**: `pnpm build` 成功
- ✅ **诊断**: 所有甘特图相关文件 0 错误
- ✅ **响应式布局**: CSS 中保留了 375px / 1440px 断点的适配逻辑