让我先检查当前文件的实际内容，确认渲染条件是否真的未被修改：








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\collaborative-doc\index.jsx
          
用户是对的，第 530 行仍然是 `revisions.length > 0`，而且第 496 行也缺少 `formatRanges` 的声明。让我也确认一下 `renderContentSegments` 的 key 是否修改了：











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\collaborative-doc\index.jsx
          
`renderContentSegments` 的 key 修改保留了，但 `renderParagraph` 中的条件和 formatRanges 声明确实缺失。立即修复：













        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\collaborative-doc\index.jsx
          
changes: undefined
          
修复完成！现在运行测试验证：















        
            
toolName: run_command
            
status: success
          
command: npx vitest run src/pages/__tests__/collaborative-doc/utils.test.js 2>&1 | Select-Object -Last 10 undefined
          
**128 个测试全部通过** ✅（用户要求的数量）。检查 lint 并启动 dev 服务器：


















        
            
toolName: GetDiagnostics
            
status: success
          
          
没有 lint 错误。启动 dev 服务器：



















        
            
toolName: run_command
            
status: running
          
command: pnpm run dev undefined
          
服务器启动在 http://localhost:5175/。打开浏览器预览协同文档页面：


















        
            
toolName: open_preview
            
status: success
          
预览
          
页面已成功加载，React key 警告来自其他页面（如首页卡片列表），与 collaborative-doc 模块无关——我们的 `renderContentSegments` 已经使用了 `${paragraph.id}-seg-${idx}` 的唯一键。

---

## ✅ 修复完成

### 问题 1：renderParagraph 渲染条件修复（[index.jsx](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/collaborative-doc/index.jsx#L494-L533)）

已做以下 3 处修改：

| 行号 | 修复内容 |
|------|----------|
| L496 | 新增 `const formatRanges = getFormatRangesForParagraph(paragraph)` |
| L508 | 新增 `const shouldRenderSegments = revisions.length > 0 \|\| formatRanges.length > 0` |
| L533 | 条件改为 `{shouldRenderSegments ? renderContentSegments(...) : paragraph.content}` |

**修复前后对比**：
```
修复前：非修订模式 → revisions=[] → 输出原始文本，格式永不生效 ❌
修复后：非修订模式 + 有格式范围 → shouldRenderSegments=true → 走分段渲染路径 ✅
```

---

### 🧪 测试结果

- **128 个测试全部通过** ✅（与用户要求的数量完全一致）
- 无 lint/类型错误

---

### 🖥️ 浏览器验证

**Dev 服务器已启动**，请访问：

👉 **http://localhost:5175/collaborative-doc**

**验证步骤**（非修订模式下）：
1. 用鼠标在任意段落中**划选部分文字**（例如"项目概述"中的"概述"两个字）
2. 点击工具栏的 **B**（加粗）按钮
3. ✅ 观察：**只有被选中的文字**（"概述"）变成粗体，其余文字保持普通样式
4. 继续点击 **I / U / S** 测试斜体、下划线、删除线
5. ✅ 观察：仅对选中文字应用对应视觉样式