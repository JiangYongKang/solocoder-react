toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
先读取相关文件了解当前代码状态：

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\seat-selection\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\seat-selection\seatSelectionCore.js
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
**修复 1：超时释放后重置 manualFallback**


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\seat-selection\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
**修复 4（先加纯函数，再修复组件）+ 修复 2：添加人数上限校验纯函数并应用**

先在 `seatSelectionCore.js` 中添加两个纯函数：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\seat-selection\seatSelectionCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
现在更新 `index.jsx` 组件，导入新函数并应用：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\seat-selection\index.jsx
          
changes: undefined
          
**修复 2：手动逐个选座模式应用人数上限校验**







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\seat-selection\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
**修复 3：确认选座时 lockedIds 数据不一致**

使用 `mergeLockedIds` 纯函数先计算出最新值，再用于 setState 和 saveSeatState，确保两个调用使用同一来源：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\seat-selection\index.jsx
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\seat-selection\index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
**修复 5：补充单元测试**







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\seat-selection\seatSelectionCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\seat-selection\seatSelectionCore.test.js
          
changes: undefined
          
现在在文件末尾添加新的测试用例：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\seat-selection\seatSelectionCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\seat-selection\seatSelectionCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
**验证：运行测试和 lint**

        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/seat-selection/seatSelectionCore.test.js undefined
          
全部 122 个测试通过。现在运行 lint：








        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/seat-selection/index.jsx src/pages/seat-selection/seatSelectionCore.js src/pages/seat-selection/constants.js undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
## 修复完成，4 个问题全部解决

### 修复详情

**1. 超时释放后 manualFallback 未重置** ([index.jsx#L90-L101](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/seat-selection/index.jsx#L90-L101))

- 在 `handleTimeout` 中添加 `setManualFallback(false)`
- 超时释放座位后，用户重新开始选座时会恢复自动匹配相邻座位的逻辑

**2. 手动逐个选座模式无人数上限校验** ([seatSelectionCore.js#L419-L452](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/seat-selection/seatSelectionCore.js#L419-L452))

新增 2 个纯函数：
- `canAddSeat(selectedIds, personCount)`：判断是否可以添加新座位，单人模式始终允许，多人模式按 `personCount` 校验上限
- `handleManualSeatClick(grid, row, col, personCount, selectedIds)`：手动逐个选座的完整处理，返回 `isOverLimit` 标志
  - 已选座位可取消（即使超过上限）
  - 可选座位在达到上限时返回 `isOverLimit: true`

组件中应用：将单人/手动分支替换为调用 `handleManualSeatClick`，超出上限时提示 `"当前双人模式，最多选择2个座位"`

**3. 确认选座时 lockedIds 数据不一致** ([index.jsx#L227-L251](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/seat-selection/index.jsx#L227-L251), [seatSelectionCore.js#L444-L452](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/seat-selection/seatSelectionCore.js#L444-L452))

- 新增纯函数 `mergeLockedIds(prevLockedIds, newLockedIds)`：合并两个数组并去重，返回新数组
- `handleConfirm` 中先通过 `mergeLockedIds(lockedIds, selectedIds)` 计算出单一来源的 `mergedLockedIds`
- `setLockedIds(mergedLockedIds)` 和 `saveSeatState({ lockedIds: mergedLockedIds })` 使用同一变量

### 新增测试（19 个）

- **canAddSeat**（7 个）：单人模式始终允许、双人模式限 2 个、三人模式限 3 个、非数组参数
- **handleManualSeatClick**（7 个）：正常选座、超上限阻止、上限内可取消、锁定/不可用不处理、空座格容错、不修改原网格、三人模式逐步加到上限
- **mergeLockedIds**（6 个）：合并去重、prev 非数组、new 非数组、双非数组、返回新引用、空数组处理

### 验证结果

- ✅ **122 个测试全部通过**（较上次新增 19 个）
- ✅ **ESLint 检查通过**（座位选座相关文件零错误）