# Formatter API Contract

**Branch**: `002-agentflow-js-formatter` | **Date**: 2026-03-31  
**Type**: VS Code Extension Public Interface

本文件定義 Agentflow 外掛對外暴露給 VS Code 的契約，以及內部模組之間的介面契約。

---

## 1. VS Code Extension Contract

### 外掛 ID 與元資料

| 欄位 | 值 |
|------|-----|
| Extension ID | `agentflow.agentflow-js-formatter` |
| Display Name | `Agentflow JS Formatter` |
| Activation Event | `onLanguage:javascript` |
| VS Code Engine | `^1.75.0` |

### 貢獻點（`package.json` contributes）

#### 格式化提供者
```json
{
  "languages": [{ "id": "javascript" }]
}
```
透過 `vscode.languages.registerDocumentFormattingEditProvider` 以程式化方式於 `activate()` 中註冊，語言 ID 為 `javascript`。

#### 指令
| 指令 ID | 顯示名稱 | 觸發方式 |
|---------|---------|---------|
| `agentflow.formatDocument` | `Agentflow: Format Document` | 指令面板 |

### `provideDocumentFormattingEdits` 行為契約

**輸入**：
- `document: TextDocument`（語言 ID 必為 `javascript`）
- `options: FormattingOptions`（包含 `tabSize`、`insertSpaces`）
- `token: CancellationToken`

**輸出**：
| 情境 | 回傳值 |
|------|--------|
| 格式化成功 | `[TextEdit.replace(fullDocumentRange, formattedText)]` |
| 文件無需修改（已是格式化狀態） | `[]` |
| 格式化失敗（語法錯誤） | `[]` + 呼叫 `vscode.window.showErrorMessage()` |

**不得**：
- 拋出 uncaught exception（應由外掛內部 catch 後回傳 `[]`）。
- 修改任何非當前文件的資源。
- 在 `token.isCancellationRequested` 為 `true` 時繼續執行耗時操作。

---

## 2. 內部模組介面契約

### `CustomBlockDetector`

```typescript
interface CustomBlockDetector {
  /**
   * 掃描原始文字，識別所有自訂語法區塊。
   * 回傳按出現順序排列的 CustomBlock 陣列。
   */
  detect(sourceText: string): CustomBlock[];

  /**
   * 將 sourceText 中的所有自訂語法區塊替換為佔位符。
   * 回傳 { extractedText, blocks }。
   */
  extract(sourceText: string): { extractedText: string; blocks: CustomBlock[] };

  /**
   * 將 extractedText 中的佔位符還原為原始區塊內容。
   * blocks 必須與 extract() 回傳的 blocks 一致。
   */
  restore(extractedText: string, blocks: CustomBlock[]): string;
}
```

**後置條件**：
- `restore(extract(text).extractedText, extract(text).blocks)` 中不含佔位符字串。
- 若 `text` 不含自訂語法，`detect(text)` 回傳空陣列，`extract(text).extractedText === text`。

---

### `JsFormatter`

```typescript
interface JsFormatter {
  /**
   * 以 Prettier 格式化合法的 JavaScript 文字。
   * @throws SyntaxError 若 sourceText 包含無法解析的語法錯誤。
   */
  format(sourceText: string, options: { tabSize: number; insertSpaces: boolean }): Promise<string>;
}
```

---

### `BlankLineCompressor`

```typescript
interface BlankLineCompressor {
  /**
   * 將文字中連續兩行以上的空白行壓縮為恰好一行空白行。
   * 為純同步操作。
   */
  compress(text: string): string;
}
```

**後置條件**：
- `compress(compress(text)) === compress(text)`（冪等）。
- 結果文字中不存在連續三個以上換行符（`\n\n\n`）。

---

### `DocumentFormatter`

```typescript
interface DocumentFormatter {
  /**
   * 對 FormattingContext 執行完整格式化流程，回傳 FormattingResult。
   * 不得拋出例外；所有錯誤封裝於 FormattingResult.error。
   */
  format(context: FormattingContext): Promise<FormattingResult>;
}
```
