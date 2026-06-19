我来修复这两个问题。首先让我查看当前相关文件的状态，制定修复计划。
        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
让我先读取相关文件的当前状态：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\storage.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\PlanList.jsx
          
现在我清楚了两个问题的根因。先修复问题1：重构 `normalizePlansNextBackupTime`，不仅处理过期计划，还要对**所有**计划进行全局去重偏移，避免相同备份时间的计划同时触发。然后修复问题2：拆分语义不清的函数。

修复问题1：

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\storage.js
          
changes: undefined
          
现在 `createPlan` 和 `updatePlan` 中返回新的计划列表前，也应该调用 `normalizePlansNextBackupTime`，这样每次保存后都自动去重：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\storage.js
          
changes: undefined
          
问题1修复完毕。现在修复问题2：将 handleEditPlan 拆分为两个语义独立的函数。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在修改 `index.jsx`，把 `handleEditPlan` 拆分为 `handleOpenPlanEditor` 和 `handleUpdatePlanStatus`（或更通用的 `handleUpdatePlan`）：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\index.jsx
          
changes: undefined
          
现在修改 PlanList 的 props 传递和调用：


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\index.jsx
          
changes: undefined
          
现在修改 PlanList 组件，使用新的 `onUpdatePlan` prop 来切换状态：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\PlanList.jsx
          
changes: undefined
          
问题2修复完毕。现在运行测试：






        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/backup-manager/ undefined
          
备份恢复管理中心的103个测试全部通过。让我完成任务：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复完毕！以下是修复摘要：

## 修复内容

### 1. 相同备份时间新计划的去重偏移问题
**文件**：[storage.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/backup-manager/storage.js#L26-L73)

重构了 `normalizePlansNextBackupTime` 函数：
- **旧逻辑**：只检查 `nextBackupTime <= now`（已过期）才做偏移
- **新逻辑**：对**所有计划**（包括时间在未来的新计划）进行全局去重分析
  - 先计算所有计划的 nextBackupTime（过期的重新计算）
  - 统计每个时间点的冲突次数
  - 对同一时间点存在多个计划的情况，按顺序依次偏移 0、15、30... 分钟
  - 保留原有数组顺序不变

同时，在 `createPlan` 和 `updatePlan` 返回结果前也调用 `normalizePlansNextBackupTime`，确保每次操作后都自动去重。

### 2. handleEditPlan 语义不清晰问题
**文件**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/backup-manager/index.jsx#L26-L33) 和 [PlanList.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/backup-manager/PlanList.jsx#L13-L19)

将原来「一个函数承担两种完全不同语义」的 `handleEditPlan` 拆分为两个独立函数：
- **`handleOpenPlanEditor(plan)`** → 打开编辑表单弹窗
- **`handleUpdatePlan(planId, updates)`** → 直接更新计划字段（如切换状态）

对应地：
- `PlanList` 组件新增 `onUpdatePlan` prop
- 暂停/启动按钮使用 `onUpdatePlan(plan.id, { status })` 调用
- 编辑按钮使用 `onEdit(plan)` 调用

## 测试结果

✅ **备份恢复管理中心测试：103 passed (103)**

所有单元测试全部通过！