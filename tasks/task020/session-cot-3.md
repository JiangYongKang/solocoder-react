让我先规划任务，然后逐一修复。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先检查 CSS 文件中的特殊字符问题：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我直接读取 CSS 文件的关键部分，检查引号字符：





        
            
toolName: search_by_regex
            
status: success
          
query: content
          
让我直接用 Write 重写整个 CSS 文件，确保所有引号都是标准 ASCII：






        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\notifications\notifications.css
          
让我查看 375px 媒体查询块中的 toggle 样式：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\notifications\notifications.css
          
为了确保所有字符都是标准 ASCII，让我重写整个 CSS 文件。同时我会先检查 favicon 部分再一并修改：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\notifications\index.jsx
          
现在同时修复两个问题：CSS 字符和 favicon 99+ 文字适配。先重写 CSS 文件，确保所有字符都是标准 ASCII：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\notifications\notifications.css
          
我看到 CSS 了，为了确保所有字符都是标准 ASCII，让我重写整个 CSS 文件，同时修复 favicon 99+ 文字适配问题：

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\notifications\notifications.css
          
changes: undefined
          
CSS 已重写。现在修复 favicon 99+ 文字超出边界的问题——根据文字长度动态调整字号：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\notifications\index.jsx
          
changes: undefined
          
现在运行 lint 和测试，然后启动 dev server：













        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
先停止之前的开发服务器，然后运行 lint 和测试：








        
            
toolName: StopCommand
            
status: success
          
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npx eslint src/pages/notifications/ src/pages/__tests__/notifications/ undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; npm test -- src/pages/__tests__/notifications/notificationsUtils.test.js undefined
          
Lint 通过，54 个测试全部通过！现在启动开发服务器进行手动验证：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: running
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run dev undefined
          
开发服务器已启动！让我打开预览：



        
            
toolName: open_preview
            
status: success
          
预览
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复完成！以下是修改总结：

## 🔧 修复内容

### 1. CSS 非标准字符修复 ✅
**文件**: [notifications.css](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/notifications/notifications.css)

- 重写整个 CSS 文件，确保所有引号字符均为标准 ASCII 单引号 (U+0027)
- `.notif-toggle::after` 的 `content: '';` 及其在 375px 媒体查询中的覆写均使用标准字符
- 消除了因 Unicode 特殊字符导致的 "style prop expects a mapping" 运行时错误

### 2. Favicon 99+ 文字超出边界修复 ✅
**文件**: [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/notifications/index.jsx#L164-L178)

- 根据文字长度动态调整 Canvas 字体大小：
  - 1~2 个字符（如 `9`、`42`、`99`）：使用 **18px** 粗体
  - 3 个及以上字符（如 `99+`）：使用 **13px** 粗体
- 确保所有情况都不会超出 32×32 画布的右边界

## ✅ 验证结果

| 检查项 | 结果 |
|---|---|
| ESLint | 0 errors, 0 warnings |
| 单元测试 | **54 passed / 54 total** |
| 开发服务器 | 已启动在 http://localhost:5174/ |

可以在浏览器中访问 http://localhost:5174/notifications，手动验证以下内容：
- 调整视口到 **375px** 宽度检查通知卡片、Tab、偏好设置面板的布局
- 点击通知卡片的「查看详情」展开/折叠是否正常（不再白屏）
- 将未读数调到 100+ 观察 favicon 的 `99+` 是否完整显示