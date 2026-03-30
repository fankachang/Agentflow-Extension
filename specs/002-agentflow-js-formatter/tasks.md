# Tasks: Agentflow JS 格式化外掛

**Input**: Design documents from `/specs/002-agentflow-js-formatter/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/formatter-api.md ✅ | quickstart.md ✅

**Organization**: 任務依使用者故事分組，每個故事可獨立實作與測試。

## Format: `[ID] [P?] [Story] 描述`

- **[P]**: 可平行執行（不同檔案，無未完成的相依）
- **[Story]**: 對應使用者故事（US1–US4）
- 描述中包含精確的檔案路徑

---

## Phase 1: Setup（專案初始化）

**Purpose**: 建立 VS Code 外掛專案骨架與設定檔，無任何實作邏輯

- [ ] T001 在 repo 根目錄建立外掛專案目錄結構：`agentflow-js-formatter/src/formatter/`、`agentflow-js-formatter/src/commands/`、`agentflow-js-formatter/test/suite/`
- [ ] T002 建立 `agentflow-js-formatter/package.json`，包含 VS Code extension manifest 必填欄位：`name: "agentflow-js-formatter"`、`publisher: "agentflow"`、`engines.vscode: "^1.75.0"`、`activationEvents: ["onLanguage:javascript"]`、`contributes.languages: [{"id":"javascript"}]`（初始版本；commands 欄位於 T024 補充）
- [ ] T003 [P] 建立 `agentflow-js-formatter/tsconfig.json`，設定 TypeScript 5.x 編譯至 `out/`，啟用 `strict`、`sourceMap`，排除 `out`
- [ ] T004 [P] 建立 `agentflow-js-formatter/.vscodeignore`，排除 `src/`、`test/`、`tsconfig.json`、`.vscode-test/`、`node_modules/@vscode/vsce` 等開發專用檔案，保留 `out/`、`package.json`、`LICENSE`

---

## Phase 2: Foundational（共用基礎建設）

**Purpose**: 所有使用者故事均依賴的共用型別定義與基礎模組；**必須在任何 Phase 3+ 開始前完成**

⚠️ **CRITICAL**: 此階段完成前，所有使用者故事均無法開始

- [ ] T005 在 `agentflow-js-formatter/` 執行 `npm install`，安裝以下依賴：`prettier@^3`（dependencies）；`@types/vscode@^1.75.0`、`@vscode/test-electron`、`typescript@^5`、`mocha`、`@types/mocha`（devDependencies）；確認 `package.json` dependency 區段正確
- [ ] T006 [P] 建立 `agentflow-js-formatter/src/types.ts`，定義三個共用介面：`CustomBlock`（index, startLine, endLine, originalText, placeholder）、`FormattingContext`（sourceText, tabSize, insertSpaces）、`FormattingResult`（success, formattedText, error）
- [ ] T007 [P] 實作 `agentflow-js-formatter/src/formatter/blankLineCompressor.ts`，實作 `BlankLineCompressor` 介面；`compress(text)` 以 `/\n{3,}/g` → `\n\n` 替換所有連續三個以上換行符（純同步操作，不依賴語法解析）
- [ ] T008 [P] 實作 `agentflow-js-formatter/src/formatter/jsFormatter.ts`，實作 `JsFormatter` 介面；以程式化 API 呼叫 `prettier.format(sourceText, { parser: "babel", tabWidth, useTabs, semi: true, singleQuote: false })`；所有例外（不論型別，含 `SyntaxError`、`TypeError` 及 Prettier 內部錯誤）一律向上拋出，由 `DocumentFormatter` 統一捕捉

**Checkpoint**: 共用型別與基礎模組就緒，使用者故事可開始實作

---

## Phase 3: User Story 1 — 儲存時自動格式化（Priority: P1）🎯 MVP

**Goal**: 開發者儲存 `.js` 檔案時，外掛自動套用 JS 格式化（縮排、空格、空白行壓縮），無需額外操作

**Independent Test**: 開啟含有縮排錯誤或多餘空白行的 `.js` 檔案，設定 Agentflow 為預設格式化工具，儲存後驗證內容符合格式化規則，即可獨立測試此功能（不需要任何 `{KEY:` 自訂語法）

### 測試（Test tasks for US1）

- [ ] T009 [P] [US1] 建立 `agentflow-js-formatter/test/suite/index.ts`，設定 Mocha 測試執行器（glob 掃描 `**/*.test.js`），供 `@vscode/test-electron` 啟動
- [ ] T010 [P] [US1] 在 `agentflow-js-formatter/test/suite/blankLineCompressor.test.ts` 撰寫 `BlankLineCompressor` 單元測試：驗證三行以上空白行壓縮為一行、冪等性（`compress(compress(x)) === compress(x)`）、無空白行的文字不變

### 實作（Implementation for US1）

- [ ] T011 [US1] 實作 `agentflow-js-formatter/src/formatter/documentFormatter.ts`，實作 `DocumentFormatter` 介面：（1）呼叫 `JsFormatter.format()`；（2）呼叫 `BlankLineCompressor.compress()`；（3）捕捉所有例外，失敗時回傳 `FormattingResult { success: false, formattedText: null, error }`；此版本尚不含自訂區塊偵測（US2 補充）
- [ ] T012 [US1] 建立 `agentflow-js-formatter/src/extension.ts`，實作 `activate()` — 使用 `vscode.languages.registerDocumentFormattingEditProvider("javascript", provider)` 註冊格式化提供者；`provideDocumentFormattingEdits` 開頭先檢查 `token.isCancellationRequested`，若為 `true` 立即回傳 `[]`；接著從 `options` 取得 `tabSize`、`insertSpaces`，建立 `FormattingContext`，呼叫 `DocumentFormatter.format()`，成功時回傳 `[TextEdit.replace(fullRange, formattedText)]`，失敗時回傳 `[]` 並呼叫 `vscode.window.showErrorMessage()`；實作 `deactivate()` 空函式
- [ ] T013 [US1] 在 `agentflow-js-formatter/test/suite/documentFormatter.test.ts` 新增整合測試：（1）縮排錯誤 JS → 格式化後符合 Prettier 標準；（2）三個以上連續空白行 → 壓縮為一個空白行；（3）[Manual Verification] 非 `javascript` 語言 ID 的檔案不觸發——由 `activationEvents` 及格式化提供者語言過濾保障，不需撰寫自動化測試案例，於 README 記錄即可；（4）空白檔案 → 回傳空字串不拋出錯誤

**Checkpoint**: US1 應於此點已獨立完整運作——儲存 `.js` 檔案即自動套用格式化與空白行壓縮

---

## Phase 4: User Story 2 — 保留自訂 `{鍵名:` 語法（Priority: P1）

**Goal**: 格式化過程中，所有獨立成行的 `{KEY:\n...\n}` 自訂語法區塊完整保留，鍵名不被加引號、`{KEY:` 整行不被拆行或重排

**Independent Test**: 建立包含 `{初始化:\n  doSomething();\n}` 的 `.js` 檔案並觸發格式化，驗證鍵名與換行結構完全未被修改；不需依賴 US1 以外的任何功能

### 測試（Test tasks for US2）

- [ ] T014 [P] [US2] 在 `agentflow-js-formatter/test/suite/customBlockDetector.test.ts` 撰寫 `CustomBlockDetector` 單元測試：（1）英文鍵名偵測；（2）中文鍵名偵測；（3）字串內的 `{KEY:` 不觸發；（4）行內註解內的 `{KEY:` 不觸發；（5）`extract()` → `restore()` round-trip 正確；（6）巢狀大括號的 brace depth 計算；（7）不含自訂語法的文字傳回原始文字

### 實作（Implementation for US2）

- [ ] T015 [US2] 在 `agentflow-js-formatter/src/formatter/customBlockDetector.ts` 實作 `detect()` 方法：以行為單位掃描 `sourceText`，同步追蹤字串（`'`、`"`、`` ` ``）與註解（`//`、`/* */`）上下文；當不在字串/註解內且當前行符合 `/^[\t ]*\{[^}\n]+:\s*$/` 時標記為區塊起始；以 brace depth counting（初始深度 1，遇 `{` +1、遇 `}` -1，歸零即為結尾行）確定 `endLine`；回傳 `CustomBlock[]`
- [ ] T016 [US2] 在 `agentflow-js-formatter/src/formatter/customBlockDetector.ts` 實作 `extract()` 與 `restore()` 方法：`extract()` 呼叫 `detect()`，以 `"__AGENTFLOW_BLOCK_<index>__"` 佔位符字串取代每個區塊（佔位符為合法 JS 字串表達式），回傳 `{ extractedText, blocks }`；`restore()` 將 `extractedText` 中的每個佔位符替換回對應 `block.originalText`
- [ ] T017 [US2] 更新 `agentflow-js-formatter/src/formatter/documentFormatter.ts`，在 `DocumentFormatter.format()` 中整合 `CustomBlockDetector`：流程改為 `extract()` → `JsFormatter.format()` → `restore()` → `BlankLineCompressor.compress()`；若 `extractedText` 仍含語法錯誤由 `JsFormatter` 拋出並捕捉
- [ ] T018 [US2] 在 `agentflow-js-formatter/test/suite/documentFormatter.test.ts` 新增自訂語法整合測試：（1）`{ALL:\n...\n}` 格式化後第一行仍為 `{ALL:` 不被拆行；（2）中文鍵名 `{初始化:` 保持不變；（3）混合英文、中文、數字鍵名的多個區塊均保留；（4）普通 JS 物件 `{ key: "value" }` 仍依標準規則格式化；（5）語法錯誤檔案回傳 `[]` 不拋出例外

**Checkpoint**: US1 + US2 應於此點均完整運作——格式化保留自訂語法且不破壞標準 JS 格式化

---

## Phase 5: User Story 3 — 打包外掛為可安裝檔案（Priority: P2）

**Goal**: 執行打包指令後產出 `agentflow-<版本>.vsix`，可在另一 VS Code 實例離線安裝

**Independent Test**: 執行 `npm run package` 後確認 `agentflow-js-formatter/` 目錄產出 `.vsix` 檔案；此故事不依賴 US1/US2 的運行（但需要 compile 成功）

### 實作（Implementation for US3）

- [ ] T019 [US3] 更新 `agentflow-js-formatter/package.json`：（1）補充 `version`、`description`、`categories: ["Formatter"]` 等 Marketplace 必填欄位；（2）新增 `scripts.compile: "tsc -p ./"` 與 `scripts.package: "vsce package"`；（3）新增 `"vsce": { "dependencies": true }` 確保 `prettier` 打包進 `.vsix`；（4）確認 `main: "./out/extension.js"` 正確
- [ ] T020 [US3] 驗證並修正 `agentflow-js-formatter/.vscodeignore`：確認排除 `src/**`、`test/**`、`tsconfig.json`、`.vscode-test/**`，保留 `out/**`、`package.json`、`README.md`（若存在）；排除 `node_modules/@vscode/vsce` 以減少封裝體積
- [ ] T021 [US3] **（相依 T019 完成）** 在 `agentflow-js-formatter/` 執行 `npm run compile`，確認 TypeScript 編譯無錯誤後執行 `vsce package`，驗證 `agentflow-js-formatter/agentflow-*.vsix` 檔案產出；記錄打包產物路徑於 `specs/002-agentflow-js-formatter/quickstart.md` 的「打包」章節

**Checkpoint**: US3 完成——`.vsix` 可產出且可安裝

---

## Phase 6: User Story 4 — 手動觸發格式化指令（Priority: P2）

**Goal**: 開發者可透過指令面板執行「Agentflow: Format Document」手動格式化，不依賴儲存動作；非 `.js` 檔案顯示提示訊息

**Independent Test**: 於指令面板搜尋並執行「Agentflow: Format Document」，驗證當前 `.js` 檔案完成格式化；切換至 `.json` 檔案執行同一指令，確認顯示提示訊息而非修改檔案

### 實作（Implementation for US4）

- [ ] T022 [P] [US4] 實作 `agentflow-js-formatter/src/commands/formatDocument.ts`：取得 `vscode.window.activeTextEditor`，若 `document.languageId !== "javascript"` 則呼叫 `showInformationMessage("Agentflow: 僅支援 .js 檔案")` 並提前返回；否則建立 `FormattingContext`，呼叫 `DocumentFormatter.format()`，成功時以 `editor.edit()` 套用 `TextEdit.replace(fullRange, formattedText)`，失敗時呼叫 `showErrorMessage()`
- [ ] T023 [US4] 更新 `agentflow-js-formatter/src/extension.ts` 的 `activate()` — 新增 `vscode.commands.registerCommand("agentflow.formatDocument", formatDocumentHandler)` 並加入 `context.subscriptions`
- [ ] T024 [US4] 更新 `agentflow-js-formatter/package.json` 的 `contributes.commands`，新增 `{ "command": "agentflow.formatDocument", "title": "Agentflow: Format Document" }` 項目

**Checkpoint**: US4 完成——指令面板可手動觸發格式化

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: 確保整體品質、驗證 quickstart.md 流程

- [ ] T025 在 `agentflow-js-formatter/package.json` 補充完整 npm scripts：`pretest: "npm run compile"`、`test: "node ./out/test/runTests.js"`；建立 `agentflow-js-formatter/test/runTests.ts`，使用 `@vscode/test-electron` 程式化 API（`runTests({ extensionDevelopmentPath, extensionTestsPath: path.resolve(__dirname, "./suite/index") })`）作為測試啟動器；此檔案由 `pretest` 編譯後輸出至 `out/test/runTests.js`
- [ ] T026 [P] 執行 `npm test` 確認所有測試通過（`BlankLineCompressor`、`CustomBlockDetector`、`DocumentFormatter` 整合測試）；修正任何失敗的測試案例
- [ ] T027 依照 `specs/002-agentflow-js-formatter/quickstart.md` 執行完整驗收流程：`npm run compile` → `npm test` → `vsce package` → VS Code「從 VSIX 安裝」→ 開啟 `.js` 測試檔案驗證儲存時自動格式化正常運作
- [ ] T028 [P] 建立效能驗收腳本 `agentflow-js-formatter/test/perf/formatPerf.ts`：生成含 1000 行合法 JS 的測試字串，呼叫 `DocumentFormatter.format()`，以 `Date.now()` 計時格式化耗時；以 `npm run perf`（`ts-node test/perf/formatPerf.ts`）獨立執行並斷言 ≤ 500ms（對應 SC-001）；不納入常規 `npm test` 套件

---

## Dependencies & Execution Order

### Phase Dependencies（相依順序）

- **Setup (Phase 1)**: 無相依，可立即開始
- **Foundational (Phase 2)**: 相依 Phase 1 完成；**封鎖所有使用者故事**
- **US1 (Phase 3)**: 相依 Phase 2 完成；無其他相依
- **US2 (Phase 4)**: 相依 Phase 3 完成（需要 DocumentFormatter 基礎版本才能更新它）
- **US3 (Phase 5)**: 相依 Phase 4 完成（compile 必須成功，即 US1+US2 實作完整）
- **US4 (Phase 6)**: 相依 Phase 4 完成（需要 DocumentFormatter 整合版本）
- **Polish (Final Phase)**: 相依所有使用者故事完成

### User Story Dependencies（使用者故事相依）

- **US1 (P1)**: 依賴 Phase 2（Foundational）完成後即可開始，無其他故事相依
- **US2 (P1)**: 依賴 US1 的 `DocumentFormatter` 基礎版本存在才能更新
- **US3 (P2)**: 依賴 US1 + US2 的原始碼可成功編譯
- **US4 (P2)**: 依賴 US2 的 `DocumentFormatter` 整合版本（US4 複用同一格式化邏輯）

### Within Each User Story（故事內部順序）

- 測試任務（`[P]` 標記）可在實作前平行撰寫
- `BlankLineCompressor` / `JsFormatter` → `DocumentFormatter` 基礎版 → `extension.ts`
- `CustomBlockDetector.detect()` → `extract()` + `restore()` → 更新 `DocumentFormatter`
- `formatDocument.ts` 可獨立撰寫，最後在 `extension.ts` 中整合

### Parallel Opportunities（平行執行機會）

- Phase 1：T003、T004 可與 T002 平行執行
- Phase 2：T006、T007、T008 可互相平行（完成 T005 安裝後）
- Phase 3：T009、T010 可在 T011 開始前平行撰寫測試
- Phase 4：T014 測試可在 T015 開始前撰寫；T014 與 T015、T016 可平行
- Phase 6：T022 可在 T023 前平行撰寫

---

## Parallel Example: User Story 1

```text
# 前置：Phase 2 完成後

T009 ─────────────────────────────────────────────┐
T010 ─────────────────────────────────────────────┤ (平行)
                                                  │
T011 ──────────────────────────────────────────── ┤ (相依 T009 完成)
T012 ──────────────────────────────────────────── ┤ (相依 T011 完成)
T013 ──────────────────────────────────────────── ┘ (相依 T011 + T012 完成)
```

## Parallel Example: User Story 2

```text
# 前置：Phase 3 完成後

T014 ───────────────────────────────────────────── (平行，先寫測試)

T015 ──────────────────────────────────────────── (相依無，可直接開始)
T016 ──────────────────────────────────────────── (相依 T015 完成)
T017 ──────────────────────────────────────────── (相依 T015 + T016 完成)
T018 ──────────────────────────────────────────── (相依 T017 完成)
```

---

## Implementation Strategy

### MVP Scope（建議最小可用版本）

**Phase 1 + Phase 2 + Phase 3 = US1 MVP**

完成 T001–T013 即可交付：儲存 `.js` 檔案自動套用 Prettier 格式化與空白行壓縮，是外掛最核心的使用者價值。

### Incremental Delivery（增量交付順序）

1. **MVP**: T001–T013（US1 就緒）
2. **核心差異化**: T014–T018（US2 就緒，自訂語法保護）
3. **可交付性**: T019–T021（US3 就緒，`.vsix` 打包）
4. **完整功能**: T022–T024（US4 就緒，手動指令）
5. **品質驗收**: T025–T028（Final Phase）

### Critical Path（關鍵路徑）

T001 → T002 → T005 → T006 → T008 → T011 → T017 → T019 → T021 → T027 → T028
