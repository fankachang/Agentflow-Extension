# Agentflow JS Formatter

> VS Code 外掛｜自動格式化 `.js` 檔案，同時保留 `{KEY:\n}` 自訂語法區塊

[![VS Code Engine](https://img.shields.io/badge/VS%20Code-%5E1.75.0-blue)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

---

## 功能特色

| 功能 | 說明 |
|------|------|
| 🎯 **儲存時自動格式化** | 儲存 `.js` 檔案時自動套用 Prettier 格式化規則 |
| 🔒 **保留自訂語法** | `{KEY:\n...\n}` 形式的自訂區塊完整保留，鍵名不被加引號或拆行 |
| 🗜️ **壓縮多餘空白行** | 連續三行以上空白行壓縮為一行空白行 |
| ⌨️ **手動格式化指令** | 可從指令面板執行「Agentflow: Format Document」 |
| 📦 **離線安裝** | 打包為 `.vsix` 供無網路環境安裝 |

---

## 快速開始

### 安裝（從 VSIX）

1. 下載 `agentflow-js-formatter-<版本>.vsix`
2. 開啟 VS Code 指令面板（`Ctrl+Shift+P` / `Cmd+Shift+P`）
3. 執行「**Extensions: Install from VSIX...**」
4. 選取下載的 `.vsix` 檔案，重新載入後即可使用

### 啟用儲存時自動格式化

在工作區的 `.vscode/settings.json` 中加入：

```jsonc
{
  "[javascript]": {
    "editor.defaultFormatter": "agentflow.agentflow-js-formatter",
    "editor.formatOnSave": true
  }
}
```

### 手動格式化

開啟任意 `.js` 檔案，按 `Ctrl+Shift+P`，搜尋並執行：

```
Agentflow: Format Document
```

---

## 自訂語法說明

Agentflow 外掛能識別並保護以下格式的自訂區塊：

```js
{初始化:
  doSomething();
  setupEnv();
}

{ALL:
  runAllSteps();
}
```

### 識別規則

- 該行**獨立成行**（行首或前方只有空白）
- 格式為 `{<鍵名>:` 後接換行（鍵名可包含任意字元：中文、英文、數字、空白）
- 不在字串字面值（`"..."`、`'...'`、`` `...` ``）或註解（`//`、`/* */`）內

### 保護行為

- `{KEY:` 整行不被拆行或重排
- 鍵名不被加引號
- 區塊內部內容完整保留（不套用 AST 格式化）
- 區塊以外的程式碼套用完整 Prettier 格式化

### 普通 JS 物件不受影響

```js
// 這是合法 JS 物件，仍依標準規則格式化（冒號後不換行）
const obj = { key: "value" };
```

---

## 格式化規則

外掛以 [Prettier](https://prettier.io/) 作為 JS 格式化引擎，遵循以下規則：

- **縮排**：依照 VS Code 當前 `editor.tabSize` 設定
- **引號**：雙引號（`"`）
- **分號**：保留行尾分號
- **空白行**：連續三行以上壓縮為一行空白行

---

## 錯誤處理

| 情境 | 行為 |
|------|------|
| `.js` 以外的檔案執行格式化指令 | 顯示提示訊息「僅支援 .js 檔案」 |
| 檔案包含語法錯誤 | 放棄格式化，顯示錯誤通知，檔案內容不變 |
| 格式化操作被取消 | 立即中止，不修改檔案 |

---

## 開發指南

### 環境需求

| 工具 | 版本 |
|------|------|
| Node.js | 18+ |
| npm | 9+ |
| VS Code | 1.75+ |

### 建置與測試

```bash
# 進入外掛目錄
cd agentflow-js-formatter

# 安裝依賴
npm install

# 編譯 TypeScript
npm run compile

# 執行測試
npm test

# 打包為 .vsix
npm run package
```

### 在開發模式中執行

1. 以 VS Code 開啟 `agentflow-js-formatter/` 目錄
2. 按 `F5` 啟動「Extension Development Host」
3. 在 Host 視窗開啟 `.js` 檔案並測試

### 專案結構

```
agentflow-js-formatter/
├── src/
│   ├── extension.ts                  # 外掛進入點（activate / deactivate）
│   ├── types.ts                      # 共用型別定義
│   ├── formatter/
│   │   ├── documentFormatter.ts      # 格式化流程協調器
│   │   ├── customBlockDetector.ts    # {KEY:} 自訂語法偵測與佔位符替換
│   │   ├── jsFormatter.ts            # Prettier 封裝
│   │   └── blankLineCompressor.ts    # 多餘空白行壓縮
│   └── commands/
│       └── formatDocument.ts         # 手動格式化指令處理器
├── test/
│   ├── suite/
│   │   ├── blankLineCompressor.test.ts
│   │   ├── customBlockDetector.test.ts
│   │   ├── documentFormatter.test.ts
│   │   └── index.ts
│   ├── perf/
│   │   └── formatPerf.ts             # 效能驗收腳本（1000 行 ≤ 500ms）
│   └── runTests.ts                   # 測試啟動器
├── package.json
├── tsconfig.json
└── .vscodeignore
```

---

## 技術架構

格式化流程採用**分段替換策略**，確保自訂語法完整保留：

```
原始文字
  ↓ CustomBlockDetector.extract()   → 自訂區塊替換為佔位符
extractedText（合法 JS）
  ↓ JsFormatter.format()            → Prettier 格式化
prettifiedText
  ↓ CustomBlockDetector.restore()   → 還原自訂區塊
restoredText
  ↓ BlankLineCompressor.compress()  → 壓縮多餘空白行
最終輸出
```

---

## License

MIT
