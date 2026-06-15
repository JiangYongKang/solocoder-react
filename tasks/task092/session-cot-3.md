我来分析并修复这个问题。首先查看相关代码：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\wikiUtils.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\SearchResults.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\index.jsx
          
现在我理解了问题。最好的解决方案是让每个搜索结果对象携带当时用于匹配的关键词，这样点击结果时高亮的关键词就和该结果实际匹配的一致。

让我修复：

**第一步**：修改 `searchAllPages`，在结果中添加 `matchedKeyword` 字段：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\wikiUtils.js
          
changes: undefined
          
**第二步**：修改 `handleSelectSearchResult`，使用 `result.matchedKeyword` 而不是 `globalSearchQuery`：




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\wiki\index.jsx
          
changes: undefined
          
**第三步**：更新 todo 并补充单元测试，然后运行所有测试：








        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
先补充测试用例，确保 `matchedKeyword` 字段正确返回：






        
            
toolName: search_by_regex
            
status: success
          
query: 结果应该包含空间名称
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\__tests__\wiki\wikiUtils.test.js
          
changes: undefined
          
现在运行测试：








        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/wiki/wikiUtils.test.js undefined
          
所有 115 个测试都通过了！让我更新 todo 列表：










        
            
toolName: todo_write
            
status: success
          
Todos updated: 2 items
          
## ✅ 问题已修复完成！

### 🔧 修复内容

**问题根因**：点击搜索结果时，`handleSelectSearchResult` 使用的是搜索框**当前实时内容** `globalSearchQuery`，而非该结果在**执行搜索时匹配的关键词**。当用户在打开搜索结果浮层后修改了搜索框文本（比如从 "React" 改成 "Vue"），再点击之前的 React 相关结果，页面会错误高亮 "Vue"。

---

### 修改的文件

#### 1. [wikiUtils.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wiki/wikiUtils.js#L605-L656)

在 `searchAllPages` 返回的每个搜索结果对象中新增 `matchedKeyword` 字段，保存 trim 后的**原始搜索关键词**（搜索执行时的快照），与搜索结果绑定在一起：

```javascript
const originalKw = keyword.trim()  // 保留搜索时的原始关键词
const kw = originalKw.toLowerCase()

results.push({
  pageId: page.id,
  // ... 其他字段
  matchedKeyword: originalKw,  // ← 新增：与该结果绑定的关键词
})
```

#### 2. [index.jsx](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/wiki/index.jsx#L167-L172)

修改 `handleSelectSearchResult`，使用结果自身携带的 `matchedKeyword` 而非搜索框当前内容：

```javascript
// 修复前：依赖搜索框实时内容
setActiveSearchKeyword(globalSearchQuery)

// 修复后：使用搜索结果中绑定的关键词
setActiveSearchKeyword(result.matchedKeyword || '')
```

#### 3. [wikiUtils.test.js](file:///c:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/__tests__/wiki/wikiUtils.test.js#L776-L789)

新增 2 个单元测试：
- ✅ 验证每个搜索结果都携带 `matchedKeyword`，且为 trim 后的值
- ✅ 验证不同关键词搜索时，各自结果的 `matchedKeyword` 对应正确的输入

---

### ✅ 验证结果

| 检查项 | 结果 |
|-------|------|
| **单元测试** | 115 个测试 **全部通过** ✅ |