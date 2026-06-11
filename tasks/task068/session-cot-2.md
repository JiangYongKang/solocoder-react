我来修复 ValidationStep 组件中的这几个问题。让我先查看当前代码，然后逐一修复。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\data-importer\components\ValidationStep.jsx
          
现在我清楚地看到了所有问题。让我一次性修复它们：



        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\data-importer\components\ValidationStep.jsx
          
changes: undefined
          
修复完成！现在运行测试确保所有测试通过：





        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test -- src/pages/__tests__/data-importer/dataImporterUtils.test.js undefined
          
所有 92 个测试全部通过！让我再检查一下修改后的文件是否有诊断错误：









        
            
toolName: GetDiagnostics
            
status: success
          
          
没有任何诊断错误，完美！







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复完成！以下是修改的详细内容：

## 修复内容

### 修改文件：[ValidationStep.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/data-importer/components/ValidationStep.jsx)

#### 1. ✅ 清理未使用的 import
```jsx
// 修复前（第3行）
import { validateAllRows, validateRow, findDuplicateRows } from '../utils.js'

// 修复后
import { validateAllRows } from '../utils.js'
```

#### 2. ✅ useMemo 中副作用移至 useEffect
```jsx
// 修复前 - useMemo 中执行副作用（反模式）
const validationResult = useMemo(() => {
  const result = validateAllRows(localData, TARGET_FIELDS)
  onValidatedDataChange(result)  // ❌ 副作用不应该在 useMemo 中
  return result
}, [localData, onValidatedDataChange])

// 修复后 - useMemo 只做纯计算
const validationResult = useMemo(() => {
  return validateAllRows(localData, TARGET_FIELDS)
}, [localData])

// 副作用移至 useEffect
useEffect(() => {
  onValidatedDataChange(validationResult)
}, [validationResult, onValidatedDataChange])
```

#### 3. ✅ localData 与 mappedData prop 同步
```jsx
// 新增 useEffect 监听 mappedData 变化
useEffect(() => {
  setLocalData(mappedData)
}, [mappedData])
```

这样当用户回到字段映射步骤修改映射关系后，重新进入校验步骤时，表格数据会自动刷新为最新的映射结果。

---

## ✅ 验证结果
- **单元测试**：92 个测试用例全部通过 ✅
- **代码诊断**：无任何 lint/type 错误 ✅