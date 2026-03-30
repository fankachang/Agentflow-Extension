# Quickstart: Agentflow JS 格式化外掛

**Branch**: `002-agentflow-js-formatter` | **Date**: 2026-03-31

---

## 前置需求

| 工具 | 版本 |
|------|------|
| Node.js | 18+ |
| npm | 9+ |
| VS Code | 1.75+ |
| TypeScript | 5.x（開發用） |
| `@vscode/vsce` | 最新版（打包用） |

---

## 開發環境設置

```bash
# 1. 建立外掛專案目錄
mkdir agentflow-js-formatter && cd agentflow-js-formatter

# 2. 安裝依賴
npm install

# 3. 編譯 TypeScript
npm run compile

# 4. 在 VS Code 中按 F5 啟動「Extension Development Host」進行即時測試
```

---

## 執行測試

```bash
npm test
```

測試透過 `@vscode/test-electron` 在獨立 VS Code 實例中執行，涵蓋：
- `customBlockDetector`：自訂語法偵測、佔位符替換與還原
- `documentFormatter`：端到端格式化（含自訂語法、巢狀區塊、語法錯誤情境）
- `blankLineCompressor`：空白行壓縮冪等性

---

## 使用外掛（開發版）

1. 在 VS Code 中按 `F5` 啟動 Extension Development Host。
2. 在 Host 中開啟任意 `.js` 檔案。
3. **儲存時自動格式化**：確認 VS Code 的「預設格式化工具」設為 Agentflow：
   ```jsonc
   // .vscode/settings.json
   {
     "[javascript]": {
       "editor.defaultFormatter": "agentflow.agentflow-js-formatter",
       "editor.formatOnSave": true
     }
   }
   ```
4. **手動格式化**：開啟指令面板（`Ctrl+Shift+P`），執行「Agentflow: Format Document」。

---

## 打包為 `.vsix`

```bash
# 安裝打包工具（若尚未安裝）
npm install -g @vscode/vsce

# 打包（使用 npm script，自動帶 --allow-missing-repository）
npm run package

# 或直接執行
vsce package --allow-missing-repository
```

**打包產物**：`agentflow-js-formatter/agentflow-js-formatter-0.1.0.vsix`（約 2.12 MB，含 prettier）

> 打包內容包含：`out/src/`（編譯後的外掛程式碼）、`node_modules/prettier/`（格式化引擎）、`package.json`；  
> 不含：`src/`、`test/`、`tsconfig.json` 等開發專用檔案。

---

## 安裝 `.vsix`

1. 在 VS Code 中開啟指令面板（`Ctrl+Shift+P`）。
2. 執行「Extensions: Install from VSIX...」。
3. 選取 `agentflow-<version>.vsix` 檔案。
4. 重新載入 VS Code 後即可使用。

---

## 關鍵設計說明

### 格式化流程
```
原始文字
  → 自訂區塊偵測（{KEY:\n...}）並以佔位符替換
  → Prettier 格式化剩餘合法 JS
  → 還原自訂區塊
  → 壓縮多餘空白行
  → 輸出
```

### 自訂語法識別規則
- 獨立成行（行首或前方只有空白）
- 符合 `{<鍵名>:` 後接換行（鍵名為任意非換行非 `}` 字元，含空白、中文等）
- 不在字串或註解的上下文中
- 區塊結尾以大括號深度計數（配對 `}` 使深度歸零）

### 錯誤處理
- 若 Prettier 拋出語法錯誤，格式化操作放棄，文件內容不更動，VS Code 顯示錯誤通知。
