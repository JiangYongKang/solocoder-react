这是一个简单的测试补充任务。我先读取现有测试文件，然后添加 selectedIds 数量超过 personCount 上限的测试用例。

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\seat-selection\seatSelectionCore.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\seat-selection\seatSelectionCore.test.js
          
changes: undefined
          
现在运行测试验证：



        
            
toolName: run_command
            
status: success
          
command: pnpm test src/pages/__tests__/seat-selection/seatSelectionCore.test.js undefined
          
全部 124 个测试通过。

## 修复完成

补充了 `canAddSeat` 函数在 selectedIds 数量**超过** personCount 上限时的边界测试。

### 新增测试用例（2 个）

在 [seatSelectionCore.test.js#L892-L895](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/seat-selection/seatSelectionCore.test.js#L892-L895) 和 [seatSelectionCore.test.js#L907-L910](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/seat-selection/seatSelectionCore.test.js#L907-L910)：

- **双人模式超出上限**：`selectedIds` 包含 3 个或 4 个座位 ID 时返回 `false`
- **三人模式超出上限**：`selectedIds` 包含 4 个或 5 个座位 ID 时返回 `false`

### 验证结果

- ✅ **124 个测试全部通过**（新增 2 个）