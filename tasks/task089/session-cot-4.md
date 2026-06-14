我来修复 PieChart.jsx 中的随机性问题，改为确定性的计算规则。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey-analysis\PieChart.jsx
          
找到了问题所在。第 107 行使用了 `Math.random()` 来处理 dx=0 的情况。我将改为基于扇区索引的确定性规则：当 dx=0 时，根据两个标签在扇区中的原始角度位置来决定推开方向（左边的标签往左推，右边的标签往右推）。


        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey-analysis\PieChart.jsx
          
changes: undefined
          
现在修复第二个问题：`calculateRatingStats` 中使用内联中位数计算，应统一改为调用 `median` 函数：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey-analysis\surveyAnalysisCore.js
          
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\survey-analysis\surveyAnalysisCore.js
          
好的，这段代码在之前已经被修改过了，已经在使用 `median` 函数了。让我确认 median 函数的定义位置在 calculateRatingStats 之前还是之后。如果在之后，可能会有提升问题：



        
            
toolName: search_by_regex
            
status: success
          
query: export function (median|calculateRatingStats|calculateDurationDistribution)
          
median 函数定义在第 248 行，但在第 172 行被调用了。JavaScript 中函数声明会提升（hoisting），所以如果 `median` 是 `export function median()` 形式的函数声明，应该是可以的。让我确认它确实是函数声明形式，而不是变量赋值形式：

从 grep 结果看，确实是 `export function median(...)` 的函数声明形式，hoisting 会生效。所以现在代码已经是正确的了。

现在让我运行测试：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react ; pnpm run test 2>&1 undefined
          
所有 102 个测试文件、7802 个测试全部通过！



        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复，以下是修复总结：

## 修复内容

### 1. PieChart 标签位置确定性规则修复
**文件**: [PieChart.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey-analysis/PieChart.jsx#L104-L134)

**问题**: 当两个标签在 X 轴重叠（dx=0）时，使用 `Math.random()` 选择推开方向，导致同一组数据每次渲染标签位置随机抖动。

**修复方案**: 替换为确定性的角度计算规则：
- **dx=0 处理**: 计算两个标签相对于圆心的极角，取角度差（归一化到 [-π, π]），根据差值的正负决定水平推开方向（正→右推，负→左推）
- **dy=0 处理**: 取两个标签极角的平均值，根据其正弦值的符号决定垂直推开方向（上半部分→上推，下半部分→下推）
- 这样对于相同输入数据，标签布局完全确定，不再有随机性。

### 2. calculateRatingStats 统一中位数调用
**文件**: [surveyAnalysisCore.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey-analysis/surveyAnalysisCore.js#L171-L173)

**状态**: 该修复在之前的迭代中已完成，`calculateRatingStats` 已使用独立的 `median()` 函数替换了内联计算代码，与 `calculateDurationDistribution` 保持统一。`median` 函数使用 `export function` 声明形式，利用 JavaScript 函数声明提升（hoisting）在定义前被安全调用。

### 3. 交叉分析同题支持修复（上一轮）
**文件**: [index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/survey-analysis/index.jsx#L86-L93)

移除了 `rowQId === colQId` 的 `return null` 守卫，允许用户对同一多选题做交叉分析（此时对角线为该选项被选中的次数）。仅当存在多个可选题目时才显示提醒信息，矩阵照常渲染。

## 测试结果
```
Test Files  102 passed (102)
     Tests  7802 passed (7802)
```

所有 102 个测试文件、7802 个测试用例全部通过。