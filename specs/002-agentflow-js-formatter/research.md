# Research: Agentflow JS 格式化外掛

**Branch**: `002-agentflow-js-formatter` | **Date**: 2026-03-31

---

## 1. VS Code DocumentFormattingEditProvider

### Decision
使用 `vscode.languages.registerDocumentFormattingEditProvider` 將外掛註冊為 `.js` 格式化提供者，返回 `TextEdit[]`。

### Rationale
- 這是 VS Code 官方格式化整合方式，自動銜接指令面板「格式化文件」與 on-save 觸發。
- `options.tabSize` 與 `options.insertSpaces` 由 VS Code 傳入，外掛無需自行讀取設定。
- 回傳 `[TextEdit.replace(fullRange, formattedText)]` 即可完整替換文件內容。

### Alternatives Considered
- 直接監聽 `onDidSaveTextDocument` 事件並呼叫 `editor.edit()`：需額外處理與其他格式化工具的衝突，且無法在指令面板中「選擇格式化工具」，捨棄。

---

## 2. 自訂語法 `{KEY:\n}` 偵測策略

### Decision
採用**分段替換策略（Block Extraction Strategy）**：

1. 以行為單位掃描原始文字，偵測「獨立成行的 `{KEY:\n`」作為區塊起始。
2. 進入區塊後以**大括號深度計數**（初始深度 1，遇 `{` +1、遇 `}` -1，歸零即結束）追蹤區塊邊界。
3. 將每個區塊以唯一佔位符替換（`"__AGENTFLOW_BLOCK_0__"` 等），確保剩餘文字仍為合法 JS。
4. 對剩餘文字執行 Prettier 格式化。
5. 將佔位符替換回原始區塊內容。
6. 空白行壓縮套用於最終結果的全文。

識別條件（正規表示式）：`/^[\t ]*\{[^}\n]+:\s*$/`（行首允許有空白，`{` 後有一或多個非 `}` 非換行字元，最後為 `:` 加可選空白，行尾換行）。

字串與註解排除：偵測器在掃描時同步追蹤是否處於字串（`'`、`"`、`` ` ``）或行/區塊註解（`//`、`/* */`）中，若偵測到 `{KEY:` 時正處於這些上下文中則跳過。

### Rationale
- 佔位符為合法 JS 字串表達式，Prettier 不會報錯。
- 與 AST 解析方式相比，此策略完全回避了自訂語法和標準解析器不相容的問題。
- 逐行掃描效能優異，對數千行檔案的處理時間遠低於 500ms 門檻。

### Alternatives Considered
- **正規表示式直接替換區塊**：無法正確處理巢狀大括號，捨棄。
- **自訂 AST 解析器**：實作複雜度過高，與「避免過度工程」原則相悖，捨棄。
- **以 `prettier` 配合 `babel` plugin 擴充**：Prettier plugin 架構複雜，且無法在 VS Code extension 環境中輕易分發，捨棄。

---

## 3. JS 格式化引擎

### Decision
使用 **`prettier` ^3** 作為 JS 格式化引擎，以程式化 API（`prettier.format(src, options)`）呼叫。

設定：
- `parser: 'babel'`（支援現代 JS 語法）
- `tabWidth`：從 `DocumentFormattingOptions.tabSize` 讀取
- `useTabs`：從 `DocumentFormattingOptions.insertSpaces` 反推
- `semi: true`、`singleQuote: false`（Prettier 預設，確保一致性）

### Rationale
- Prettier 是業界最廣泛使用的 JS 格式化工具，結果可預測且冪等。
- 程式化 API 只需 `await prettier.format()`，整合成本低。
- 支援 `babel` parser，可解析多數現代 JavaScript（ESM、JSX、class fields 等）。

### Alternatives Considered
- **js-beautify**：格式化結果較不一致，冪等性較差，捨棄。
- **ESLint autofix**：以規則為基礎，配置複雜，格式化結果依賴安裝的規則集，捨棄。
- **自製簡易格式化器（縮排重算）**：僅能處理縮排，無法處理空格標準化、括號對齊、分號插入等完整規則，捨棄。

---

## 4. 空白行壓縮

### Decision
在所有格式化步驟完成後，對最終文字執行一次全文正規表示式替換：

```
/\n{3,}/g → \n\n
```

將三個以上連續換行符（即兩個以上空白行）壓縮為恰好兩個換行符（一個空白行）。此步驟套用於**全文**，包含自訂語法區塊內外。

### Rationale
- 純文字操作，不依賴語法解析，效能極佳。
- 在最後一步執行可確保 Prettier 的輸出也被壓縮。
- 規格明確要求此步驟適用於整個檔案。

---

## 5. 語法錯誤處理

### Decision
當 `prettier.format()` 拋出 `SyntaxError`（或任何錯誤）時：
1. 回傳空陣列 `[]`（VS Code 約定：返回空 `TextEdit[]` 表示不修改文件）。
2. 呼叫 `vscode.window.showErrorMessage()` 顯示錯誤通知。

### Rationale
- 安全第一：不修改含有語法錯誤的文件，避免破壞使用者正在編輯的程式碼。
- 符合 FR-011 與 SC-003 的要求。

---

## 6. 打包（`.vsix`）

### Decision
使用 `@vscode/vsce` 工具鏈：
- `package.json` 中設定 `"vsce": { "dependencies": true }` 確保 `prettier` 一併打包。
- `.vscodeignore` 排除 `src/`、`test/`、`node_modules/@vscode/vsce` 等開發用檔案。
- `npm run package`（`vsce package`）產生 `agentflow-<version>.vsix`。

### Rationale
- `vsce` 是 VS Code 官方推薦的打包工具，與 `package.json` 的 `engines.vscode` 欄位完全整合。
- 將 `prettier` 打包進 `.vsix` 可確保離線安裝後無需額外安裝依賴。

---

## 7. 測試策略

### Decision
- **單元測試**：使用 Mocha + `@vscode/test-electron`，針對 `customBlockDetector`、`jsFormatter`、`blankLineCompressor` 各自撰寫獨立測試。
- **整合測試**：透過 `DocumentFormatter` 的端到端輸入/輸出比對，涵蓋含自訂語法、巢狀區塊、語法錯誤等情境。

### Rationale
- 格式化邏輯是純函式（input text → output text），最適合以單元測試覆蓋。
- User Story P1 的驗收情境可直接轉為測試案例。
