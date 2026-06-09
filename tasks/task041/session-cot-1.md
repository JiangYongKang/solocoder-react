我来帮你实现 SKU 规格选择器页面。首先让我探索一下项目结构，了解现有的代码规范和约定。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 10 items
          

        
            
toolName: view_folder
            
status: success
          
/Users/vincent/GoletaLab/solocoder-react
          

        
            
toolName: view_folder
            
status: success
          
/Users/vincent/GoletaLab/solocoder-react/src
          
让我查看路由配置和现有的页面示例，了解代码规范：

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/package.json
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/db-designer/dbDesignerCore.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/db-designer/index.jsx
          
让我看一下测试文件的规范：

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/db-designer/dbDesignerCore.test.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/db-designer/db-designer.css
          
现在我已经了解了项目结构和代码规范。让我开始实现 SKU 规格选择器。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
首先创建核心逻辑文件，包含所有纯函数：


        
            
toolName: run_command
            
status: success
          
command: mkdir -p /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector undefined
          
现在创建核心逻辑文件：

        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
现在创建 CSS 样式文件：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/sku-selector.css
          
changes: undefined
          
现在创建主页面组件，整合所有功能：





        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
现在更新路由配置：







        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/App.jsx
          
changes: undefined
          
现在编写单元测试：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js
          
changes: undefined
          
现在运行测试和代码检查：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/sku-selector/skuCore.test.js 2>&1 undefined
          
所有 55 个测试全部通过！现在运行 ESLint 检查代码规范：









        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm run lint 2>&1 | head -100 undefined
          
让我用 GetDiagnostics 检查我们创建的文件：




        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
有一个未使用参数的提示，让我修复它：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js
          
changes: undefined
          
同时需要更新 index.jsx 中的调用：






        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx
          
changes: undefined
          
再次运行测试确认一切正常，并验证构建：










        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npx vitest run src/pages/__tests__/sku-selector/skuCore.test.js 2>&1 undefined
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm run build 2>&1 | tail -30 undefined
          
构建错误是项目中已存在的 `social-feed` 模块的问题（与我们的代码无关）。我们的 SKU 规格选择器所有 55 个单元测试全部通过！让我完成任务：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 9 items
          
SKU 规格选择器页面已完整实现！以下是实现内容的总结：

## 📁 文件结构

| 文件 | 说明 |
|------|------|
| [skuCore.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js) | 核心纯函数逻辑（笛卡尔积、SKU生成、联动禁用、存储等） |
| [index.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/index.jsx) | 主页面组件，包含三个子组件 |
| [sku-selector.css](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/sku-selector.css) | 页面样式 |
| [skuCore.test.js](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/__tests__/sku-selector/skuCore.test.js) | 单元测试（55个用例全部通过） |

## ✅ 功能实现

**1. 规格动态配置** — 左侧面板可动态添加/删除规格组，每组内支持增删规格值和上传配图，所有配置实时保存到 localStorage。

**2. SKU 列表生成与管理** — 中间面板根据规格配置自动生成笛卡尔积 SKU 列表，支持单独设置每个 SKU 的库存/价格，以及批量一键设置。

**3. 规格选择交互** — 右侧预览区展示规格按钮组，已选中按钮高亮显示，点击可取消选中。

**4. 联动禁用无库存组合** — 选中某个规格值后，其他规格组中会导致最终组合无库存的规格值按钮自动置灰禁用（使用 [getDisabledValues](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/sku-selector/skuCore.js#L225-L262) 函数）。

**5. 规格摘要与价格计算** — 预览区顶部显示"已选：红色 / S / Pro版"格式的摘要，实时显示匹配 SKU 的价格和库存，库存为 0 时显示红色"无货"提示。

**6. 图片联动切换** — 每个规格值可上传示意图，选择后主图区自动叠加展示匹配的图片组合。

**7. 路由已注册** — 在 [App.jsx](file:///Users/vincent/GoletaLab/solocoder-react/src/App.jsx) 中添加了 `/sku-selector` 路由和首页任务卡片（id: 41）。

## 🧪 测试结果

```
Test Files  1 passed (1)
Tests  55 passed (55)
```

测试覆盖了所有纯函数逻辑：ID 生成、规格组/值 CRUD、笛卡尔积、SKU 生成同步、批量操作、选择完整性判断、SKU 匹配、摘要生成、禁用值计算、图片提取、localStorage 读写等。