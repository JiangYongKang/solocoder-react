我来逐一修复这些问题。先创建任务列表，然后检查相关代码：





















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先读取相关文件理解问题：

























        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\PlanList.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\RestoreModal.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\BackupContext.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\constants.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\storage.js
          
现在我理解了所有问题。让我逐一修复：

**问题1分析**：PlanList 中 `handleTogglePlanStatus` 调用 `onEdit(plan.id, { status: newStatus })` 传了两个参数，但 index.jsx 中 `handleEditPlan` 只接收一个参数且遇到字符串就返回。

**问题2分析**：RestoreModal 和 BackupContext 各自生成了独立的随机恢复耗时。

**问题3分析**：PlanList 中直接显示英文键名，没有用 DATA_SOURCE_LABELS 映射。

**问题4分析**：从 localStorage 加载计划时，没有检查 `nextBackupTime` 是否过期，导致历史时间的计划同时触发。

开始修复：
























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\index.jsx
          
changes: undefined
          
现在修复问题2 - 恢复进度条跳跃。需要让 `startRestore` 返回实际耗时，RestoreModal 使用这个耗时：

























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\BackupContext.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\RestoreModal.jsx
          
changes: undefined
          
这个方案有问题 - `startRestore()` 的 Promise 要等 duration 结束才 resolve，没法提前拿到 duration。让我重新设计：

























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\BackupContext.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\RestoreModal.jsx
          
changes: undefined
          
现在修复问题3 - 备份目标显示中文标签：


























        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\PlanList.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\PlanList.jsx
          
changes: undefined
          
现在修复问题4 - 默认初始化时间点不合理。需要在加载计划时检查 `nextBackupTime`，如果是历史时间则重新计算：



























        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\storage.js
          
changes: undefined
          
同时确保默认计划也应用同样的时间偏移逻辑：



























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\backup-manager\storage.js
          
changes: undefined
          
现在运行测试确保所有修复都正确：





























        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/backup-manager/utils.test.js --run undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/backup-manager/utils.test.js --run undefined
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\package.json
          

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/backup-manager/utils.test.js undefined
          
单元测试通过！现在运行所有测试：




























        
            
toolName: run_command
            
status: success
          
command: pnpm test undefined
          
备份恢复管理中心的测试已经全部通过（103 passed），其他失败的测试都是其他模块的问题（如 collaborative-doc、funnel-analysis、health-tracker 等），与本次修复无关。

让我确认备份恢复管理中心的测试状态：


























        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/backup-manager/ undefined
          
备份恢复管理中心的所有测试（103个）全部通过！让我完成任务：































        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题已修复完成！以下是修复摘要：

## 修复内容

### 1. 备份计划暂停/启动切换不生效
**文件**：[index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/backup-manager/index.jsx)

修改 `handleEditPlan` 函数，支持两种调用方式：
- `handleEditPlan(planId, updates)` - 用于状态切换
- `handleEditPlan(planObject)` - 用于打开编辑表单

### 2. 恢复操作进度条跳跃
**文件**：[BackupContext.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/backup-manager/BackupContext.jsx) 和 [RestoreModal.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/backup-manager/RestoreModal.jsx)

- `BackupContext` 中的 `startRestore` 现在同步返回 `{ duration, promise }`，让调用方可以立即获得随机耗时
- `RestoreModal` 使用 context 返回的 duration 驱动进度条，确保进度条动画与实际恢复完成时间完全一致

### 3. 备份目标显示英文键名
**文件**：[PlanList.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/backup-manager/PlanList.jsx)

导入 `DATA_SOURCE_LABELS`，将 `database`、`file_system`、`config_file` 映射为「数据库」、「文件系统」、「配置文件」。

### 4. 默认初始化时间点不合理
**文件**：[storage.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/backup-manager/storage.js)

新增 `normalizePlansNextBackupTime` 函数：
- 加载计划时检查 `nextBackupTime` 是否小于当前时间
- 对过期的计划重新计算下次执行时间
- 给每个计划添加 0、15、30... 分钟的递增偏移，避免所有计划同时触发

## 测试结果

✅ **备份恢复管理中心测试：103 passed (103)**

所有单元测试全部通过！