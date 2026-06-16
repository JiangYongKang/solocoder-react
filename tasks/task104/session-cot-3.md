toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
**修复 1：修正 `calculateStreakBonus` 为固定加分**

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\idiom-chain\idiomCore.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
**修复 2：更新单元测试用例**


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\idiom-chain\idiomCore.test.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
**修复 3：运行测试验证**


        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm vitest run src/pages/__tests__/idiom-chain/ undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
残留问题已修复完毕，80 个测试全部通过 ✅

---

## 修改汇总

### 1. `calculateStreakBonus` 固定加分 — [idiomCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/idiom-chain/idiomCore.js#L232-L235)
- **之前**：累进倍数公式 `(currentStreak + 1) * WIN_STREAK_BONUS`（10 连胜奖励 55 分，分数膨胀）
- **之后**：固定加分 `WIN_STREAK_BONUS`（每次获胜固定加 5 分，与常命名 BONUS 语义一致）

### 2. 测试用例同步更新 — [idiomCore.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/idiom-chain/idiomCore.test.js#L608-L640)
- 移除了 `(currentStreak + 1) * WIN_STREAK_BONUS` 的累进测试
- 新增「无论连胜多少场，奖励分都相同」的断言测试
- 保留并强化了 `WIN_STREAK_BONUS` 常量值匹配的验证

### 3. 验证结果
- **Test Files**: 1 passed
- **Tests**: 80 passed (80)
- **Duration**: 296ms