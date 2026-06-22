让我阅读相关文件以了解这两个问题的当前状态。
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\index.jsx
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\addressData.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: 510000_extra
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\addressData.js
          
我现在清楚地看到了这两个问题。让我来修复它们：

**问题1**：`showSearch` 仅在 `onFocus` 时被设置为 `true`，因此当用户开始输入内容时，下拉菜单不会出现，因为输入框已经处于焦点状态。解决方案是：当 `searchKeyword` 更改且有结果时，也自动显示下拉菜单。

**问题2**：第1607行的 `'510000_extra': null` 是无效的残留数据。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\index.jsx
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\addressData.js
          
changes: undefined
          
现在我来验证测试是否仍然通过并且 lint 是否正常：
        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/address-cascade/addressUtils.test.js undefined
          

        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/address-cascade/ undefined
          
这个 lint 规则不允许在 `effect` 中同步调用 `setState`。我需要采取不同的方法——将下拉菜单的可见性从焦点状态派生出来，而不是通过 `effect`。
        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\index.jsx
          
我将用一个 `searchFocused` 状态来替换 `showSearch`，并从 `searchFocused && searchKeyword.trim()` 中推导出下拉菜单的可见性。这完全避免了在 effect 中使用 `setState`，并自然地解决了输入时下拉菜单不显示的问题。
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\index.jsx
          
changes: undefined
          
现在移除有问题的 `useEffect`，并替换点击外部处理程序，同时添加 `showSearch` 派生值：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\index.jsx
          
changes: undefined
          
现在替换点击外部处理器，让它将 `searchFocused` 设置为 `false`，而不是 `showSearch`：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\index.jsx
          
changes: undefined
          
现在更新 `handleSearchSelect` 以设置 `searchFocused` 而不是 `showSearch`：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\index.jsx
          
changes: undefined
          
现在，更新输入框的 `onFocus` 处理器，使其使用 `setSearchFocused`：
        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-3\solocoder-react\src\pages\address-cascade\index.jsx
          
changes: undefined
          
现在让我来验证代码的整洁度：
        
            
toolName: run_command
            
status: success
          
command: npx eslint src/pages/address-cascade/ undefined
          
代码检查通过。我再运行一下测试：
        
            
toolName: run_command
            
status: success
          
command: pnpm test -- src/pages/__tests__/address-cascade/addressUtils.test.js undefined
          
两个问题均已修复，lint 和测试全部通过。

**问题 1 修复** — 搜索下拉不随输入联动：

将原来的 `showSearch` 状态改为从 `searchFocused` 和 `searchKeyword` **派生计算**：

```js
const showSearch = searchFocused && searchKeyword.trim().length > 0
```

- `onFocus` → `setSearchFocused(true)`
- 点击搜索框外部 → `setSearchFocused(false)`
- 选择搜索结果 → `setSearchFocused(false)`

这样当用户在搜索框中输入内容时，因为输入框天然处于聚焦状态，`searchFocused` 为 `true`，`searchKeyword` 非空后 `showSearch` 自动变为 `true`，下拉列表立即出现。同时移除了之前在 `useEffect` 中调用 `setState` 的写法，符合 React Compiler lint 规则。

**问题 2 修复** — 移除了 [addressData.js](file:///C:/Users/vince/GoletaLab/SoloCoder-3/solocoder-react/src/pages/address-cascade/addressData.js#L1607) 末尾的无效数据条目 `'510000_extra': null`。