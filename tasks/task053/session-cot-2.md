我来逐一修复这些问题。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
让我先读取相关文件，了解当前状态：



        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/minesweeperCore.js
          
好的，我已经了解了问题所在。让我开始逐一修复。

首先修复 `minesweeperCore.js` 中自定义难度排行榜的逻辑：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先修复 `minesweeperCore.js` - 使自定义难度也能记录到排行榜：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/minesweeperCore.js
          
changes: undefined
          
现在重写 `index.jsx` - 修复自定义按钮、简化状态同步、增加自定义排行榜展示：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/index.jsx
          
changes: undefined
          
现在更新单元测试，覆盖自定义难度排行榜逻辑：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/minesweeper/minesweeperCore.test.js
          
现在更新测试文件，将原来断言"自定义难度不入排行榜"的测试改为"自定义难度也入排行榜"的正确测试：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/minesweeper/minesweeperCore.test.js
          
changes: undefined
          
现在运行测试来验证所有修复：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && pnpm test -- src/pages/__tests__/minesweeper/minesweeperCore.test.js 2>&1 undefined
          
看起来测试被中断了，让我重新运行：</think_never_used_51bce0c785ca2f68081bfa7d91973934>测试被中断了，让我用 vitest run 直接运行：

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/minesweeper/minesweeperCore.test.js 2>&1 undefined
          
所有 56 个测试通过！现在检查一下扫雷相关文件的 lint 是否通过：






        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx eslint src/pages/minesweeper/ src/pages/__tests__/minesweeper/ 2>&1 undefined
          
Lint 全部通过。现在让我更新待办列表：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题已修复！以下是修复详情：

## 修复内容

### 1. 自定义难度面板无法显示
- **修复前**：[index.jsx#L221-L230](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/index.jsx#L221-L230) 的"自定义"按钮没有 `onClick`，同时 [handleDifficultyClick](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/index.jsx#L76-L82) 对 `DIFFICULTY.CUSTOM` 直接 `return` 不做处理。
- **修复后**：按钮已绑定 `onClick={() => handleDifficultyClick(DIFFICULTY.CUSTOM)}`，点击后 `setDifficulty(DIFFICULTY.CUSTOM)` 切换状态，配置面板通过条件渲染正确展示。

### 2. 自定义难度成绩入排行榜
- **修复前**：[addToLeaderboard](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/minesweeper/minesweeperCore.js#L307-L331) 对自定义难度直接返回 `rank: -1` 且不写入 localStorage；排行榜面板也只展示三个预设难度。
- **修复后**：
  - `addToLeaderboard` 新增可选参数 `customConfig`，自定义难度条目会携带 `rows/cols/mines` 配置信息写入排行榜
  - 排行榜面板新增"自定义"分组，展示时以 `10×10/15雷 · 日期` 格式显示配置
  - 获胜时调用 `addToLeaderboard` 传入自定义配置

### 3. 简化 useEffect / ref 同步套路
- **修复前**：引入了 `timeRef`、`difficultyRef`、`rankInfoRef` 及 3 个同步 state 到 ref 的 useEffect，代码冗余且难读。
- **修复后**：仅保留 `timerRef` 用于管理 setInterval；直接在事件处理函数中使用 state 变量，获胜时通过闭包中最新的 `difficulty`、`time`、`currentRankInfo` 即可，无需额外同步。

### 4. 测试更新与验证
- **修复前**：[测试文件](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/minesweeper/minesweeperCore.test.js#L463-L468) 断言自定义难度不入榜。
- **修复后**：新增 2 个测试验证自定义难度条目携带配置入榜且按用时排序，**全部 56 个测试通过，ESLint 无错误**。