我来帮你实现这个贪吃蛇游戏。首先让我了解一下项目结构，然后制定详细的实现计划。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: file_search
            
status: success
          
file_pattern: src/pages/**/*.{ts,tsx,js,jsx}
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          
让我看看现有的类似游戏（如俄罗斯方块、数独）的代码结构作为参考：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tetris\tetrisCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tetris\constants.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\tetris\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\tetris\tetrisCore.test.js
          
让我看看数独或其他游戏的排行榜实现作为参考：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sudoku\sudokuCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\sudoku\index.jsx
          
让我搜索一下排行榜相关的实现作为参考：



        
            
toolName: search_by_regex
            
status: success
          
query: leaderboard|排行榜|ranking|排名
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\minesweeper\minesweeperCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\minesweeper\constants.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\minesweeper\index.jsx
          
完美！我已经了解了项目结构和代码规范。现在开始实现贪吃蛇游戏。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: New-Item -ItemType Directory -Force -Path "src/pages/snake", "src/pages/__tests__/snake" undefined
          
目录创建成功。现在开始创建常量文件：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snake\constants.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在创建核心逻辑模块：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snake\snakeCore.js
          
changes: undefined
          
我发现了一个语法错误，需要修复：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snake\snakeCore.js
          
changes: undefined
          
现在创建样式文件：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snake\snake.css
          
changes: undefined
          
现在创建游戏主组件：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snake\index.jsx
          
changes: undefined
          
我发现游戏循环中有一个逻辑问题需要修复，当游戏结束时应该正确更新状态：







        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: 
          
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snake\index.jsx
          
changes: undefined
          
现在开始编写单元测试：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\snake\snakeCore.test.js
          
changes: undefined
          
现在运行测试来验证代码：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/snake/snakeCore.test.js undefined
          
有3个测试失败了。让我修复这些问题：

1. `wrapCoordinate` 函数逻辑有问题，应该使用正确的模运算
2. 自身碰撞测试用例设计有问题（初始蛇就有碰撞）

让我先修复 `snakeCore.js：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\snake\snakeCore.js
          
changes: undefined
          
现在修复测试用例中的自身碰撞测试。原测试用例的蛇初始状态就有重叠，需要设计一个移动后才碰撞的场景：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\snake\snakeCore.test.js
          
changes: undefined
          
现在再次运行测试：







        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/snake/snakeCore.test.js undefined
          
我需要设计一个更好的自身碰撞测试用例。当前蛇移动后尾巴会被移除，所以需要确保蛇头撞到的是不会被移除的身体部分：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\snake\snakeCore.test.js
          
changes: undefined
          
让我再次运行测试：









        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/snake/snakeCore.test.js undefined
          
太好了！所有测试都通过了。现在运行 ESLint 和构建验证：








        
            
toolName: run_command
            
status: success
          
command: pnpm lint -- src/pages/snake/ src/pages/__tests__/snake/ undefined
          
让我只检查 snake 相关文件的 lint 问题：









        
            
toolName: run_command
            
status: success
          
command: pnpm lint -- src/pages/snake/*.js src/pages/snake/*.jsx src/pages/__tests__/snake/*.js undefined
          
让我直接用 eslint 只检查 snake 相关文件：











        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/snake/ src/pages/__tests__/snake/ --no-error-on-unmatched-pattern undefined
          
只有一个 lint 错误，修复未使用的导入：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\snake\snakeCore.test.js
          
changes: undefined
          
现在再次运行 lint 检查和构建验证：












        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/snake/ src/pages/__tests__/snake/ --no-error-on-unmatched-pattern undefined
          
Lint 通过了！现在运行构建验证：













        
            
toolName: run_command
            
status: success
          
command: pnpm build undefined
          
构建成功！让我更新 todo 列表：











        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
贪吃蛇游戏已经成功实现！以下是完整的实现总结：

## 📁 创建的文件

**游戏代码**位于 `src/pages/snake/`：
- [constants.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/snake/constants.js) - 游戏常量配置
- [snakeCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/snake/snakeCore.js) - 核心游戏逻辑（纯函数）
- [snake.css](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/snake/snake.css) - 样式文件
- [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/snake/index.jsx) - React 主组件

**测试代码**位于 `src/pages/__tests__/snake/`：
- [snakeCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/snake/snakeCore.test.js) - 59 个单元测试

## ✅ 已实现的功能

1. **Canvas 游戏区域**：20×20 单元格网格，浅色虚线网格线，Canvas 尺寸固定为 500×500px
2. **双重控制方式**：方向键（↑↓←→）和 WASD 键控制方向，禁止直接反向移动
3. **食物与碰撞**：食物随机生成在网格空白位置，蛇头撞墙（边界死亡模式）或撞自身时游戏结束
4. **双模式切换**：
   - 边界死亡模式（默认）：撞墙即死
   - 穿墙模式：蛇头从一侧边界穿出从另一侧出现
   - 模式只能在游戏开始前切换
5. **速度递增计分**：
   - 初始速度 150ms/帧
   - 每吃一个食物 +10 分
   - 每 50 分升一级，每级移动间隔减少 10ms
   - 最快速度 50ms/帧
6. **暂停与重开**：空格键或 P 键暂停/继续，暂停时显示半透明遮罩和"暂停中"文字；提供"新游戏"按钮
7. **排行榜持久化**：
   - 游戏结束后得分进入前 10 名提示输入昵称
   - 保存到 localStorage，显示排名、昵称、得分、日期
   - 当前上榜成绩高亮显示

## 🧪 测试结果

- ✅ **59 个单元测试全部通过**（测试蛇移动、碰撞检测、食物生成、计分、排行榜等核心逻辑）
- ✅ ESLint 检查通过
- ✅ 项目构建成功

## 🎮 游戏操作说明

| 按键 | 功能 |
|------|------|
| ↑ / W | 向上移动 |
| ↓ / S | 向下移动 |
| ← / A | 向左移动 |
| → / D | 向右移动 |
| Space / P | 暂停/继续 |
| Enter | 游戏结束后重新开始 |

游戏包含精美的视觉效果：蛇头带有方向感应的眼睛、食物带有高光效果、渐变色背景、响应式布局支持移动端。