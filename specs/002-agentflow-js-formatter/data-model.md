# Data Model: Agentflow JS 格式化外掛

**Branch**: `002-agentflow-js-formatter` | **Date**: 2026-03-31

本文件定義外掛核心格式化流程中涉及的資料結構與實體，不含實作細節。

---

## 核心實體

### `CustomBlock`

代表從 `.js` 文件中識別出的一個 `{KEY:\n...\n}` 自訂語法區塊。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `index` | `number` | 區塊的序號（0-based），用於佔位符對應 |
| `startLine` | `number` | 區塊起始行號（0-based），即 `{KEY:` 所在行 |
| `endLine` | `number` | 區塊結束行號（0-based），即配對 `}` 所在行 |
| `originalText` | `string` | 區塊的完整原始文字（含起始行與結束行） |
| `placeholder` | `string` | 取代此區塊的佔位符字串（如 `"__AGENTFLOW_BLOCK_0__"`） |

**不變量**：  
- `endLine >= startLine`  
- `placeholder` 在同一份文件中唯一  
- `originalText` 必定以 `{<鍵名>:\n` 開頭，以 `}` 結尾

---

### `FormattingContext`

封裝單次格式化操作的輸入與設定。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `sourceText` | `string` | 待格式化的 `.js` 文件完整文字 |
| `tabSize` | `number` | 來自 `DocumentFormattingOptions.tabSize` 的縮排大小 |
| `insertSpaces` | `boolean` | 來自 `DocumentFormattingOptions.insertSpaces`，`true` 表示使用空格 |

---

### `FormattingResult`

封裝單次格式化操作的結果。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `success` | `boolean` | 格式化是否成功完成 |
| `formattedText` | `string \| null` | 格式化後的完整文字；若 `success === false` 則為 `null` |
| `error` | `Error \| null` | 失敗時的錯誤物件；成功時為 `null` |

---

## 狀態轉換

格式化流程中 `sourceText` 經歷的狀態序列：

```
sourceText
  ↓ [CustomBlockDetector] 識別所有 CustomBlock，以 placeholder 替換
extractedText（含佔位符的合法 JS 文字）
  ↓ [JsFormatter（Prettier）] 格式化
prettifiedText（格式化後，佔位符仍在）
  ↓ [CustomBlockDetector] 將 placeholder 替換回 originalText
restoredText（格式化後 + 自訂區塊已還原）
  ↓ [BlankLineCompressor] 壓縮多餘空白行
formattedText（最終輸出）
```

---

## 驗證規則

### `CustomBlock` 識別條件
1. 掃描時不處於字串字面值（`'...'`、`"..."`、`` `...` ``）或註解（`//`、`/* */`）上下文中。
2. 當前行符合正規表示式：`/^[\t ]*\{[^}\n]+:\s*$/`（行首可有空白，`{` 後有一或多個非 `}` 非換行字元，以 `:` 加可選空白結尾）。
3. 以大括號深度計數追蹤結束邊界：初始深度 1，遇 `{` 加 1，遇 `}` 減 1，歸零時即為區塊結尾行。

### 冪等性
- `format(format(x)) === format(x)`，由下列特性保證：
  - Prettier 本身冪等。
  - 空白行壓縮為冪等操作。
  - 自訂區塊內容在格式化過程中完全透明傳遞，不會被修改。
