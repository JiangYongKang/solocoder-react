我将为您实现「直播带货模拟」页面。首先让我了解一下当前项目的结构和技术栈。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          

        
            
toolName: view_folder
            
status: success
          
c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src
          
让我查看几个相关页面的代码风格作为参考。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\food-order\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\danmaku-player\danmakuCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\flash-sale\flashSaleUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
让我再查看一个测试文件的风格作为参考。



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\chat\utils.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\food-order\utils.js
          
现在我已经掌握了项目结构和代码风格，开始实现直播带货模拟页面。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\constants.js
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\utils.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\live-stream\utils.test.js
          
changes: undefined
          
先运行测试验证工具函数是否正确：

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx vitest run src/pages/__tests__/live-stream/utils.test.js undefined
          
测试全部通过！现在开始创建各个组件。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
现在创建商品轮播组件：


        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\ProductCarousel.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\DanmakuArea.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\ShoppingBag.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\CouponTimer.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\LiveWidgets.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
现在创建 CSS 样式文件和主页面：




        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\live-stream.css
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\index.jsx
          
changes: undefined
          
现在在 App.jsx 中注册路由并添加任务卡片：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: search_by_regex
            
status: success
          
query: import LockerManagementPage
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
我发现 App.jsx 的 TASKS 数组末尾有个语法错误，我修复它同时添加直播带货页面的导入、任务和路由：

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\App.jsx
          
changes: undefined
          
现在运行测试和 lint 来验证代码：



        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx vitest run src/pages/__tests__/live-stream/utils.test.js undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/live-stream/ src/pages/__tests__/live-stream/ undefined
          
有一些 lint 错误需要修复，让我逐个处理：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\index.jsx
          
发现了问题！style 对象中的 `12px` 需要用引号包裹，让我批量修复所有 lint 错误：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\live-stream\utils.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\CouponTimer.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\DanmakuArea.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\LiveWidgets.jsx
          
changes: undefined
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\ProductCarousel.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\ProductCarousel.jsx
          
changes: undefined
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\ShoppingBag.jsx
          
changes: undefined
          
现在修复 index.jsx 中的语法错误（style 中的像素值需要加引号）：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\index.jsx
          
changes: undefined
          
现在再次运行 lint 检查：







        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/live-stream/ src/pages/__tests__/live-stream/ undefined
          
还有一个 React Hooks 的 lint 问题，用 `key` 属性让 ShoppingBag 在商品切换时自动重挂载是更好的方式：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\ShoppingBag.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\live-stream\index.jsx
          
changes: undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx eslint src/pages/live-stream/ src/pages/__tests__/live-stream/ ; echo "---TEST---" ; npx vitest run src/pages/__tests__/live-stream/utils.test.js undefined
          
所有 lint 检查和测试全部通过！现在运行 build 确保编译正常：





        
            
toolName: run_command
            
status: success
          
command: cd "c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react" ; npx vite build 2>&1 | Select-Object -Last 30 undefined
          
构建成功！现在更新任务状态：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
## 🎉 「直播带货模拟」页面实现完成

已成功实现所有功能需求，全部测试通过、ESLint 通过、Vite 构建成功。

### 📁 文件结构

```
src/pages/
├── live-stream/
│   ├── index.jsx                  # 主页面（路由入口）
│   ├── constants.js               # 常量配置（商品/优惠券/用户名等模拟数据）
│   ├── utils.js                   # 纯 JS 工具函数（可被单元测试）
│   ├── live-stream.css            # 页面样式
│   ├── ProductCarousel.jsx        # 商品轮播 + 讲解中高亮
│   ├── DanmakuArea.jsx            # 弹幕滚动 + 发送 + 历史记录
│   ├── ShoppingBag.jsx            # 购物袋侧边栏（增删/规格/结算）
│   ├── CouponTimer.jsx            # 优惠券倒计时领取
│   └── LiveWidgets.jsx            # 点赞飘心 + 在线人数 + 直播头
└── __tests__/live-stream/
    └── utils.test.js              # 63 个单元测试 ✅
```

### ✨ 实现的功能

| # | 功能 | 说明 |
|---|------|------|
| 1 | **商品轮播卡片** | 6 款商品，每 3 秒自动切换，支持左右按钮 + 触摸滑动 + 指示点点击 |
| 2 | **讲解中商品高亮** | 发光边框 + 光晕背景 + 缩放聚焦 + "🔥 讲解中"标签 + 金色描边 |
| 3 | **弹幕滚动** | 8 轨道滚动（从右向左），支持评论/购买/点赞三种类型，不同颜色区分；用户可输入发送 |
| 4 | **购物袋侧边栏** | 可折叠面板；支持规格选择、数量修改、删除、合计金额计算、满减自动抵扣 |
| 5 | **领券倒计时** | 5 分钟倒计时，3 张优惠券循环切换；领取后自动出现在购物袋中抵扣 |
| 6 | **点赞飘心动画** | 每次点击冒出 3 颗彩色爱心（不同颜色/大小/偏移），向上飘动 1.5s 渐隐；总数实时累加 |
| 7 | **在线人数模拟** | 1000-10000 之间每 2-5 秒随机波动，带上升/下降箭头指示器 |

### 🧪 单元测试（63 项全部通过 ✅）

测试文件：[utils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/live-stream/utils.test.js)

覆盖范围：
- **轮播索引**：`getNextCarouselIndex` / `getPrevCarouselIndex` / `getClampedCarouselIndex`（边界循环 + 钳制）
- **购物袋金额**：`addToBag` / `updateBagQuantity` / `calcBagSubtotal` / `calcBagCount` / `calcBagTotal`
- **优惠券逻辑**：`getBestApplicableCoupon`（自动选最优券）、满减门槛计算
- **倒计时格式化**：`padZero` / `formatCountdown`（过期判定）
- **弹幕工具**：`createDanmaku` / `pushDanmaku`（最大容量截断）
- **在线人数**：`nextOnlineCount` / `generateInitialOnlineCount`（边界钳制）

### 🔗 页面访问

在 App.jsx 中已注册任务卡片和路由，首页点击「**124: 直播带货模拟**」即可进入，或直接访问 `#/live-stream`。