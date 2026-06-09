好的，我来修复防抖定时器的清理问题。让我创建任务列表并开始修复：




        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
让我先查看组件中已有的 useEffect 位置：







        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/image-editor/index.jsx
          
现在添加组件卸载时清理定时器的 useEffect：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: /Users/vincent/GoletaLab/solocoder-react/src/pages/image-editor/index.jsx
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm test -- src/pages/__tests__/image-editor/ undefined
          
60 个测试全部通过！现在运行 lint 检查：









        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
lint 检查全部通过！现在启动 dev 服务器验证页面：













        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: running
          
command: cd /Users/vincent/GoletaLab/solocoder-react && npm run dev undefined
          
Dev 服务器启动成功！现在打开页面验证：










        
            
toolName: open_preview
            
status: success
          
预览
          
页面没有任何错误！让我检查终端确认一切正常：














        
            
toolName: check_command_status
            
status: success
          
          
终端没有任何错误输出。让我完成任务：
















        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
所有问题已修复完成！

## 🔧 修复内容

在 [index.jsx#L607-L613](file:///Users/vincent/GoletaLab/solocoder-react/src/pages/image-editor/index.jsx#L607-L613) 添加了组件卸载清理逻辑：

```jsx
useEffect(() => {
  return () => {
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current)
    }
  }
}, [])
```

这个空依赖数组的 `useEffect` 会在组件卸载时执行 cleanup 函数，确保用户在调节滤镜滑块后、500ms 防抖期间离开页面时，定时器被正确清理，避免在已卸载组件上触发 `setHistory()` 造成的无意义状态更新和内存泄漏。

---

## ✅ 验证结果

| 项目 | 结果 |
|------|------|
| 单元测试 | **60/60 全部通过** |
| Lint 检查 | 所有 image-editor 相关文件 **0 错误** |
| 页面访问 | 页面正常加载，无浏览器报错 |

Dev 服务器已运行在 **http://localhost:5175/image-editor** ，可直接访问验证。