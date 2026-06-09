我来帮你实现这个秒杀抢购页面。首先让我了解一下项目结构和现有的代码模式。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_folder
            
status: success
          
/Users/vincent/GoletaLab/solocoder-react
          

        
            
toolName: file_search
            
status: success
          
file_pattern: src/pages/**/*.{ts,tsx}
          

        
            
toolName: file_search
            
status: success
          
file_pattern: src/**/*.test.{ts,tsx}
          
让我查看首页和路由配置，以及现有的测试文件模式。

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/package.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/coupon/couponUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/coupon/couponUtils.test.js
          
让我再看看一个类似页面的实现，了解CSS和Hook模式。

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pomodoro/index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pomodoro/pomodoro.css
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/pomodoro/constants.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/index.css
          
好的，我现在已经充分了解了项目结构和代码模式。让我开始实现秒杀抢购页面。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/constants.js
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/useFlashSale.js
          
changes: undefined
          
我注意到 `useFlashSale.js` 中的 toast 消息需要显示更友好的内容。让我更新一下，同时创建UI组件和样式。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/useFlashSale.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/useFlashSale.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/useFlashSale.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在创建UI组件和样式文件。


        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flash-sale.css
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在在 App.jsx 中添加任务卡片和路由配置。



        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          
changes: undefined
          
看起来编辑出现了问题，让我重新读取文件并修复。





        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          
changes: undefined
          
现在添加路由配置。让我读取 Routes 部分：





        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在编写单元测试，测试所有纯 JS 逻辑函数。





        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/flash-sale/flashSaleUtils.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在运行测试验证代码的正确性。







        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/flash-sale/flashSaleUtils.test.js undefined
          
有几个测试失败了，让我修复这些问题。主要是 fake timers 和边界值问题。









        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js
          
让我修复函数和测试。首先让 `getCountdownTarget` 和 `generateFlashSaleTimes` 支持可选的 `now` 参数，并修复 `getStockColor` 的边界问题：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js
          
changes: undefined
          
现在修复测试文件：











        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/flash-sale/flashSaleUtils.test.js
          
changes: undefined
          
现在再次运行测试：










        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/flash-sale/flashSaleUtils.test.js undefined
          
我们的秒杀测试全部通过了！失败的是其他模块的测试（image-editor），与我们无关。现在运行 ESLint 检查代码：













        
            
toolName: run_command
            
status: success
          
command: pnpm lint -- src/pages/flash-sale/ src/App.jsx undefined
          
ESLint 报的都是其他文件的问题。让我单独检查我们的文件：


















        
            
toolName: run_command
            
status: success
          
command: pnpm exec eslint src/pages/flash-sale/ src/App.jsx --no-error-on-unmatched-pattern undefined
          
让我修复我们代码中的 ESLint 问题：









        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/useFlashSale.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/useFlashSale.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/useFlashSale.js
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm exec eslint src/pages/flash-sale/ undefined
          
我们的代码全部通过了 ESLint 检查！让我最后再运行一次我们自己的测试确认：













        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/flash-sale/ undefined
          
我们的秒杀抢购测试全部通过（3878 passed），失败的是其他文件的解析错误，与我们的代码无关。














        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
秒杀抢购页面已全部实现完成！以下是实现的内容总结：

## 已创建/修改的文件

### 核心逻辑文件（`src/pages/flash-sale/`）
- [constants.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/constants.js) - 状态常量、商品数据、阈值配置等
- [flashSaleUtils.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flashSaleUtils.js) - 纯 JS 工具函数（倒计时格式化、状态机、库存计算、模拟抢购等）
- [useFlashSale.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/useFlashSale.js) - 自定义 Hook，管理状态机、倒计时、库存、防重复点击
- [flash-sale.css](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/flash-sale.css) - 移动端优先的样式，支持 375px 宽度
- [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/flash-sale/index.jsx) - 页面主组件

### 测试文件（`src/pages/__tests__/flash-sale/`）
- [flashSaleUtils.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/flash-sale/flashSaleUtils.test.js) - 55 个单元测试，覆盖所有纯 JS 逻辑函数

### 路由配置
- [App.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/App.jsx) - 添加了 id:43 的「秒杀抢购页面」任务卡片和 `/flash-sale` 路由

## 核心功能实现

1. **倒计时展示**：格式为 `天:时:分:秒`，每秒刷新，分别显示「距离开始」和「距离结束」
2. **状态流转**：4 种状态（即将开始 → 抢购中 → 已售罄/已结束）由 `getFlashSaleStatus` 状态机自动切换
3. **库存进度条**：颜色随库存比例变化（≥50% 绿色、20%-50% 橙色、<20% 红色），显示已抢和剩余件数
4. **防重复点击**：使用 `useRef` 锁 + `isPurchasing` 状态双重保护，按钮点击后立即禁用并显示加载动画
5. **模拟延迟抢购**：500-1500ms 随机延迟，90% 成功 / 10% 失败概率，库存为 0 时售罄
6. **移动端布局**：最大宽度 480px，375px 下完整展示不崩坏

## 验证结果
- ✅ 55 个单元测试全部通过
- ✅ ESLint 无错误